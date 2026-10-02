import { useEffect, useMemo, useState } from 'react';
import { Database, KeyRound, Search, Users } from 'lucide-react';
import PortalShell from '../src/components/PortalShell';
import { usePortal } from '../src/context/PortalContext';
import type { AdministrativeUserDirectoryEntry } from '../src/server/auth-service';

type SystemStatus = { portal:string; statistics_service:string; auth_service:string; database_manager:string };

export default function UsersPage() {
  const { userSession } = usePortal();
  const [system,setSystem]=useState<SystemStatus|null>(null);
  const [users,setUsers]=useState<AdministrativeUserDirectoryEntry[]>([]);
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    void fetch('/api/system/status',{cache:'no-store'}).then(async r=>{const b=await r.json();setSystem(b.data||null);}).catch(()=>setSystem(null));
    void fetch('/api/admin/users',{cache:'no-store'}).then(async r=>{
      const b=await r.json();
      if(!r.ok) throw new Error(b.error||'Falha ao consultar utilizadores.');
      setUsers(Array.isArray(b.data)?b.data:[]);
    }).catch(e=>setError(e instanceof Error?e.message:'Falha ao consultar utilizadores.')).finally(()=>setLoading(false));
  },[]);

  const filtered=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    if(!needle) return users;
    return users.filter(user=>[user.display_name,user.username,user.role,user.organization_name,user.status,user.facility_code]
      .some(value=>String(value||'').toLowerCase().includes(needle)));
  },[users,query]);

  if (!userSession) return null;
  const badge=(value?:string)=>value==='ok'?<span className="text-emerald-700">Operacional</span>:value?<span className="text-amber-700">{value}</span>:<span className="text-slate-400">A verificar</span>;

  return <PortalShell currentView="users">
    <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">OSIE · Governação</p><h1 className="mt-1 text-2xl font-bold">Administração</h1><p className="mt-1 text-sm text-slate-500">Gestão e consulta dos utilizadores autorizados.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <section className="glass-card rounded-2xl p-5"><Users className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Utilizadores registados</h2><p className="mt-2 text-3xl font-bold text-slate-900">{loading?'…':users.length}</p><p className="mt-1 text-xs text-slate-500">Utilizadores disponíveis</p></section>
      <section className="glass-card rounded-2xl p-5"><KeyRound className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Perfil ativo</h2><p className="mt-2 text-sm text-slate-500">{userSession.name}</p><p className="mt-1 font-mono text-xs text-slate-500">{userSession.role}</p></section>
      <section className="glass-card rounded-2xl p-5"><Database className="h-5 w-5 text-[#004a99]"/><h2 className="mt-3 font-bold">Disponibilidade dos sistemas</h2><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span>Portal MINSA</span>{badge(system?.portal)}</div><div className="flex justify-between"><span>Estatísticas</span>{badge(system?.statistics_service)}</div><div className="flex justify-between"><span>Identidade</span>{badge(system?.auth_service)}</div><div className="flex justify-between"><span>Dados</span>{badge(system?.database_manager)}</div></div></section>
    </div>

    <section className="glass-card rounded-2xl p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h2 className="font-bold text-slate-900">Diretório administrativo</h2><p className="text-sm text-slate-500">Utilizadores e respetivo vínculo institucional.</p></div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><Search className="h-4 w-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar utilizador ou instituição" className="w-64 max-w-full outline-none"/></label>
      </div>
      {error?<p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>:null}
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-400"><tr><th className="px-3 py-3">Utilizador</th><th className="px-3 py-3">Função</th><th className="px-3 py-3">Instituição</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3">Confirmação</th></tr></thead><tbody>{filtered.map(user=><tr key={user.identifier||user.username||Math.random()} className="border-b border-slate-100"><td className="px-3 py-3"><p className="font-semibold">{user.display_name||user.username||'Sem nome'}</p><p className="text-xs text-slate-400">{user.username}</p></td><td className="px-3 py-3">{user.role||user.user_type||'—'}</td><td className="px-3 py-3"><p>{user.organization_name||'—'}</p><p className="text-xs text-slate-400">{user.facility_code||user.organization_id||''}</p></td><td className="px-3 py-3">{user.status||'—'}</td><td className="px-3 py-3">{user.confirmed?'Confirmado':'Pendente'}</td></tr>)}</tbody></table></div>
      {!loading&&!filtered.length&&!error?<p className="py-8 text-center text-sm text-slate-400">Nenhum utilizador corresponde ao filtro.</p>:null}
    </section>
  </PortalShell>;
}
