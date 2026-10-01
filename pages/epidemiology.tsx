import PortalShell from '../src/components/PortalShell';
import EpidemiologyView from '../src/components/EpidemiologyView';
import { usePortal } from '../src/context/PortalContext';

export default function EpidemiologyPage() {
  const {
    diseaseMetricsState,
    alertsState,
    selectedProvince,
    setSelectedProvince,
    userSession,
    handleAddAlert
  } = usePortal();

  if (!userSession) return null;

  return (
    <PortalShell currentView="epidemiology">
      <EpidemiologyView
        diseaseMetrics={diseaseMetricsState}
        alerts={alertsState}
        selectedProvince={selectedProvince}
        onSelectProvince={setSelectedProvince}
        userRole={userSession.role}
        onAddAlert={handleAddAlert}
      />
    </PortalShell>
  );
}
