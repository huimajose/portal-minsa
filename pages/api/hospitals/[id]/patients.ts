import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../../src/server/audit';
import { requireAuthorizedSession } from '../../../../src/server/authorization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const session = await requireAuthorizedSession(req, res, 'ADMIT_PATIENT');
  if (!session) return;

  const hospitalId = typeof req.query.id === 'string' ? req.query.id : null;
  const { disease, isHospitalized, triageLevel } = req.body ?? {};
  if (!hospitalId || !disease || !triageLevel || typeof isHospitalized !== 'boolean') {
    return res.status(400).json({ error: 'Payload de admissao invalido.' });
  }

  auditEvent({
    action: 'hospitals.patients.create',
    status: 'success',
    session,
    request: req,
    details: { hospitalId, disease, triageLevel, isHospitalized }
  });

  return res.status(201).json({
    success: true,
    hospitalId,
    accepted: true
  });
}
