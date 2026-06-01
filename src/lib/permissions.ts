import { UserRole, UserSession } from '../types';

export type SecureAction =
  | 'ADMIT_PATIENT'
  | 'EMIT_ALERT'
  | 'RUN_REPORTS'
  | 'VIEW_ALL_PROVINCES'
  | 'EXPORT_XLSX'
  | 'MANAGE_USERS';

export function getDefaultPermissionsForRole(role: UserRole): SecureAction[] {
  switch (role) {
    case 'ADMIN_MINSA':
      return ['ADMIT_PATIENT', 'EMIT_ALERT', 'RUN_REPORTS', 'VIEW_ALL_PROVINCES', 'EXPORT_XLSX', 'MANAGE_USERS'];
    case 'ANALISTA':
      return ['EMIT_ALERT', 'RUN_REPORTS', 'VIEW_ALL_PROVINCES', 'EXPORT_XLSX'];
    case 'GESTOR_PROVINCIAL':
      return ['ADMIT_PATIENT', 'EMIT_ALERT', 'EXPORT_XLSX'];
    case 'VISUALIZADOR':
    default:
      return [];
  }
}

export function hasPermission(sessionOrRole: UserRole | UserSession | null | undefined, action: SecureAction): boolean {
  if (!sessionOrRole) return false;

  if (typeof sessionOrRole === 'string') {
    return getDefaultPermissionsForRole(sessionOrRole).includes(action);
  }

  const permissions = sessionOrRole.permissions ?? getDefaultPermissionsForRole(sessionOrRole.role);
  return permissions.includes(action);
}
