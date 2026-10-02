export interface StatisticsOverview {
  population: { registered_patients: number };
  network: {
    registered_organizations: number;
    active_nodes: number | null;
    organizations: {
      id: string;
      name: string;
      type: string | null;
      status: string | null;
      facility_code: string | null;
      province: string | null;
      municipality: string | null;
      neighborhood: string | null;
      latitude: number | null;
      longitude: number | null;
    }[];
  };
  clinical_activity: { encounters: number; observations: number; conditions: number };
  top_conditions: { label: string; count: number }[];
  encounters_by_year: { year: number; count: number }[];
  age_distribution: { label: string; count: number }[];
  territorial_epidemiology: { province: string | null; municipality: string | null; condition: string; count: number }[];
  privacy: { aggregation: string; contains_patient_records: boolean };
}

const PRODUCTION_STATISTICS_SERVICE_URL = 'https://statistic-service-ryl5.onrender.com';

function getBaseUrl(): string {
  const value = process.env.STATISTICS_SERVICE_BASE_URL || PRODUCTION_STATISTICS_SERVICE_URL;
  return value.replace(/\/$/, '');
}

export async function fetchStatisticsOverview(accessToken: string): Promise<StatisticsOverview> {
  const response = await fetch(`${getBaseUrl()}/api/v1/statistics/overview`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.error || 'Statistics Service unavailable.');
  const data = body.data as StatisticsOverview | undefined;
  if (!data || data.privacy?.contains_patient_records !== false) {
    throw new Error('Invalid aggregate statistics response.');
  }
  return data;
}


export interface StatisticsReadiness {
  status: string;
  auth: string;
  database_manager: string;
}

export async function fetchStatisticsReadiness(): Promise<StatisticsReadiness> {
  const response = await fetch(`${getBaseUrl()}/ready`, { method: 'GET', cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Statistics dependencies unavailable.');
  return body as StatisticsReadiness;
}
