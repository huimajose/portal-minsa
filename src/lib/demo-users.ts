import { UserRole } from '../types';

export interface DemoUserDirectoryEntry {
  name: string;
  username: string;
  role: UserRole;
  province?: string;
}

export const DEMO_USER_DIRECTORY: DemoUserDirectoryEntry[] = [
  {
    name: 'Dr. Geraldo Almeida',
    username: 'geraldo.admin',
    role: 'ADMIN_MINSA'
  },
  {
    name: 'Dra. Elsa Domingos',
    username: 'elsa.analista',
    role: 'ANALISTA'
  },
  {
    name: 'Dr. Valeriano Capango',
    username: 'valeriano.huambo',
    role: 'GESTOR_PROVINCIAL',
    province: 'Huambo'
  },
  {
    name: 'Mariana Silva',
    username: 'mariana.viewer',
    role: 'VISUALIZADOR'
  }
];
