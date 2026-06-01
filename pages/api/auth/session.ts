import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchSessionFromAuthService, isAuthServiceConfigured } from '../../../src/server/auth-service';
import { createSessionToken, getSessionCookieName, readCookieValue, readSessionToken, serializeExpiredSessionCookie, serializeSessionCookie, verifySessionToken } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const token = readCookieValue(req.headers.cookie, getSessionCookieName());
  const envelope = await readSessionToken(token);
  const session = envelope?.session || null;

  if (!session) {
    return res.status(401).json({ error: 'Sessao invalida ou expirada.' });
  }

  if (isAuthServiceConfigured()) {
    try {
      const refreshedSession = await fetchSessionFromAuthService(envelope?.accessToken || '');
      if (!refreshedSession) {
        res.setHeader('Set-Cookie', serializeExpiredSessionCookie());
        return res.status(401).json({ error: 'Sessao invalida ou expirada.' });
      }

      const refreshedToken = await createSessionToken(refreshedSession, envelope?.accessToken);
      res.setHeader('Set-Cookie', serializeSessionCookie(refreshedToken));
      return res.status(200).json({ session: refreshedSession });
    } catch (error) {
      return res.status(502).json({
        error: error instanceof Error ? error.message : 'Falha ao validar sessao no backend.'
      });
    }
  }

  return res.status(200).json({ session });
}
