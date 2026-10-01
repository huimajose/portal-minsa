import PortalShell from '../src/components/PortalShell';
import ReportsView from '../src/components/ReportsView';
import { usePortal } from '../src/context/PortalContext';

export default function ReportsPage() {
  const {
    stats,
    hospitalsState,
    selectedProvince,
    selectedPeriod,
    selectedMunicipality,
    selectedHospitalType,
    dateRangeStart,
    dateRangeEnd,
    setSelectedProvince,
    setSelectedPeriod,
    setSelectedMunicipality,
    setSelectedHospitalType,
    setDateRangeStart,
    setDateRangeEnd,
    userSession
  } = usePortal();

  if (!userSession) return null;

  return (
    <PortalShell currentView="reports">
      <ReportsView
        totals={stats.totals}
        byProvince={stats.byProvince}
        byDisease={stats.byDisease}
        selectedProvince={selectedProvince}
        onSelectProvince={setSelectedProvince}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        selectedMunicipality={selectedMunicipality}
        onSelectMunicipality={setSelectedMunicipality}
        dateRangeStart={dateRangeStart}
        onSelectDateRangeStart={setDateRangeStart}
        dateRangeEnd={dateRangeEnd}
        onSelectDateRangeEnd={setDateRangeEnd}
        selectedHospitalType={selectedHospitalType}
        onSelectHospitalType={setSelectedHospitalType}
        hospitals={hospitalsState}
        userRole={userSession.role}
        currentUserName={userSession.name}
      />
    </PortalShell>
  );
}
