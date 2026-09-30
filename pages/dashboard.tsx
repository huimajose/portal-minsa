import PortalShell from '../src/components/PortalShell';
import NationalStatisticsDashboard from '../src/components/NationalStatisticsDashboard';

export default function DashboardPage() {
  return (
    <PortalShell currentView="dashboard">
      <NationalStatisticsDashboard />
    </PortalShell>
  );
}
