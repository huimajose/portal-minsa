import { getDefaultPermissionsForRole, SecureAction } from '../lib/permissions';
import { UserRole, UserSession } from '../types';

interface AuthServiceLoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  session?: Partial<UserSession>;
  user?: Partial<UserSession>;
  requiresOtp?: boolean;
  requiresMfa?: boolean;
  challengeId?: string;
  identifier?: string;
}

interface AuthServiceProfileResponse {
  id?: number | string;
  username?: string;
  email?: string;
  role?: string | null;
  user_type?: string | null;
  display_name?: string | null;
  organization_name?: string | null;
  custom_scopes?: string[] | null;
}

interface DecodedTokenPayload {
  identity_data?: {
    id?: number | string;
    username?: string;
    email?: string;
    display_name?: string;
    role?: string | null;
    user_type?: string | null;
    organization_name?: string | null;
    scopes?: string[];
  };
  sub?: string;
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
  return process.env.AUTH_SERVICE_LOGIN_PATH || '/auth/login';
}

function getSessionPath(): string {
  return process.env.AUTH_SERVICE_ME_PATH || '/auth/profile';
}

function getLogoutPath(): string {
  return process.env.AUTH_SERVICE_LOGOUT_PATH || '/auth/token/revoke';
}

function getRefreshPath(): string {
  return process.env.AUTH_SERVICE_REFRESH_PATH || '/auth/token/refresh';
}

function getOtpPath(): string {
  return process.env.AUTH_SERVICE_OTP_PATH || '/auth/verify-otp';
}

function decodeJwtPayload(token: string): DecodedTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json) as DecodedTokenPayload;
  } catch {
    return null;
  }
}

function normalizeRole(rawRole: string | null | undefined, scopes: string[] = []): UserRole {
  const value = (rawRole || '').trim().toUpperCase();

  if (value === 'ADMIN_MINSA' || value === 'ANALISTA' || value === 'GESTOR_PROVINCIAL' || value === 'VISUALIZADOR') {
    return value;
  }

  if (value.includes('ADMIN')) return 'ADMIN_MINSA';
  if (value.includes('ANALIST')) return 'ANALISTA';
  if (value.includes('GESTOR') || value.includes('PROVINC')) return 'GESTOR_PROVINCIAL';
  if (value.includes('VIEW') || value.includes('READ')) return 'VISUALIZADOR';

  if (scopes.some((scope) => scope.includes('users:') || scope.includes('organizations:write'))) {
    return 'ADMIN_MINSA';
  }
  if (scopes.some((scope) => scope.includes('reports:') || scope.includes('alerts:'))) {
    return 'ANALISTA';
  }
  if (scopes.some((scope) => scope.includes('patients:') || scope.includes('admissions:'))) {
    return 'GESTOR_PROVINCIAL';
  }

  return 'VISUALIZADOR';
}

function mapScopesToPermissions(scopes: string[], role: UserRole): SecureAction[] {
  const permissions = new Set<SecureAction>(getDefaultPermissionsForRole(role));

  for (const scope of scopes) {
    const normalized = scope.toLowerCase();
    if (normalized.includes('patient') || normalized.includes('admission')) {
      permissions.add('ADMIT_PATIENT');
    }
    if (normalized.includes('alert')) {
      permissions.add('EMIT_ALERT');
    }
    if (normalized.includes('report')) {
      permissions.add('RUN_REPORTS');
    }
    if (normalized.includes('profile.read') || normalized.includes('organizations:read') || normalized.includes('province')) {
      permissions.add('VIEW_ALL_PROVINCES');
    }
    if (normalized.includes('export')) {
      permissions.add('EXPORT_XLSX');
    }
    if (normalized.includes('users:') || normalized.includes('admin')) {
      permissions.add('MANAGE_USERS');
    }
  }

  return Array.from(permissions);
}

