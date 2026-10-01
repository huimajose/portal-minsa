import PortalShell from '../src/components/PortalShell';
import NationalStatisticsDashboard from '../src/components/NationalStatisticsDashboard';
import { usePortal } from '../src/context/PortalContext';

export default function ReportsPage() {
  const { userSession } = usePortal();
  if (!userSession) return null;
  return (
    <PortalShell currentView="reports">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Relatórios nacionais</h1>
        <p className="mt-1 text-sm text-slate-500">Base estatística read-only construída exclusivamente com agregados reais do OSIE. Novos relatórios serão habilitados à medida que os respetivos agregados estiverem disponíveis.</p>
      </div>
      <NationalStatisticsDashboard />
    </PortalShell>
  );
}
