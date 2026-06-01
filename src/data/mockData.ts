/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hospital, DiseaseMetric, ProvinceStats, MonthlyStats, EpidemiologicalAlert, HealthReport } from '../types';

export const ANGOLA_PROVINCES = [
  'Cabinda',
  'Zaire',
  'Uíge',
  'Bengo',
  'Luanda',
  'Cuanza Norte',
  'Cuanza Sul',
  'Malanje',
  'Lunda Norte',
  'Lunda Sul',
  'Moxico',
  'Bié',
  'Huambo',
  'Benguela',
  'Namibe',
  'Huíla',
  'Cunene',
  'Cuando Cubango'
];

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Hospital Josina Machel',
    province: 'Luanda',
    municipality: 'Ingombota',
    type: 'Hospital Geral',
    beds: 520,
    doctors: 85,
    nurses: 240,
    activePatients: 412,
    occupancyRate: 79,
    status: 'Sobrecarregado',
    phone: '+244 923 456 789',
    email: 'josina.machel@minsa.gov.ao',
    director: 'Dra. Maria de Fátima António'
  },
  {
    id: 'hosp-2',
    name: 'Hospital Américo Boavida',
    province: 'Luanda',
    municipality: 'Rangel',
    type: 'Hospital Geral',
    beds: 450,
    doctors: 68,
    nurses: 180,
    activePatients: 380,
    occupancyRate: 84,
    status: 'Sobrecarregado',
    phone: '+244 912 345 678',
    email: 'americo.boavida@minsa.gov.ao',
    director: 'Dr. João Baptista dos Santos'
  },
  {
    id: 'hosp-3',
    name: 'Hospital Geral de Benguela',
    province: 'Benguela',
    municipality: 'Benguela',
    type: 'Hospital Provincial',
    beds: 380,
    doctors: 45,
    nurses: 130,
    activePatients: 290,
    occupancyRate: 76,
    status: 'Operacional',
    phone: '+244 272 234 502',
    email: 'hosp.benguela@minsa.gov.ao',
    director: 'Dr. Mateus Francisco Gaspar'
  },
  {
    id: 'hosp-4',
    name: 'Hospital Geral do Huambo',
    province: 'Huambo',
    municipality: 'Huambo',
    type: 'Hospital Provincial',
    beds: 400,
    doctors: 50,
    nurses: 145,
    activePatients: 310,
    occupancyRate: 77,
    status: 'Operacional',
    phone: '+244 242 220 119',
    email: 'hosp.huambo@minsa.gov.ao',
    director: 'Dra. Albertina Celestina Silva'
  },
  {
    id: 'hosp-5',
    name: 'Hospital Sanatório de Cabinda',
    province: 'Cabinda',
    municipality: 'Cabinda',
    type: 'Hospital Geral',
    beds: 180,
    doctors: 22,
    nurses: 65,
    activePatients: 110,
    occupancyRate: 61,
    status: 'Operacional',
    phone: '+244 231 222 344',
    email: 'sanatorio.cabinda@minsa.gov.ao',
    director: 'Dr. Luís Maria de Sousa'
  },
  {
    id: 'hosp-6',
    name: 'Hospital Central da Huíla',
    province: 'Huíla',
    municipality: 'Lubango',
    type: 'Hospital Geral',
    beds: 350,
    doctors: 40,
    nurses: 120,
    activePatients: 265,
    occupancyRate: 75,
    status: 'Operacional',
    phone: '+244 261 222 101',
    email: 'hosp.huila@minsa.gov.ao',
    director: 'Dr. Bernardo Elvécio de Castro'
  },
  {
    id: 'hosp-7',
    name: 'Centro de Saúde do Uíge',
    province: 'Uíge',
    municipality: 'Uíge',
    type: 'Centro de Saúde',
    beds: 45,
    doctors: 6,
    nurses: 22,
    activePatients: 38,
    occupancyRate: 84,
    status: 'Sobrecarregado',
    phone: '+244 251 222 090',
    email: 'cs.uige@minsa.gov.ao',
    director: 'Dra. Elsa Domingos Manuel'
  },
  {
    id: 'hosp-8',
    name: 'Posto de Saúde Integrado de Caxito',
    province: 'Bengo',
    municipality: 'Dande',
    type: 'Posto de Saúde',
    beds: 15,
    doctors: 2,
    nurses: 8,
    activePatients: 6,
    occupancyRate: 40,
    status: 'Operacional',
    phone: '+244 234 220 030',
    email: 'ps.caxito@minsa.gov.ao',
    director: 'Dr. Pedro Manuel Bento'
  },
  {
    id: 'hosp-9',
    name: 'Maternidade Lucrécia Paim',
    province: 'Luanda',
    municipality: 'Maianga',
    type: 'Maternidade',
    beds: 320,
    doctors: 45,
    nurses: 160,
    activePatients: 285,
    occupancyRate: 89,
    status: 'Sobrecarregado',
    phone: '+244 921 556 612',
    email: 'lucrecia.paim@minsa.gov.ao',
    director: 'Dra. Ligia Rosa Fortes'
  },
  {
    id: 'hosp-10',
    name: 'Hospital Geral de Malanje',
    province: 'Malanje',
    municipality: 'Malanje',
    type: 'Hospital Provincial',
    beds: 220,
    doctors: 24,
    nurses: 78,
    activePatients: 160,
    occupancyRate: 72,
    status: 'Operacional',
    phone: '+244 254 220 541',
    email: 'hosp.malanje@minsa.gov.ao',
    director: 'Dr. Justino de Jesus'
  },
  {
    id: 'hosp-11',
    name: 'Hospital Provincial do Zaire',
    province: 'Zaire',
    municipality: 'M\'banza Kongo',
    type: 'Hospital Provincial',
    beds: 150,
    doctors: 18,
    nurses: 52,
    activePatients: 95,
    occupancyRate: 63,
    status: 'Operacional',
    phone: '+244 235 220 440',
    email: 'hosp.zaire@minsa.gov.ao',
    director: 'Dr. Daniel Simão'
  },
  {
    id: 'hosp-12',
    name: 'Hospital Provincial de Ondjiva',
    province: 'Cunene',
    municipality: 'Cuanhama',
    type: 'Hospital Provincial',
    beds: 180,
    doctors: 16,
    nurses: 48,
    activePatients: 142,
    occupancyRate: 78,
    status: 'Operacional',
    phone: '+244 265 220 120',
    email: 'hosp.cunene@minsa.gov.ao',
    director: 'Dr. Amílcar José'
  },
  {
    id: 'hosp-13',
    name: 'Hospital Militar do Luena',
    province: 'Moxico',
    municipality: 'Luena',
    type: 'Hospital Militar',
    beds: 120,
    doctors: 14,
    nurses: 40,
    activePatients: 85,
    occupancyRate: 70,
    status: 'Operacional',
    phone: '+244 254 221 230',
    email: 'militar.luena@minsa.gov.ao',
    director: 'Cel. Dr. Jorge Manuel Estêvão'
  },
  {
    id: 'hosp-14',
    name: 'Centro de Saúde de Saurimo',
    province: 'Lunda Sul',
    municipality: 'Saurimo',
    type: 'Centro de Saúde',
    beds: 60,
    doctors: 5,
    nurses: 24,
    activePatients: 51,
    occupancyRate: 85,
    status: 'Sobrecarregado',
    phone: '+244 253 220 181',
    email: 'cs.saurimo@minsa.gov.ao',
    director: 'Dra. Helena de Oliveira'
  },
  {
    id: 'hosp-15',
    name: 'Hospital de Catumbela',
    province: 'Benguela',
    municipality: 'Catumbela',
    type: 'Hospital Geral',
    beds: 140,
    doctors: 15,
    nurses: 48,
    activePatients: 92,
    occupancyRate: 65,
    status: 'Operacional',
    phone: '+244 272 231 022',
    email: 'hosp.catumbela@minsa.gov.ao',
    director: 'Dr. Alberto Francisco'
  },
  {
    id: 'hosp-16',
    name: 'Hospital Geral do Sumbe',
    province: 'Cuanza Sul',
    municipality: 'Sumbe',
    type: 'Hospital Geral',
    beds: 190,
    doctors: 18,
    nurses: 55,
    activePatients: 135,
    occupancyRate: 71,
    status: 'Operacional',
    phone: '+244 236 220 102',
    email: 'hosp.sumbe@minsa.gov.ao',
    director: 'Dra. Isolina Gaspar'
  },
  {
    id: 'hosp-17',
    name: 'Hospital Geral de Ndalatando',
    province: 'Cuanza Norte',
    municipality: 'Cazengo',
    type: 'Hospital Geral',
    beds: 130,
    doctors: 12,
    nurses: 38,
    activePatients: 78,
    occupancyRate: 60,
    status: 'Operacional',
    phone: '+244 235 220 901',
    email: 'hosp.cuanzanorte@minsa.gov.ao',
    director: 'Dr. Sebastião Neto'
  },
  {
    id: 'hosp-18',
    name: 'Hospital Provincial de Menongue',
    province: 'Cuando Cubango',
    municipality: 'Menongue',
    type: 'Hospital Provincial',
    beds: 160,
    doctors: 11,
    nurses: 42,
    activePatients: 118,
    occupancyRate: 73,
    status: 'Operacional',
    phone: '+244 249 220 115',
    email: 'hosp.menongue@minsa.gov.ao',
    director: 'Dr. Valeriano Capango'
  },
  {
    id: 'hosp-19',
    name: 'Hospital Municipal de Dundo',
    province: 'Lunda Norte',
    municipality: 'Chitato',
    type: 'Hospital Geral',
    beds: 170,
    doctors: 14,
    nurses: 45,
    activePatients: 115,
    occupancyRate: 67,
    status: 'Operacional',
    phone: '+244 252 220 300',
    email: 'hosp.dundo@minsa.gov.ao',
    director: 'Dr. Simão de Oliveira'
  },
  {
    id: 'hosp-20',
    name: 'Hospital Geral de Moçâmedes',
    province: 'Namibe',
    municipality: 'Moçâmedes',
    type: 'Hospital Geral',
    beds: 154,
    doctors: 15,
    nurses: 44,
    activePatients: 86,
    occupancyRate: 55,
    status: 'Operacional',
    phone: '+244 264 220 011',
    email: 'hosp.namibe@minsa.gov.ao',
    director: 'Dra. Cecília Chissola'
  }
];

