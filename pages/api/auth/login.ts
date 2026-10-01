import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateDemoUser } from '../../../src/server/auth-users';
import { auditEvent } from '../../../src/server/audit';
import { isAuthServiceConfigured, loginWithAuthService } from '../../../src/server/auth-service';
import { createSessionToken, serializeAccessTokenCookie, serializeRefreshTokenCookie, serializeSessionCookie } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Credenciais invalidas.' });
  }

  try {
    if (isAuthServiceConfigured()) {
      const result = await loginWithAuthService(username, password);
      if (result.status === 'otp_required') {
        auditEvent({
          action: 'auth.login.challenge',
          status: 'success',
          request: req,
          details: { provider: 'auth-service', username, challengeId: result.challengeId }
        });
        return res.status(202).json({ requiresOtp: true, challengeId: result.challengeId });
      }

      const { session, accessToken, refreshToken } = result;
      const token = await createSessionToken(session);
      res.setHeader('Set-Cookie', [
        serializeSessionCookie(token),
        serializeAccessTokenCookie(accessToken),
        ...(refreshToken ? [serializeRefreshTokenCookie(refreshToken)] : [])
      ]);
      auditEvent({ action: 'auth.login', status: 'success', session, request: req, details: { provider: 'auth-service' } });
      return res.status(200).json({ session });
    }

    const session = authenticateDemoUser(username, password);
    if (!session) {
      auditEvent({
        action: 'auth.login',
        status: 'denied',
        request: req,
        details: { provider: 'demo', username }
      });
      return res.status(401).json({ error: 'Credenciais invalidas. Verifique o utilizador e a palavra-passe.' });
    }

    const token = await createSessionToken(session);
    res.setHeader('Set-Cookie', serializeSessionCookie(token));
    auditEvent({ action: 'auth.login', status: 'success', session, request: req, details: { provider: 'demo' } });

    return res.status(200).json({ session });
  } catch (error) {
    auditEvent({
      action: 'auth.login',
      status: 'error',
      request: req,
      details: { message: error instanceof Error ? error.message : 'unknown_error', username }
    });
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Falha ao autenticar no backend.'
    });
  }
}
