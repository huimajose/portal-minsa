import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../src/server/audit';
import { getSessionCookieName, readCookieValue, readSessionToken } from '../../../src/server/session';
import { fetchStatisticsOverview } from '../../../src/server/statistics-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const raw = readCookieValue(req.headers.cookie, getSessionCookieName());
  const envelope = await readSessionToken(raw);
  if (!envelope?.session || !envelope.accessToken) {
    return res.status(401).json({ error: 'Sessao MINSA invalida ou expirada.' });
  }

  try {
    const data = await fetchStatisticsOverview(envelope.accessToken);
    auditEvent({ action: 'statistics.overview.read', status: 'success', session: envelope.session, request: req });
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    auditEvent({
      action: 'statistics.overview.read', status: 'error', session: envelope.session, request: req,
      details: { message: error instanceof Error ? error.message : 'unknown_error' }
    });
    return res.status(502).json({ error: 'Nao foi possivel consultar as estatisticas do OSIE.' });
  }
}
