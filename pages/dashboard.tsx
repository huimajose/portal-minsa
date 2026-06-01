import PortalShell from '../src/components/PortalShell';
import DashboardView from '../src/components/DashboardView';
import { usePortal } from '../src/context/PortalContext';

export default function DashboardPage() {
  const portal = usePortal();

  return (
    <PortalShell currentView="dashboard">
      <DashboardView
        totals={portal.stats.totals}
        byProvince={portal.stats.byProvince}
        byDisease={portal.stats.byDisease}
        monthlyTrend={portal.stats.monthlyTrend}
        hospitals={portal.hospitalsState}
        selectedProvince={portal.selectedProvince}
        onSelectProvince={portal.setSelectedProvince}
        selectedPeriod={portal.selectedPeriod}
        onSelectPeriod={portal.setSelectedPeriod}
        selectedHospitalType={portal.selectedHospitalType}
        onSelectHospitalType={portal.setSelectedHospitalType}
        selectedMunicipality={portal.selectedMunicipality}
        onSelectMunicipality={portal.setSelectedMunicipality}
        userRole={portal.userSession?.role ?? 'VISUALIZADOR'}
      />
    </PortalShell>
  );
}
