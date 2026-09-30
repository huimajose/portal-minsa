import type { StatisticsOverview } from '../server/statistics-service';

export async function fetchStatisticsOverview(): Promise<StatisticsOverview> {
  const response = await fetch('/api/statistics/overview', { credentials: 'same-origin' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Falha ao consultar estatisticas.');
  return body.data as StatisticsOverview;
}
