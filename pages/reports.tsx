import PortalShell from '../src/components/PortalShell';
import ReportsView from '../src/components/ReportsView';
import { usePortal } from '../src/context/PortalContext';

export default function ReportsPage() {
  const portal = usePortal();

  return (
    <PortalShell currentView="reports">
      <ReportsView
        totals={portal.stats.totals}
        byProvince={portal.stats.byProvince}
        byDisease={portal.stats.byDisease}
        selectedProvince={portal.selectedProvince}
        onSelectProvince={portal.setSelectedProvince}
        selectedPeriod={portal.selectedPeriod}
        onSelectPeriod={portal.setSelectedPeriod}
        selectedMunicipality={portal.selectedMunicipality}
        onSelectMunicipality={portal.setSelectedMunicipality}
        dateRangeStart={portal.dateRangeStart}
        onSelectDateRangeStart={portal.setDateRangeStart}
        dateRangeEnd={portal.dateRangeEnd}
        onSelectDateRangeEnd={portal.setDateRangeEnd}
        selectedHospitalType={portal.selectedHospitalType}
        onSelectHospitalType={portal.setSelectedHospitalType}
        hospitals={portal.hospitalsState}
        userRole={portal.userSession?.role ?? 'VISUALIZADOR'}
        currentUserName={portal.userSession?.name ?? 'Usuário'}
      />
    </PortalShell>
  );
}
