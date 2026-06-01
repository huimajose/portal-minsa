import { DEMO_USER_DIRECTORY, DemoUserDirectoryEntry } from '../lib/demo-users';
import { getDefaultPermissionsForRole } from '../lib/permissions';
import { UserSession } from '../types';

interface DemoCredential extends DemoUserDirectoryEntry {
  password: string;
}

const DEFAULT_PASSWORDS: Record<string, string> = {
  'geraldo.admin': 'admin_minsa_2026',
  'elsa.analista': 'analista_minsa_26',
  'valeriano.huambo': 'gestor_huambo_26',
  'mariana.viewer': 'viewer_minsa_2026'
};

function getConfiguredPassword(username: string): string {
  const envKey = `MINSA_DEMO_PASSWORD_${username.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  return process.env[envKey] || DEFAULT_PASSWORDS[username];
}

export function getDemoCredentials(): DemoCredential[] {
  return DEMO_USER_DIRECTORY.map((user) => ({
    ...user,
    password: getConfiguredPassword(user.username)
  }));
}

export function authenticateDemoUser(username: string, password: string): UserSession | null {
  const normalizedUsername = username.trim().toLowerCase();
  const matchedUser = getDemoCredentials().find(
    (user) => user.username === normalizedUsername && user.password === password
  );

  if (!matchedUser) {
    return null;
  }

  return {
    username: matchedUser.username,
    name: matchedUser.name,
    role: matchedUser.role,
    province: matchedUser.province,
    permissions: getDefaultPermissionsForRole(matchedUser.role)
  };
}
