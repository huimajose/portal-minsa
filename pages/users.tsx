import PortalShell from '../src/components/PortalShell';
import { usePortal } from '../src/context/PortalContext';

export default function UsersPage() {
  const { userSession } = usePortal();
  if (!userSession) return null;
  return (
    <PortalShell currentView="users">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Gestão de utilizadores</h1>
        <p className="mt-2 text-sm text-slate-500">O diretório demonstrativo foi removido. A gestão real de identidades pertence ao Auth Service e será apresentada aqui apenas através de um endpoint administrativo autorizado.</p>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Nenhuma lista de utilizadores é simulada neste portal.</div>
      </div>
    </PortalShell>
  );
}