export const MOCK_DISEASE_METRICS: DiseaseMetric[] = [
  {
    id: 'dis-1',
    name: 'Malária',
    cases: 38450,
    deaths: 142,
    recovered: 35210,
    trend: 'Crescente',
    alertLevel: 'Crítico',
    lastUpdated: '2026-05-28'
  },
  {
    id: 'dis-2',
    name: 'Diarreia Aguda',
    cases: 12450,
    deaths: 48,
    recovered: 11950,
    trend: 'Estável',
    alertLevel: 'Atenção',
    lastUpdated: '2026-05-27'
  },
  {
    id: 'dis-3',
    name: 'Tuberculose',
    cases: 4210,
    deaths: 89,
    recovered: 3120,
    trend: 'Decrescente',
    alertLevel: 'Normal',
    lastUpdated: '2026-05-25'
  },
  {
    id: 'dis-4',
    name: 'Sarampo',
    cases: 1850,
    deaths: 12,
    recovered: 1640,
    trend: 'Crescente',
    alertLevel: 'Crítico',
    lastUpdated: '2026-05-28'
  },
  {
    id: 'dis-5',
    name: 'Cólera',
    cases: 320,
    deaths: 15,
    recovered: 280,
    trend: 'Crescente',
    alertLevel: 'Crítico',
    lastUpdated: '2026-05-28'
  },
  {
    id: 'dis-6',
    name: 'Dengue',
    cases: 980,
    deaths: 2,
    recovered: 890,
    trend: 'Estável',
    alertLevel: 'Normal',
    lastUpdated: '2026-05-24'
  },
  {
    id: 'dis-7',
    name: 'COVID-19',
    cases: 450,
    deaths: 3,
    recovered: 440,
    trend: 'Decrescente',
    alertLevel: 'Normal',
    lastUpdated: '2026-05-20'
  }
];

