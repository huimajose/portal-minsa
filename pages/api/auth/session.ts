import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionCookieName, readCookieValue, verifySessionToken } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const token = readCookieValue(req.headers.cookie, getSessionCookieName());
  const session = await verifySessionToken(token);

  if (!session) {
    return res.status(401).json({ error: 'Sessao invalida ou expirada.' });
  }

  return res.status(200).json({ session });
}
