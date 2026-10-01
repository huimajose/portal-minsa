import PortalShell from '../src/components/PortalShell';
import HospitalsView from '../src/components/HospitalsView';
import { usePortal } from '../src/context/PortalContext';

export default function HospitalsPage() {
  const {
    hospitalsState,
    selectedProvince,
    setSelectedProvince,
    userSession,
    handleAddPatientToHospital
  } = usePortal();

  if (!userSession) return null;

  return (
    <PortalShell currentView="hospitals">
      <HospitalsView
        hospitals={hospitalsState}
        selectedProvince={selectedProvince}
        onSelectProvince={setSelectedProvince}
        userRole={userSession.role}
        onAddPatientToHospital={handleAddPatientToHospital}
      />
    </PortalShell>
  );
}
