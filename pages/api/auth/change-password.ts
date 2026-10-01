import type { NextApiRequest, NextApiResponse } from 'next';
import { auditEvent } from '../../../src/server/audit';
import { resetPasswordWithAuthService } from '../../../src/server/auth-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const { resetToken, newPassword } = req.body ?? {};
  if (typeof resetToken !== 'string' || !resetToken || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'Token e nova palavra-passe valida sao obrigatorios.' });
  }

  try {
    await resetPasswordWithAuthService(resetToken, newPassword);
    auditEvent({ action: 'auth.password.change', status: 'success', request: req, details: { provider: 'auth-service' } });
    return res.status(200).json({ success: true });
  } catch (error) {
    auditEvent({
      action: 'auth.password.change',
      status: 'denied',
      request: req,
      details: { provider: 'auth-service', message: error instanceof Error ? error.message : 'unknown_error' }
    });
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Falha ao definir nova palavra-passe.' });
  }
}