export const MOCK_MONTHLY_STATS: MonthlyStats[] = [
  { month: 'Jan', consultations: 45100, hospitalizations: 6200, births: 3100, deaths: 420 },
  { month: 'Fev', consultations: 47200, hospitalizations: 6500, births: 3250, deaths: 390 },
  { month: 'Mar', consultations: 52400, hospitalizations: 7100, births: 3400, deaths: 450 },
  { month: 'Abr', consultations: 58900, hospitalizations: 8400, births: 3750, deaths: 512 },
  { month: 'Mai', consultations: 64120, hospitalizations: 9250, births: 3980, deaths: 549 }
];

export const MOCK_EPIDEMIOLOGICAL_ALERTS: EpidemiologicalAlert[] = [
  {
    id: 'alert-1',
    disease: 'Malária',
    province: 'Luanda',
    alertLevel: 'Crítico',
    casesCount: 12450,
    growthRate: 18.4,
    description: 'Surtos significativos de Malária nas zonas suburbanas de Cacuaco e Viana associados ao início da estação das chuvas e focos de água estagnada.',
    date: '2026-05-24'
  },
  {
    id: 'alert-2',
    disease: 'Cólera',
    province: 'Zaire',
    alertLevel: 'Crítico',
    casesCount: 142,
    growthRate: 35.1,
    description: 'Casos confirmados em M\'banza Kongo e Soyo. Equipa ministerial de emergência enviada para reforçar tratamento de águas residuais.',
    date: '2026-05-26'
  },
  {
    id: 'alert-3',
    disease: 'Sarampo',
    province: 'Huambo',
    alertLevel: 'Atenção',
    casesCount: 420,
    growthRate: 8.2,
    description: 'Surtos de sarampo em crianças menores de 5 anos detetados nos municípios do Bailundo e Caála. Reforço imediato do plano de vacinação de emergência.',
    date: '2026-05-25'
  },
  {
    id: 'alert-4',
    disease: 'Diarreia Aguda',
    province: 'Uíge',
    alertLevel: 'Atenção',
    casesCount: 1105,
    growthRate: 5.5,
    description: 'Aumento estacional de casos devido a consumo de água de fontes não controladas nas comunidades rurais do município de Negage.',
    date: '2026-05-21'
  }
];

