import type { NextApiRequest, NextApiResponse } from 'next';
import { hasPermission, SecureAction } from '../lib/permissions';
import { UserSession } from '../types';
import { auditEvent } from './audit';
import { getSessionCookieName, readCookieValue, readSessionToken, serializeExpiredSessionCookie } from './session';

export async function getServerSessionFromRequest(req: NextApiRequest): Promise<UserSession | null> {
  const rawToken = readCookieValue(req.headers.cookie, getSessionCookieName());
  const envelope = await readSessionToken(rawToken);
  return envelope?.session || null;
}

export async function requireAuthorizedSession(
  req: NextApiRequest,
  res: NextApiResponse,
  action?: SecureAction
): Promise<UserSession | null> {
  const session = await getServerSessionFromRequest(req);

  if (!session) {
    auditEvent({
      action: action ? `require:${action}` : 'require:session',
      status: 'denied',
      request: req,
      details: { reason: 'missing_or_invalid_session' }
    });
    res.setHeader('Set-Cookie', serializeExpiredSessionCookie());
    res.status(401).json({ error: 'Sessao invalida ou expirada.' });
    return null;
  }

  if (action && !hasPermission(session, action)) {
    auditEvent({
      action: `require:${action}`,
      status: 'denied',
      session,
      request: req,
      details: { reason: 'missing_claim' }
    });
    res.status(403).json({ error: 'Permissao insuficiente para esta operacao.' });
    return null;
  }

  return session;
}