function buildSessionFromSources(
  profile: AuthServiceProfileResponse | null,
  decoded: DecodedTokenPayload | null
): UserSession | null {
  const identity = decoded?.identity_data;
  const scopes = [
    ...(Array.isArray(identity?.scopes) ? identity.scopes : []),
    ...(Array.isArray(profile?.custom_scopes) ? profile.custom_scopes : [])
  ];

  const username = profile?.username || identity?.username;
  const name = profile?.display_name || identity?.display_name || username;
  const role = normalizeRole(identity?.role || profile?.role || profile?.user_type || identity?.user_type, scopes);

  if (!username || !name || !role) {
    return null;
  }

  return {
    username,
    name,
    role,
    province: undefined,
    permissions: mapScopesToPermissions(scopes, role)
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

async function resolveSessionFromAccessToken(accessToken: string): Promise<UserSession | null> {
  const decoded = decodeJwtPayload(accessToken);
  const identity = decoded?.identity_data;
  const userId = identity?.id || decoded?.sub;

  if (!userId) {
    return buildSessionFromSources(null, decoded);
  }

  const response = await fetch(`${buildUrl(getSessionPath())}/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return buildSessionFromSources(null, decoded);
  }

  const data = await parseJson<AuthServiceProfileResponse & { error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha ao consultar perfil no auth-service.');
  }

  return buildSessionFromSources(data, decoded);
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

  if (data.requiresOtp || data.requiresMfa || data.identifier) {
    const challengeId = data.challengeId || data.identifier;
    if (!challengeId) {
      throw new Error('O auth-service exigiu OTP/MFA sem devolver identificador de desafio.');
    }

    return {
      status: 'otp_required',
      challengeId
    };
  }

  const accessToken = data.token || data.accessToken || data.access_token;
  if (!accessToken) {
    throw new Error('Resposta invalida do auth-service durante o login.');
  }

  const session = await resolveSessionFromAccessToken(accessToken);
  if (!session) {
    throw new Error('Nao foi possivel montar a sessao do utilizador autenticado.');
  }

  return {
    status: 'authenticated',
    session,
    accessToken,
    refreshToken: data.refreshToken || data.refresh_token
  };
}

export async function verifyOtpWithAuthService(challengeId: string, otp: string): Promise<AuthenticatedAuthResult> {
  const response = await fetch(buildUrl(getOtpPath()), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identifier: challengeId, otp_code: otp })
  });

  const data = await parseJson<AuthServiceLoginResponse & { error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha ao validar OTP/MFA no auth-service.');
  }

  const accessToken = data.token || data.accessToken || data.access_token;
  if (!accessToken) {
    throw new Error('Resposta invalida do auth-service durante a validacao de OTP/MFA.');
  }

  const session = await resolveSessionFromAccessToken(accessToken);
  if (!session) {
    throw new Error('Nao foi possivel montar a sessao apos validar OTP/MFA.');
  }

  return {
    status: 'authenticated',
    session,
    accessToken,
    refreshToken: data.refreshToken || data.refresh_token
  };
}

export async function fetchSessionFromAuthService(accessToken: string): Promise<UserSession | null> {
  if (!accessToken) {
    return null;
  }

  return resolveSessionFromAccessToken(accessToken);
}

export async function logoutFromAuthService(token: string): Promise<void> {
  const response = await fetch(buildUrl(getLogoutPath()), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
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

export async function refreshSessionWithAuthService(
  refreshToken: string
): Promise<{ session: UserSession; accessToken: string; refreshToken?: string } | null> {
  const response = await fetch(buildUrl(getRefreshPath()), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return null;
  }

  const data = await parseJson<AuthServiceLoginResponse & { error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha ao renovar sessao no auth-service.');
  }

  const accessToken = data.token || data.accessToken || data.access_token;
  if (!accessToken) {
    return null;
  }

  const session = await resolveSessionFromAccessToken(accessToken);
  if (!session) {
    return null;
  }

  return {
    session,
    accessToken,
    refreshToken: data.refreshToken || data.refresh_token || refreshToken
  };
}
