import { UserSession } from '../types';

interface AuthServiceLoginResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  session?: Partial<UserSession>;
  user?: Partial<UserSession>;
  requiresOtp?: boolean;
  requiresMfa?: boolean;
  challengeId?: string;
}

interface AuthServiceMeResponse {
  session?: Partial<UserSession>;
  user?: Partial<UserSession>;
}

interface AuthServiceRefreshResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  session?: Partial<UserSession>;
  user?: Partial<UserSession>;
}

export interface AuthenticatedAuthResult {
  status: 'authenticated';
  session: UserSession;
  accessToken: string;
  refreshToken?: string;
}

export interface OtpRequiredAuthResult {
  status: 'otp_required';
  challengeId: string;
}

export type AuthServiceLoginResult = AuthenticatedAuthResult | OtpRequiredAuthResult;

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

function getRefreshPath(): string {
  return process.env.AUTH_SERVICE_REFRESH_PATH || '/api/auth/refresh';
}

function getOtpPath(): string {
  return process.env.AUTH_SERVICE_OTP_PATH || '/api/auth/verify-otp';
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

export async function loginWithAuthService(username: string, password: string): Promise<AuthServiceLoginResult> {
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

  if (data.requiresOtp || data.requiresMfa) {
    if (!data.challengeId) {
      throw new Error('O auth-service exigiu OTP/MFA sem devolver challengeId.');
    }

    return {
      status: 'otp_required',
      challengeId: data.challengeId
    };
  }

  const accessToken = data.token || data.accessToken;
  const session = normalizeSession(data.session || data.user);

  if (!accessToken || !session) {
    throw new Error('Resposta invalida do auth-service durante o login.');
  }

  return {
    status: 'authenticated',
    session,
    accessToken,
    refreshToken: data.refreshToken
  };
}

export async function verifyOtpWithAuthService(challengeId: string, otp: string): Promise<AuthenticatedAuthResult> {
  const response = await fetch(buildUrl(getOtpPath()), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ challengeId, otp })
  });

  const data = await parseJson<AuthServiceLoginResponse & { error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha ao validar OTP/MFA no auth-service.');
  }

  const accessToken = data.token || data.accessToken;
  const session = normalizeSession(data.session || data.user);

  if (!accessToken || !session) {
    throw new Error('Resposta invalida do auth-service durante a validacao de OTP/MFA.');
  }

  return {
    status: 'authenticated',
    session,
    accessToken,
    refreshToken: data.refreshToken
  };
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

export async function refreshSessionWithAuthService(refreshToken: string): Promise<{ session: UserSession; accessToken: string; refreshToken?: string } | null> {
  const response = await fetch(buildUrl(getRefreshPath()), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return null;
  }

  const data = await parseJson<AuthServiceRefreshResponse & { error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha ao renovar sessao no auth-service.');
  }

  const accessToken = data.token || data.accessToken;
  const session = normalizeSession(data.session || data.user);
  if (!accessToken || !session) {
    return null;
  }

  return {
    session,
    accessToken,
    refreshToken: data.refreshToken || refreshToken
  };
}
