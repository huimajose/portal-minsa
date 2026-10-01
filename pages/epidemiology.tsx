import PortalShell from '../src/components/PortalShell';
import NationalStatisticsDashboard from '../src/components/NationalStatisticsDashboard';
import { usePortal } from '../src/context/PortalContext';

export default function EpidemiologyPage() {
  const { userSession } = usePortal();
  if (!userSession) return null;
  return (
    <PortalShell currentView="epidemiology">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Vigilância epidemiológica</h1>
        <p className="mt-1 text-sm text-slate-500">Condições clínicas agregadas a partir dos registos reais disponíveis na rede OSIE. Sem identificação individual de pacientes.</p>
      </div>
      <NationalStatisticsDashboard />
    </PortalShell>
  );
}
