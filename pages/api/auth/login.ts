import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateDemoUser } from '../../../src/server/auth-users';
import { isAuthServiceConfigured, loginWithAuthService } from '../../../src/server/auth-service';
import { createSessionToken, serializeSessionCookie } from '../../../src/server/session';

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
      const { session, accessToken } = await loginWithAuthService(username, password);
      const token = await createSessionToken(session, accessToken);
      res.setHeader('Set-Cookie', serializeSessionCookie(token));
      return res.status(200).json({ session });
    }

    const session = authenticateDemoUser(username, password);
    if (!session) {
      return res.status(401).json({ error: 'Credenciais invalidas. Verifique o utilizador e a palavra-passe.' });
    }

    const token = await createSessionToken(session);
    res.setHeader('Set-Cookie', serializeSessionCookie(token));

    return res.status(200).json({ session });
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Falha ao autenticar no backend.'
    });
  }
}