export const MOCK_REPORTS: HealthReport[] = [
  {
    id: 'rep-1',
    title: 'Relatório Nacional de Malária - Q1 2026',
    province: 'Nacional',
    period: 'Janeiro a Março 2026',
    category: 'Epidemiológico',
    generatedBy: 'Dra. Elsa Domingos (Analista Central)',
    date: '2026-04-10',
    summary: 'Apresenta a evolução estatística dos casos de malária em Angola no primeiro trimestre de 2026, realçando as províncias mais afetadas e as taxas de mortalidade hospitalar.',
    dataJson: '{}'
  },
  {
    id: 'rep-2',
    title: 'Produtividade da Rede Hospitalar de Luanda',
    province: 'Luanda',
    period: 'Abril 2026',
    category: 'Produtividade Hospitalar',
    generatedBy: 'Dr. Mateus Gaspar (Gestor de Informação)',
    date: '2026-05-05',
    summary: 'Análise detalhada do fluxo de pacientes, taxa de ocupação de camas, consultas por médico e internamentos ativos nos hospitais Josina Machel e Américo Boavida.',
    dataJson: '{}'
  },
  {
    id: 'rep-3',
    title: 'Monitorização da Mortalidade e Natalidade Huambo',
    province: 'Huambo',
    period: 'Q1 2026',
    category: 'Maternidade',
    generatedBy: 'Dr. Valeriano Capango (Gabinete Provincial)',
    date: '2026-04-15',
    summary: 'Análise do rácio de mortalidade materna e natalidade no Hospital Geral do Huambo e centros de saúde periféricos.',
    dataJson: '{}'
  }
];

