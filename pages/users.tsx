import { useEffect, useState } from 'react';
import { Database, KeyRound, ShieldCheck, Users } from 'lucide-react';
import PortalShell from '../src/components/PortalShell';
import { usePortal } from '../src/context/PortalContext';

type SystemStatus = { portal:string; statistics_service:string; auth_service:string; database_manager:string };

export default function UsersPage() {
  const { userSession } = usePortal();
  const [system,setSystem]=useState<SystemStatus|null>(null);
  useEffect(()=>{ void fetch('/api/system/status',{cache:'no-store'}).then(async r=>{const b=await r.json();setSystem(b.data||null);}).catch(()=>setSystem(null)); },[]);
  if (!userSession) return null;
  const badge=(value?:string)=>value==='ok'?<span className="text-emerald-700">Operacional</span>:value?<span className="text-amber-700">{value}</span>:<span className="text-slate-400">A verificar</span>;
  return <PortalShell currentView="users">
    <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">OSIE · Governação</p><h1 className="mt-1 text-2xl font-bold">Administração</h1><p className="mt-1 text-sm text-slate-500">Identidade, permissões e saúde da cadeia regulatória do Portal MINSA.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <section className="glass-card rounded-2xl p-5"><Users className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Utilizadores MINSA</h2><p className="mt-2 text-sm text-slate-500">O diretório administrativo permanece no Auth Service. O perfil regulador não recebe utilizadores simulados nem privilégios de gestão que não possua.</p></section>
      <section className="glass-card rounded-2xl p-5"><KeyRound className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Perfil ativo</h2><p className="mt-2 text-sm text-slate-500">{userSession.name}</p><p className="mt-1 font-mono text-xs text-slate-500">{userSession.role}</p></section>
      <section className="glass-card rounded-2xl p-5"><Database className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Cadeia de dados</h2><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span>Portal MINSA</span>{badge(system?.portal)}</div><div className="flex justify-between"><span>Statistics Service</span>{badge(system?.statistics_service)}</div><div className="flex justify-between"><span>Auth Service</span>{badge(system?.auth_service)}</div><div className="flex justify-between"><span>Database Manager</span>{badge(system?.database_manager)}</div></div></section>
    </div>
    <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><ShieldCheck className="h-5 w-5 shrink-0"/><p>Operações clínicas permanecem nos sistemas hospitalares. O Portal MINSA mantém escopo regulatório, estatístico e administrativo.</p></div>
  </PortalShell>;
}
