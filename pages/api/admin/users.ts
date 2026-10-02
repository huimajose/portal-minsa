import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchAdministrativeUsers } from '../../../src/server/auth-service';
import { auditEvent } from '../../../src/server/audit';
import { getAccessTokenCookieName, getSessionCookieName, readCookieValue, readSessionToken } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }
  const raw = readCookieValue(req.headers.cookie, getSessionCookieName());
  const envelope = await readSessionToken(raw);
  const accessToken = readCookieValue(req.headers.cookie, getAccessTokenCookieName()) || envelope?.accessToken;
  if (!envelope?.session || !accessToken) return res.status(401).json({ error: 'Sessao MINSA invalida ou expirada.' });

  try {
    const users = await fetchAdministrativeUsers(accessToken);
    auditEvent({ action: 'admin.users.directory.read', status: 'success', session: envelope.session, request: req });
    return res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    auditEvent({ action: 'admin.users.directory.read', status: 'error', session: envelope.session, request: req,
      details: { message: error instanceof Error ? error.message : 'unknown_error' } });
    return res.status(502).json({ error: 'Nao foi possivel consultar o diretório administrativo.' });
  }
}
