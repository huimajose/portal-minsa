import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../src/server/audit';
import { fetchSessionFromAuthService, isAuthServiceConfigured, refreshSessionWithAuthService } from '../../../src/server/auth-service';
import { createSessionToken, getSessionCookieName, readCookieValue, readSessionToken, serializeExpiredSessionCookie, serializeSessionCookie } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const token = readCookieValue(req.headers.cookie, getSessionCookieName());
  const envelope = await readSessionToken(token);
  const session = envelope?.session || null;

  if (!session) {
    auditEvent({ action: 'auth.me', status: 'denied', request: req, details: { reason: 'missing_session' } });
    return res.status(401).json({ error: 'Sessao invalida ou expirada.' });
  }

  if (isAuthServiceConfigured()) {
    try {
      const refreshedSession = await fetchSessionFromAuthService(envelope?.accessToken || '');
      if (!refreshedSession) {
        const rotated = envelope?.refreshToken ? await refreshSessionWithAuthService(envelope.refreshToken) : null;
        if (!rotated) {
          res.setHeader('Set-Cookie', serializeExpiredSessionCookie());
          auditEvent({
            action: 'auth.me',
            status: 'denied',
            session,
            request: req,
            details: { reason: 'expired_after_refresh_attempt' }
          });
          return res.status(401).json({ error: 'Sessao invalida ou expirada.' });
        }

        const rotatedToken = await createSessionToken(rotated.session, rotated.accessToken, rotated.refreshToken);
        res.setHeader('Set-Cookie', serializeSessionCookie(rotatedToken));
        auditEvent({ action: 'auth.me.refresh', status: 'success', session: rotated.session, request: req });
        return res.status(200).json({ session: rotated.session });
      }

      const refreshedToken = await createSessionToken(refreshedSession, envelope?.accessToken, envelope?.refreshToken);
      res.setHeader('Set-Cookie', serializeSessionCookie(refreshedToken));
      auditEvent({ action: 'auth.me', status: 'success', session: refreshedSession, request: req });
      return res.status(200).json({ session: refreshedSession });
    } catch (error) {
      auditEvent({
        action: 'auth.me',
        status: 'error',
        session,
        request: req,
        details: { message: error instanceof Error ? error.message : 'unknown_error' }
      });
      return res.status(502).json({
        error: error instanceof Error ? error.message : 'Falha ao validar sessao no backend.'
      });
    }
  }

  auditEvent({ action: 'auth.me', status: 'success', session, request: req, details: { provider: 'demo' } });
  return res.status(200).json({ session });
}
