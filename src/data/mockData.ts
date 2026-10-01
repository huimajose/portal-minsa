import { DiseaseMetric, EpidemiologicalAlert, Hospital, MonthlyStats } from '../types';

export const ANGOLA_PROVINCES = [
  'Cabinda', 'Zaire', 'Uíge', 'Bengo', 'Luanda', 'Cuanza Norte',
  'Cuanza Sul', 'Malanje', 'Lunda Norte', 'Lunda Sul', 'Moxico', 'Bié',
  'Huambo', 'Benguela', 'Namibe', 'Huíla', 'Cunene', 'Cuando Cubango'
];

export function getDynamicStats(
  provinceFilter: string,
  hospitalFilter: string,
  _periodFilter: string,
  municipalityFilter: string = 'All',
  _dateRangeStart: string = '',
  _dateRangeEnd: string = '',
  hospitalsList: Hospital[] = [],
  diseaseMetrics: DiseaseMetric[] = [],
  alertsList: EpidemiologicalAlert[] = []
): {
  totals: { patients: number; hospitals: number; consultations: number; hospitalizations: number; deaths: number; births: number };
  byProvince: { province: string; patients: number; hospitals: number; deaths: number }[];
  byDisease: { name: string; cases: number; deaths: number; color: string }[];
  monthlyTrend: MonthlyStats[];
  hospitals: Hospital[];
  alerts: EpidemiologicalAlert[];
} {
  let hospitals = hospitalsList;
  if (provinceFilter !== 'All') hospitals = hospitals.filter((h) => h.province === provinceFilter);
  if (municipalityFilter !== 'All') hospitals = hospitals.filter((h) => h.municipality === municipalityFilter);
  if (hospitalFilter !== 'All') hospitals = hospitals.filter((h) => h.type === hospitalFilter);

  const alerts = provinceFilter === 'All'
    ? alertsList
    : alertsList.filter((a) => a.province === provinceFilter);

  return {
    totals: {
      patients: 0,
      hospitals: hospitals.length,
      consultations: 0,
      hospitalizations: 0,
      deaths: 0,
      births: 0
    },
    byProvince: [],
    byDisease: diseaseMetrics.map((d) => ({
      name: d.name,
      cases: d.cases,
      deaths: d.deaths,
      color: '#0d9488'
    })),
    monthlyTrend: [],
    hospitals,
    alerts
  };
}
