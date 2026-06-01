import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../src/server/audit';
import { requireAuthorizedSession } from '../../../src/server/authorization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const session = await requireAuthorizedSession(req, res, 'EMIT_ALERT');
  if (!session) return;

  const { disease, province, alertLevel, casesCount, growthRate, description } = req.body ?? {};
  if (!disease || !province || !alertLevel || !description) {
    return res.status(400).json({ error: 'Payload de alerta invalido.' });
  }

  const alert = {
    id: `alert-${Date.now()}`,
    disease,
    province,
    alertLevel,
    casesCount: Number(casesCount ?? 0),
    growthRate: Number(growthRate ?? 0),
    description,
    date: new Date().toISOString().split('T')[0]
  };

  auditEvent({
    action: 'alerts.create',
    status: 'success',
    session,
    request: req,
    details: { province, disease, alertLevel }
  });

  return res.status(201).json({ alert });
}
