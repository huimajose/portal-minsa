import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../src/server/audit';
import { getSessionCookieName, readCookieValue, readSessionToken } from '../../../src/server/session';
import { fetchStatisticsReadiness } from '../../../src/server/statistics-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const raw = readCookieValue(req.headers.cookie, getSessionCookieName());
  const envelope = await readSessionToken(raw);
  if (!envelope?.session) return res.status(401).json({ error: 'Sessao MINSA invalida ou expirada.' });

  try {
    const statistics = await fetchStatisticsReadiness();
    auditEvent({ action: 'system.status.read', status: 'success', session: envelope.session, request: req });
    return res.status(200).json({
      status: 'success',
      data: {
        portal: 'ok',
        statistics_service: statistics.status === 'ready' ? 'ok' : statistics.status,
        auth_service: statistics.auth,
        database_manager: statistics.database_manager
      }
    });
  } catch (error) {
    auditEvent({ action: 'system.status.read', status: 'error', session: envelope.session, request: req });
    return res.status(503).json({
      status: 'degraded',
      data: { portal: 'ok', statistics_service: 'degraded', auth_service: 'unknown', database_manager: 'unknown' }
    });
  }
}
