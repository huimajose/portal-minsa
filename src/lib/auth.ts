import { UserSession } from '../types';

interface ApiErrorPayload {
  error?: string;
}

interface LoginResponse {
  session: UserSession;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    throw new Error(data.error || 'Falha na comunicacao com o servico de autenticacao.');
  }

  return data;
}

export async function login(username: string, password: string): Promise<UserSession> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify({ username, password })
  });

  const data = await parseJson<LoginResponse>(response);
  return data.session;
}

export async function fetchSession(): Promise<UserSession | null> {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'same-origin'
  });

  if (response.status === 401) {
    return null;
  }

  const data = await parseJson<LoginResponse>(response);
  return data.session;
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin'
  });

  await parseJson<{ success: boolean }>(response);
}

export async function createAlertRequest(alert: {
  disease: string;
  province: string;
  alertLevel: string;
  casesCount: number;
  growthRate: number;
  description: string;
}) {
  const response = await fetch('/api/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify(alert)
  });

  const data = await parseJson<{ alert: any }>(response);
  return data.alert;
}

export async function createPatientAdmissionRequest(
  hospitalId: string,
  consultationData: { disease: string; isHospitalized: boolean; triageLevel: string }
) {
  const response = await fetch(`/api/hospitals/${hospitalId}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify(consultationData)
  });

  return parseJson<{ success: boolean }>(response);
}
