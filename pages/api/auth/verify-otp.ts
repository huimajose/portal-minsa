import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../src/server/audit';
import { isAuthServiceConfigured, verifyOtpWithAuthService } from '../../../src/server/auth-service';
import { createSessionToken, serializeAccessTokenCookie, serializeRefreshTokenCookie, serializeSessionCookie } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  if (!isAuthServiceConfigured()) {
    return res.status(501).json({ error: 'Validacao OTP/MFA disponivel apenas com auth-service configurado.' });
  }

  const { challengeId, otp } = req.body ?? {};
  if (typeof challengeId !== 'string' || typeof otp !== 'string' || !challengeId || !otp) {
    return res.status(400).json({ error: 'challengeId e otp sao obrigatorios.' });
  }

  try {
    const result = await verifyOtpWithAuthService(challengeId, otp);
    if (result.status === 'password_change_required') {
      auditEvent({
        action: 'auth.password.change.required',
        status: 'success',
        request: req,
        details: { provider: 'auth-service', challengeId }
      });
      return res.status(202).json({
        passwordChangeRequired: true,
        resetToken: result.resetToken,
        message: result.message
      });
    }

    const { session, accessToken, refreshToken } = result;
    const token = await createSessionToken(session);
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(token),
      serializeAccessTokenCookie(accessToken),
      ...(refreshToken ? [serializeRefreshTokenCookie(refreshToken)] : [])
    ]);
    auditEvent({
      action: 'auth.otp.verify',
      status: 'success',
      session,
      request: req,
      details: { provider: 'auth-service', challengeId }
    });
    return res.status(200).json({ session });
  } catch (error) {
    auditEvent({
      action: 'auth.otp.verify',
      status: 'denied',
      request: req,
      details: {
        provider: 'auth-service',
        challengeId,
        message: error instanceof Error ? error.message : 'unknown_error'
      }
    });
    return res.status(401).json({
      error: error instanceof Error ? error.message : 'Falha ao validar OTP/MFA.'
    });
  }
}
