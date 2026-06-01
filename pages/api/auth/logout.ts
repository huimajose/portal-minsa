import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthServiceConfigured, logoutFromAuthService } from '../../../src/server/auth-service';
import { getSessionCookieName, readCookieValue, readSessionToken, serializeExpiredSessionCookie } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  if (isAuthServiceConfigured()) {
    try {
      const rawToken = readCookieValue(req.headers.cookie, getSessionCookieName());
      const envelope = await readSessionToken(rawToken);
      if (envelope?.accessToken) {
        await logoutFromAuthService(envelope.accessToken);
      }
    } catch {
      // Logout should still clear local session even if backend revocation fails.
    }
  }

  res.setHeader('Set-Cookie', serializeExpiredSessionCookie());
  return res.status(200).json({ success: true });
}
