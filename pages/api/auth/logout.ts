import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../src/server/audit';
import { isAuthServiceConfigured, logoutFromAuthService } from '../../../src/server/auth-service';
import { getAccessTokenCookieName, getRefreshTokenCookieName, getSessionCookieName, readCookieValue, readSessionToken, serializeExpiredAuthCookies } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  if (isAuthServiceConfigured()) {
    try {
      const rawToken = readCookieValue(req.headers.cookie, getSessionCookieName());
      const envelope = await readSessionToken(rawToken);
      const refreshToken = readCookieValue(req.headers.cookie, getRefreshTokenCookieName()) || envelope?.refreshToken;
      const accessToken = readCookieValue(req.headers.cookie, getAccessTokenCookieName()) || envelope?.accessToken;
      if (refreshToken || accessToken) {
        await logoutFromAuthService(refreshToken || accessToken || '');
      }
      auditEvent({ action: 'auth.logout', status: 'success', session: envelope?.session || null, request: req });
    } catch {
      auditEvent({ action: 'auth.logout', status: 'error', request: req, details: { provider: 'auth-service' } });
    }
  } else {
    const rawToken = readCookieValue(req.headers.cookie, getSessionCookieName());
    const envelope = await readSessionToken(rawToken);
    auditEvent({ action: 'auth.logout', status: 'success', session: envelope?.session || null, request: req, details: { provider: 'demo' } });
  }

  res.setHeader('Set-Cookie', serializeExpiredAuthCookies());
  return res.status(200).json({ success: true });
}
