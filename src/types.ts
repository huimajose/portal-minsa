/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN_MINSA' | 'ANALISTA' | 'GESTOR_PROVINCIAL' | 'VISUALIZADOR';

export interface UserSession {
  username: string;
  name: string;
  role: UserRole;
  province?: string; // Standard for Gestor Provincial
  permissions?: string[]; // Custom fine-grained dynamic overrides
}

export interface Hospital {
  id: string;
  name: string;
  province: string;
  municipality: string;
  type: 'Hospital Geral' | 'Hospital Provincial' | 'Centro de Saúde' | 'Posto de Saúde' | 'Maternidade' | 'Hospital Militar';
  beds: number;
  doctors: number;
  nurses: number;
  activePatients: number;
  occupancyRate: number; // percentage
  status: 'Operacional' | 'Manutenção' | 'Sobrecarregado';
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  director: string;
}

export interface DiseaseMetric {
  id: string;
  name: string;
  cases: number;
  deaths: number;
  recovered: number;
  trend: 'Crescente' | 'Estável' | 'Decrescente';
  alertLevel: 'Normal' | 'Atenção' | 'Crítico';
  lastUpdated: string;
}

export interface MonthlyStats {
  month: string;
  consultations: number;
  hospitalizations: number;
  births: number;
  deaths: number;
}

export interface ProvinceStats {
  province: string;
  totalPatients: number;
  totalHospitals: number;
  consultations: number;
  hospitalizations: number;
  deaths: number;
  births: number;
  diseases: { [diseaseName: string]: number };
}

export interface EpidemiologicalAlert {
  id: string;
  disease: string;
  province: string;
  alertLevel: 'Normal' | 'Atenção' | 'Crítico';
  casesCount: number;
  growthRate: number; // percentage
  description: string;
  date: string;
}

export interface HealthReport {
  id: string;
  title: string;
  province: string;
  period: string;
  category: 'Epidemiológico' | 'Produtividade Hospitalar' | 'Maternidade' | 'Recursos Humanos';
  generatedBy: string;
  date: string;
  summary: string;
  dataJson: string; // serialized data
}
