import PortalShell from '../src/components/PortalShell';
import HospitalsView from '../src/components/HospitalsView';
import { usePortal } from '../src/context/PortalContext';

export default function HospitalsPage() {
  const portal = usePortal();

  const handleAddPatientToHospital = (
    hospitalId: string,
    consultationData?: { disease: string; isHospitalized: boolean; triageLevel: 'Normal' | 'Atenção' | 'Crítico' }
  ) => {
    return portal.handleAddPatientToHospital(hospitalId, consultationData);
  };

  return (
    <PortalShell currentView="hospitals">
      <HospitalsView
        hospitals={portal.hospitalsState}
        selectedProvince={portal.selectedProvince}
        onSelectProvince={portal.setSelectedProvince}
        userRole={portal.userSession?.role ?? 'VISUALIZADOR'}
        onAddPatientToHospital={handleAddPatientToHospital}
      />
    </PortalShell>
  );
}
