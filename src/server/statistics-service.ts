export interface StatisticsOverview {
  population: { registered_patients: number };
  network: { registered_organizations: number; active_nodes: number | null };
  clinical_activity: { encounters: number; observations: number; conditions: number };
  top_conditions: { label: string; count: number }[];
  encounters_by_year: { year: number; count: number }[];
  privacy: { aggregation: string; contains_patient_records: boolean };
}

function getBaseUrl(): string {
  const value = process.env.STATISTICS_SERVICE_BASE_URL;
  if (!value) throw new Error('STATISTICS_SERVICE_BASE_URL is not configured.');
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
