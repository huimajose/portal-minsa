const VALUE_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  completed: 'Concluído',
  received: 'Recebido',
  processing: 'Em processamento',
  validating: 'Em validação',
  validated: 'Validado',
  failed: 'Falhou',
  cancelled: 'Cancelado',
  revoked: 'Revogado',
  expired: 'Expirado',
  enabled: 'Ativado',
  disabled: 'Desativado',
  hospital: 'Hospital',
  clinic: 'Clínica',
  health_center: 'Centro de saúde',
  healthcentre: 'Centro de saúde',
  regulator: 'Regulador',
  administrator: 'Administrador',
  admin: 'Administrador',
  practitioner: 'Profissional de saúde',
  staff: 'Colaborador',
  user: 'Utilizador',
  ok: 'Operacional',
  healthy: 'Operacional',
  unavailable: 'Indisponível',
  unknown: 'Desconhecido',
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  true: 'Sim',
  false: 'Não',
};

export function localizeValue(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const raw = String(value).trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  return VALUE_LABELS[key] || raw;
}
