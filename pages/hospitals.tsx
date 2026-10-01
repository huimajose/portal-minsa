import PortalShell from '../src/components/PortalShell';
import NationalStatisticsDashboard from '../src/components/NationalStatisticsDashboard';
import { usePortal } from '../src/context/PortalContext';

export default function HospitalsPage() {
  const { userSession } = usePortal();
  if (!userSession) return null;

  return (
    <PortalShell currentView="hospitals">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Rede institucional OSIE</h1>
        <p className="mt-1 text-sm text-slate-500">Consulta read-only das instituições e indicadores reais registados na rede. Operações clínicas permanecem nos sistemas hospitalares.</p>
      </div>
      <NationalStatisticsDashboard />
    </PortalShell>
  );
}
