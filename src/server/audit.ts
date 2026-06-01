import type { NextApiRequest } from 'next';
import { UserSession } from '../types';

interface AuditEvent {
  action: string;
  status: 'success' | 'denied' | 'error';
  session?: UserSession | null;
  details?: Record<string, unknown>;
  request?: NextApiRequest;
}

function getClientIp(request?: NextApiRequest): string | undefined {
  const forwarded = request?.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  return request?.socket?.remoteAddress;
}

export function auditEvent(event: AuditEvent) {
  const payload = {
    timestamp: new Date().toISOString(),
    action: event.action,
    status: event.status,
    user: event.session
      ? {
          username: event.session.username,
          role: event.session.role,
          province: event.session.province
        }
      : null,
    ip: getClientIp(event.request),
    details: event.details || {}
  };

  const line = `[AUDIT] ${JSON.stringify(payload)}`;
  if (event.status === 'error') {
    console.error(line);
  } else {
    console.info(line);
  }
}
