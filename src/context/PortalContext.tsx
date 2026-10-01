import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getDynamicStats } from '../data/mockData';
import { UserSession, Hospital, EpidemiologicalAlert, DiseaseMetric } from '../types';
import { hasPermission } from '../components/RoleGuard';
import { createAlertRequest, createPatientAdmissionRequest, fetchSession, logout } from '../lib/auth';
import { SecureAction } from '../lib/permissions';

export interface ManagedUser {
  name: string;
  username: string;
  role: UserSession['role'];
  province?: string;
  permissions?: SecureAction[];
}

interface PortalContextValue {
  userSession: UserSession | null;
  isSessionLoading: boolean;
  selectedProvince: string;
  selectedPeriod: string;
  selectedHospitalType: string;
  selectedMunicipality: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  hospitalsState: Hospital[];
  alertsState: EpidemiologicalAlert[];
  diseaseMetricsState: DiseaseMetric[];
  usersListState: ManagedUser[];
  stats: ReturnType<typeof getDynamicStats>;
  provinceAlertsMap: Record<string, 'Normal' | 'Atenção' | 'Crítico'>;
  handleLoginSuccess: (session: UserSession) => void;
  handleLogout: () => Promise<void>;
  handleAddPatientToHospital: (
    hospitalId: string,
    consultationData?: { disease: string; isHospitalized: boolean; triageLevel: 'Normal' | 'Atenção' | 'Crítico' }
  ) => Promise<void>;
  handleAddAlert: (alertData: Omit<EpidemiologicalAlert, 'id' | 'date'>) => Promise<void>;
  refreshSession: () => Promise<UserSession | null>;
  setSelectedProvince: (value: string) => void;
  setSelectedPeriod: (value: string) => void;
  setSelectedHospitalType: (value: string) => void;
  setSelectedMunicipality: (value: string) => void;
  setDateRangeStart: (value: string) => void;
  setDateRangeEnd: (value: string) => void;
}

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  const [selectedHospitalType, setSelectedHospitalType] = useState('All');
  const [selectedMunicipality, setSelectedMunicipality] = useState('All');
  const [dateRangeStart, setDateRangeStart] = useState('2026-05-01');
  const [dateRangeEnd, setDateRangeEnd] = useState('2026-05-28');
  const [hospitalsState, setHospitalsState] = useState<Hospital[]>([]);
  const [alertsState, setAlertsState] = useState<EpidemiologicalAlert[]>([]);
  const [diseaseMetricsState, setDiseaseMetricsState] = useState<DiseaseMetric[]>([]);
  const [usersListState] = useState<ManagedUser[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const session = await fetchSession();
        if (isMounted) {
          setUserSession(session);
        }
      } catch {
        if (isMounted) {
          setUserSession(null);
        }
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userSession) return;
    const canViewAll = hasPermission(userSession, 'VIEW_ALL_PROVINCES');
    if (!canViewAll && userSession.province) {
      setSelectedProvince(userSession.province);
      setSelectedMunicipality('All');
    }
  }, [userSession]);

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
  };

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    setUserSession(null);
  };

  const refreshSession = async () => {
    const session = await fetchSession();
    setUserSession(session);
    return session;
  };

  const handleAddPatientToHospital = async (
    hospitalId: string,
    consultationData?: { disease: string; isHospitalized: boolean; triageLevel: 'Normal' | 'Atenção' | 'Crítico' }
  ) => {
    if (!userSession) return;
    if (!hasPermission(userSession, 'ADMIT_PATIENT')) {
      alert('Acesso negado: o seu perfil ativo nao possui privilegios de registo clinico ou admissao de pacientes.');
      return;
    }

    const isHospitalized = consultationData ? consultationData.isHospitalized : true;
    const diseaseName = consultationData ? consultationData.disease : 'Malaria';
    const triage = consultationData ? consultationData.triageLevel : 'Atenção';

    await createPatientAdmissionRequest(hospitalId, {
      disease: diseaseName,
      isHospitalized,
      triageLevel: triage
    });

    setHospitalsState((prev) => prev.map((hospital) => {
      if (hospital.id !== hospitalId) return hospital;

      let updatedPatients = hospital.activePatients;
      if (isHospitalized && updatedPatients < hospital.beds) {
        updatedPatients += 1;
      }

      const nextOccupancy = Math.round((updatedPatients / hospital.beds) * 100);
      return {
        ...hospital,
        activePatients: updatedPatients,
        occupancyRate: nextOccupancy,
        status: nextOccupancy >= 85 ? 'Sobrecarregado' : hospital.status
      };
    }));

    setDiseaseMetricsState((prev) => prev.map((metric) => {
      if (metric.name.toLowerCase() !== diseaseName.toLowerCase()) return metric;
      return {
        ...metric,
        cases: metric.cases + 1,
        alertLevel: triage === 'Crítico' ? 'Crítico' : metric.alertLevel,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }));
  };

  const handleAddAlert = async (alertData: Omit<EpidemiologicalAlert, 'id' | 'date'>) => {
    if (!userSession) return;
    if (!hasPermission(userSession, 'EMIT_ALERT')) {
      alert('Acesso negado: o seu perfil ativo nao possui privilegios para emitir alertas epidemiologicos.');
      return;
    }

    const newAlert = (await createAlertRequest(alertData)) as EpidemiologicalAlert;
    setAlertsState((prev) => [newAlert, ...prev]);
  };

  const stats = useMemo(() => {
    return getDynamicStats(
      selectedProvince,
      selectedHospitalType,
      selectedPeriod,
      selectedMunicipality,
      dateRangeStart,
      dateRangeEnd,
      hospitalsState,
      diseaseMetricsState,
      alertsState
    );
  }, [selectedProvince, selectedHospitalType, selectedPeriod, selectedMunicipality, dateRangeStart, dateRangeEnd, hospitalsState, diseaseMetricsState, alertsState]);

  const provinceAlertsMap = useMemo(() => {
    const map: Record<string, 'Normal' | 'Atenção' | 'Crítico'> = {};
    alertsState.forEach((alert) => {
      const current = map[alert.province];
      if (alert.alertLevel === 'Crítico') {
        map[alert.province] = 'Crítico';
      } else if (alert.alertLevel === 'Atenção' && current !== 'Crítico') {
        map[alert.province] = 'Atenção';
      } else if (!current) {
        map[alert.province] = 'Normal';
      }
    });
    return map;
  }, [alertsState]);

  return (
    <PortalContext.Provider value={{
      userSession,
      isSessionLoading,
      selectedProvince,
      selectedPeriod,
      selectedHospitalType,
      selectedMunicipality,
      dateRangeStart,
      dateRangeEnd,
      hospitalsState,
      alertsState,
      diseaseMetricsState,
      usersListState,
      stats,
      provinceAlertsMap,
      handleLoginSuccess,
      handleLogout,
      handleAddPatientToHospital,
      handleAddAlert,
      refreshSession,
      setSelectedProvince,
      setSelectedPeriod,
      setSelectedHospitalType,
      setSelectedMunicipality,
      setDateRangeStart,
      setDateRangeEnd
    }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within PortalProvider');
  }
  return context;
}
