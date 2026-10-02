import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';
import InstitutionHeatmap from './InstitutionHeatmap';

export default function NetworkDashboard() {
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { fetchStatisticsOverview().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar a rede.')); }, []);
  const orgs = data?.network.organizations || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? orgs.filter((o) => [o.name,o.facility_code,o.municipality,o.province,o.status].some((v) => v?.toLowerCase().includes(q))) : orgs;
  }, [orgs, query]);
  const located = orgs.filter((o) => Number.isFinite(Number(o.latitude)) && Number.isFinite(Number(o.longitude))).length;
  const selectedOrg = orgs.find((org)=>org.id===selectedId) || null;
  const selectedTerritorial = selectedOrg ? (data?.territorial_epidemiology || []).filter((row)=>String(row.province||'').toLowerCase()===String(selectedOrg.province||'').toLowerCase() && (!selectedOrg.municipality || String(row.municipality||'').toLowerCase()===String(selectedOrg.municipality).toLowerCase())) : [];
  const selectedRecords = selectedTerritorial.reduce((sum,row)=>sum+Number(row.count||0),0);
  const selectedConditions = Array.from(selectedTerritorial.reduce((map,row)=>map.set(row.condition,(map.get(row.condition)||0)+Number(row.count||0)),new Map<string,number>()).entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="glass-card rounded-2xl p-5"><p className="text-xs font-bold uppercase text-slate-500">Instituições</p><strong className="mt-1 block text-3xl">{orgs.length}</strong></div>
      <div className="glass-card rounded-2xl p-5"><p className="text-xs font-bold uppercase text-slate-500">Georreferenciadas</p><strong className="mt-1 block text-3xl">{located}</strong></div>
      <div className="glass-card rounded-2xl p-5"><p className="text-xs font-bold uppercase text-slate-500">Nodes ativos</p><strong className="mt-1 block text-3xl">{data?.network.active_nodes ?? '—'}</strong></div>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <InstitutionHeatmap organizations={orgs} territorial={data?.territorial_epidemiology || []} />
    <section className="glass-panel rounded-2xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold text-slate-900">Diretório institucional</h2>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><Search className="h-4 w-4 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Pesquisar instituição ou cidade" className="w-64 max-w-full bg-transparent text-sm outline-none"/></label>
      </div>
      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Instituição</th><th>Código</th><th>Localização</th><th>Estado</th></tr></thead><tbody>
        {filtered.map((o)=><tr key={o.id} onClick={()=>setSelectedId(o.id)} className={`cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/60 ${selectedId===o.id?'bg-blue-50':''}`}><td className="py-3 font-semibold"><span>{o.name}</span></td><td className="font-mono text-xs">{o.facility_code || '—'}</td><td>{[o.municipality,o.province].filter(Boolean).join(', ') || '—'}</td><td>{o.status || '—'}</td></tr>)}
      </tbody></table>{!filtered.length && <p className="py-6 text-center text-sm text-slate-500">Nenhuma instituição encontrada.</p>}</div>
      <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">{selectedOrg ? <div className="space-y-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#004a99]">Ficha institucional</p><h3 className="mt-1 text-lg font-bold text-slate-900">{selectedOrg.name}</h3><p className="mt-1 font-mono text-xs text-slate-500">{selectedOrg.facility_code || selectedOrg.id}</p></div><button onClick={()=>setSelectedId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"><X className="h-4 w-4"/></button></div>
      <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-white p-3"><span className="text-slate-400">Tipo</span><strong className="mt-1 block text-slate-700">{selectedOrg.type || '—'}</strong></div><div className="rounded-xl bg-white p-3"><span className="text-slate-400">Estado</span><strong className="mt-1 block text-slate-700">{selectedOrg.status || '—'}</strong></div><div className="rounded-xl bg-white p-3"><span className="text-slate-400">Província</span><strong className="mt-1 block text-slate-700">{selectedOrg.province || '—'}</strong></div><div className="rounded-xl bg-white p-3"><span className="text-slate-400">Município</span><strong className="mt-1 block text-slate-700">{selectedOrg.municipality || '—'}</strong></div></div>
      <div><p className="text-xs font-bold text-slate-700">Georreferenciação</p><p className="mt-1 text-xs text-slate-500">{Number.isFinite(Number(selectedOrg.latitude))&&Number.isFinite(Number(selectedOrg.longitude))?`${selectedOrg.latitude}, ${selectedOrg.longitude}`:'Coordenadas não disponíveis'}</p>{selectedOrg.neighborhood?<p className="mt-1 text-xs text-slate-500">Zona: {selectedOrg.neighborhood}</p>:null}</div>
      <div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Registos territorializados no município</p><strong className="mt-1 block text-2xl text-slate-900">{selectedRecords || '—'}</strong><p className="mt-1 text-[10px] leading-4 text-slate-400">Agregado territorial. Não representa necessariamente produção exclusiva desta instituição.</p></div>
      <div><p className="text-xs font-bold text-slate-700">Condições agregadas no território</p><div className="mt-2 space-y-1.5">{selectedConditions.length?selectedConditions.map(([label,count])=><div key={label} className="flex justify-between rounded-lg bg-white px-2.5 py-2 text-xs"><span>{label}</span><strong>{count}</strong></div>):<p className="text-xs text-slate-500">Sem dados territorializados disponíveis.</p>}</div></div>
      <div className="border-t border-slate-200 pt-3 text-[10px] leading-4 text-slate-400">Fonte: diretório institucional e agregados territoriais OSIE. Nenhum registo clínico individual é apresentado.</div></div> : <div className="flex min-h-64 items-center justify-center text-center"><p className="text-sm font-semibold text-slate-500">Selecione uma instituição</p></div>}</aside></div>
    </section>
  </div>;
}
