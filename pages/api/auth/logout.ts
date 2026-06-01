import type { NextApiRequest, NextApiResponse } from 'next';
import { serializeExpiredSessionCookie } from '../../../src/server/session';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  res.setHeader('Set-Cookie', serializeExpiredSessionCookie());
  return res.status(200).json({ success: true });
}
