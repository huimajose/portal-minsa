import { UserSession } from '../types';

interface AuthServiceLoginResponse {
  token?: string;
  accessToken?: string;
  session?: Partial<UserSession>;
  user?: Partial<UserSession>;
}

interface AuthServiceMeResponse {
  session?: Partial<UserSession>;
  user?: Partial<UserSession>;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getBaseUrl(): string | null {
  return process.env.AUTH_SERVICE_BASE_URL || null;
}

function buildUrl(path: string): string {
  const baseUrl = getRequiredEnv('AUTH_SERVICE_BASE_URL');
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

function getLoginPath(): string {
  return process.env.AUTH_SERVICE_LOGIN_PATH || '/api/auth/login';
}

function getSessionPath(): string {
  return process.env.AUTH_SERVICE_ME_PATH || '/api/auth/me';
}

function getLogoutPath(): string {
  return process.env.AUTH_SERVICE_LOGOUT_PATH || '/api/auth/logout';
}

function normalizeSession(rawSession: Partial<UserSession> | undefined): UserSession | null {
  if (!rawSession?.username || !rawSession?.name || !rawSession?.role) {
    return null;
  }

  return {
    username: rawSession.username,
    name: rawSession.name,
    role: rawSession.role,
    province: rawSession.province,
    permissions: rawSession.permissions
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export function isAuthServiceConfigured(): boolean {
  return Boolean(getBaseUrl());
}

export async function loginWithAuthService(username: string, password: string): Promise<{ session: UserSession; accessToken: string }> {
  const response = await fetch(buildUrl(getLoginPath()), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await parseJson<AuthServiceLoginResponse & { error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha ao autenticar no auth-service.');
  }

  const accessToken = data.token || data.accessToken;
  const session = normalizeSession(data.session || data.user);

  if (!accessToken || !session) {
    throw new Error('Resposta invalida do auth-service durante o login.');
  }

  return { session, accessToken };
}

export async function fetchSessionFromAuthService(accessToken: string): Promise<UserSession | null> {
  const response = await fetch(buildUrl(getSessionPath()), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  const data = await parseJson<AuthServiceMeResponse & { error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha ao consultar sessao no auth-service.');
  }

  return normalizeSession(data.session || data.user);
}

export async function logoutFromAuthService(accessToken: string): Promise<void> {
  const response = await fetch(buildUrl(getLogoutPath()), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    return;
  }

  if (!response.ok) {
    const data = await parseJson<{ error?: string; message?: string }>(response);
    throw new Error(data.error || data.message || 'Falha ao encerrar sessao no auth-service.');
  }
}
