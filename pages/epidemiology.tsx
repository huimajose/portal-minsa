import PortalShell from '../src/components/PortalShell';
import EpidemiologyView from '../src/components/EpidemiologyView';
import { usePortal } from '../src/context/PortalContext';

export default function EpidemiologyPage() {
  const portal = usePortal();

  return (
    <PortalShell currentView="epidemiology">
      <EpidemiologyView
        diseaseMetrics={portal.diseaseMetricsState}
        alerts={portal.alertsState}
        selectedProvince={portal.selectedProvince}
        onSelectProvince={portal.setSelectedProvince}
        userRole={portal.userSession?.role ?? 'VISUALIZADOR'}
        onAddAlert={portal.handleAddAlert}
      />
    </PortalShell>
  );
}
