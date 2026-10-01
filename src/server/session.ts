import { UserSession } from '../types';

const SESSION_COOKIE_NAME = 'minsa_session';
const ACCESS_TOKEN_COOKIE_NAME = 'minsa_access';
const REFRESH_TOKEN_COOKIE_NAME = 'minsa_refresh';
const SESSION_TTL_SECONDS = 60 * 60;

export interface SessionEnvelope {
  session: UserSession;
  accessToken?: string;
  refreshToken?: string;
  exp: number;
}

function getSessionSecret(): string {
  return process.env.MINSA_SESSION_SECRET || 'dev-only-minsa-session-secret-change-me';
}

function base64UrlEncode(value: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(value, 'utf-8')
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  return btoa(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof window === 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf-8');
  }

  return atob(padded);
}

async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(payload));
  const bytes = Array.from(new Uint8Array(signatureBuffer));
  const raw = String.fromCharCode(...bytes);

  return base64UrlEncode(raw);
}

export async function createSessionToken(session: UserSession, accessToken?: string, refreshToken?: string): Promise<string> {
  const envelope: SessionEnvelope = {
    session,
    accessToken,
    refreshToken,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const payload = base64UrlEncode(JSON.stringify(envelope));
  const signature = await sign(payload);

  return `${payload}.${signature}`;
}

export async function readSessionToken(token: string | undefined): Promise<SessionEnvelope | null> {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = await sign(payload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const envelope = JSON.parse(base64UrlDecode(payload)) as SessionEnvelope;
    const now = Math.floor(Date.now() / 1000);
    if (envelope.exp < now) {
      return null;
    }
    return envelope;
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string | undefined): Promise<UserSession | null> {
  const envelope = await readSessionToken(token);
  return envelope?.session || null;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getAccessTokenCookieName(): string {
  return ACCESS_TOKEN_COOKIE_NAME;
}

export function getRefreshTokenCookieName(): string {
  return REFRESH_TOKEN_COOKIE_NAME;
}

export function serializeSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function serializeHttpOnlyCookie(name: string, value: string, maxAge = SESSION_TTL_SECONDS): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function serializeAccessTokenCookie(token: string): string {
  return serializeHttpOnlyCookie(ACCESS_TOKEN_COOKIE_NAME, token);
}

export function serializeRefreshTokenCookie(token: string): string {
  return serializeHttpOnlyCookie(REFRESH_TOKEN_COOKIE_NAME, token);
}

export function serializeExpiredSessionCookie(): string {
  return serializeHttpOnlyCookie(SESSION_COOKIE_NAME, '', 0);
}

export function serializeExpiredAuthCookies(): string[] {
  return [
    serializeHttpOnlyCookie(SESSION_COOKIE_NAME, '', 0),
    serializeHttpOnlyCookie(ACCESS_TOKEN_COOKIE_NAME, '', 0),
    serializeHttpOnlyCookie(REFRESH_TOKEN_COOKIE_NAME, '', 0)
  ];
}

export function readCookieValue(rawCookieHeader: string | undefined, cookieName: string): string | undefined {
  if (!rawCookieHeader) return undefined;

  const entries = rawCookieHeader.split(';').map((entry) => entry.trim());
  const matched = entries.find((entry) => entry.startsWith(`${cookieName}=`));
  return matched ? matched.slice(cookieName.length + 1) : undefined;
}
