import { Database, KeyRound, ShieldCheck, Users } from 'lucide-react';
import PortalShell from '../src/components/PortalShell';
import { usePortal } from '../src/context/PortalContext';

export default function UsersPage() {
  const { userSession } = usePortal();
  if (!userSession) return null;
  return <PortalShell currentView="users">
    <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">OSIE · Governação</p><h1 className="mt-1 text-2xl font-bold">Administração</h1><p className="mt-1 text-sm text-slate-500">Identidade, permissões e estado das integrações administrativas do Portal MINSA.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <section className="glass-card rounded-2xl p-5"><Users className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Utilizadores MINSA</h2><p className="mt-2 text-sm text-slate-500">Diretório real aguardando endpoint administrativo autorizado do Auth Service. Nenhum utilizador é simulado.</p></section>
      <section className="glass-card rounded-2xl p-5"><KeyRound className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Perfil ativo</h2><p className="mt-2 text-sm text-slate-500">{userSession.name}</p><p className="mt-1 font-mono text-xs text-slate-500">{userSession.role}</p></section>
      <section className="glass-card rounded-2xl p-5"><Database className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Cadeia de dados</h2><p className="mt-2 text-sm text-slate-500">Portal MINSA → Statistics Service → Auth → Database Manager.</p></section>
    </div>
    <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><ShieldCheck className="h-5 w-5 shrink-0"/><p>Operações clínicas permanecem nos sistemas hospitalares. O Portal MINSA mantém escopo regulatório, estatístico e administrativo.</p></div>
  </PortalShell>;
}