// Helper to compile statistics dynamically based on filters
export function getDynamicStats(
  provinceFilter: string, 
  hospitalFilter: string, 
  periodFilter: string,
  municipalityFilter: string = 'All',
  dateRangeStart: string = '',
  dateRangeEnd: string = '',
  hospitalsList: Hospital[] = MOCK_HOSPITALS,
  diseaseMetrics: DiseaseMetric[] = MOCK_DISEASE_METRICS,
  alertsList: EpidemiologicalAlert[] = MOCK_EPIDEMIOLOGICAL_ALERTS
): {
  totals: {
    patients: number;
    hospitals: number;
    consultations: number;
    hospitalizations: number;
    deaths: number;
    births: number;
  };
  byProvince: { province: string; patients: number; hospitals: number; deaths: number }[];
  byDisease: { name: string; cases: number; deaths: number; color: string }[];
  monthlyTrend: MonthlyStats[];
  hospitals: Hospital[];
  alerts: EpidemiologicalAlert[];
} {
  // Let's model province scaling factor:
  const getProvinceScale = (p: string) => {
    switch (p) {
      case 'Luanda': return 2.8;
      case 'Huíla': return 1.4;
      case 'Benguela': return 1.5;
      case 'Huambo': return 1.3;
      case 'Uíge': return 1.1;
      case 'Cabinda': return 0.8;
      default: return 0.45;
    }
  };

  // 1. Filtered Hospitals
  let filteredHospitals = hospitalsList;
  if (provinceFilter !== 'All') {
    filteredHospitals = filteredHospitals.filter(h => h.province === provinceFilter);
  }
  if (municipalityFilter !== 'All') {
    filteredHospitals = filteredHospitals.filter(h => h.municipality === municipalityFilter);
  }
  if (hospitalFilter !== 'All') {
    filteredHospitals = filteredHospitals.filter(h => h.type === hospitalFilter);
  }

  // 2. Base Scale
  let scale = 1.0;
  if (provinceFilter !== 'All') {
    scale = getProvinceScale(provinceFilter);
    if (municipalityFilter !== 'All') {
      scale = scale * 0.28; // scale down for municipality density
    }
  }

  // Calculate customized date range scale (relative to a 30-day month baseline)
  let dateScale = 1.0;
  if (dateRangeStart && dateRangeEnd) {
    const dStart = new Date(dateRangeStart).getTime();
    const dEnd = new Date(dateRangeEnd).getTime();
    if (!isNaN(dStart) && !isNaN(dEnd) && dEnd >= dStart) {
      const diffDays = Math.max(1, Math.round((dEnd - dStart) / (1000 * 60 * 60 * 24)));
      dateScale = diffDays / 30;
    }
  }

  // Multiply based on period
  let periodScale = 1.0;
  if (periodFilter === 'Q1') periodScale = 0.85;
  if (periodFilter === 'Q2') periodScale = 1.05;
  if (periodFilter === 'Semestre') periodScale = 2.1;

  // Combine periodScale with the custom dateScale
  periodScale = periodScale * dateScale;

  // 3. Toal computations
  const totalHospitals = filteredHospitals.length;
  const totalBeds = filteredHospitals.reduce((acc, h) => acc + h.beds, 0);
  const activePatients = Math.round(filteredHospitals.reduce((acc, h) => acc + h.activePatients, 0) * periodScale);
  const totalDoctors = filteredHospitals.reduce((acc, h) => acc + h.doctors, 0);

  const consultationsBase = Math.round(180420 * scale * periodScale);
  const hospitalizationsBase = Math.round(23180 * scale * periodScale);
  const deathsBase = Math.round(1840 * scale * periodScale);
  const birthsBase = Math.round(12430 * scale * periodScale);

  // 4. Generate province aggregation dynamically
  const provinceAgg = ANGOLA_PROVINCES.map(p => {
    const pScale = getProvinceScale(p);
    const pHospitals = hospitalsList.filter(h => h.province === p);
    return {
      province: p,
      patients: Math.round(1230 * pScale * periodScale),
      hospitals: pHospitals.length,
      deaths: Math.round(75 * pScale * periodScale)
    };
  }).sort((a, b) => b.patients - a.patients);

  // 5. Generate disease statistics dynamically
  const colors = ['#0d9488', '#0f766e', '#115e59', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];
  const diseaseStats = diseaseMetrics.map((d, index) => {
    // scale metrics for this province:
    const provMultiplier = provinceFilter === 'All' ? 1.0 : (getProvinceScale(provinceFilter) / 2.0);
    return {
      name: d.name,
      cases: Math.round(d.cases * provMultiplier * periodScale),
      deaths: Math.round(d.deaths * provMultiplier * periodScale),
      color: colors[index % colors.length]
    };
  }).sort((a, b) => b.cases - a.cases);

  // 6. Monthly Trend
  const monthlyTrend = MOCK_MONTHLY_STATS.map(s => {
    const provMultiplier = provinceFilter === 'All' ? 1.0 : getProvinceScale(provinceFilter);
    return {
      month: s.month,
      consultations: Math.round(s.consultations * provMultiplier),
      hospitalizations: Math.round(s.hospitalizations * provMultiplier),
      births: Math.round(s.births * provMultiplier),
      deaths: Math.round(s.deaths * provMultiplier)
    };
  });

  // 7. Active Alerts
  let activeAlerts = alertsList;
  if (provinceFilter !== 'All') {
    activeAlerts = alertsList.filter(a => a.province === provinceFilter);
  }

  return {
    totals: {
      patients: activePatients > 0 ? activePatients : Math.round(3421 * scale),
      hospitals: totalHospitals > 0 ? totalHospitals : 1,
      consultations: consultationsBase,
      hospitalizations: hospitalizationsBase,
      deaths: deathsBase,
      births: birthsBase
    },
    byProvince: provinceAgg,
    byDisease: diseaseStats,
    monthlyTrend,
    hospitals: filteredHospitals,
    alerts: activeAlerts
  };
}
