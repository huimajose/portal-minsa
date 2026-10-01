import { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Radio, Search } from 'lucide-react';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';
import InstitutionHeatmap from './InstitutionHeatmap';

export default function NetworkDashboard() {
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchStatisticsOverview().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar a rede.')); }, []);
  const orgs = data?.network.organizations || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? orgs.filter((o) => [o.name,o.facility_code,o.municipality,o.province,o.status].some((v) => v?.toLowerCase().includes(q))) : orgs;
  }, [orgs, query]);
  const located = orgs.filter((o) => Number.isFinite(Number(o.latitude)) && Number.isFinite(Number(o.longitude))).length;

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="glass-card rounded-2xl p-5"><Building2 className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Instituições</p><strong className="mt-1 block text-3xl">{orgs.length}</strong></div>
      <div className="glass-card rounded-2xl p-5"><MapPin className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Georreferenciadas</p><strong className="mt-1 block text-3xl">{located}</strong></div>
      <div className="glass-card rounded-2xl p-5"><Radio className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Nodes ativos</p><strong className="mt-1 block text-3xl">{data?.network.active_nodes ?? '—'}</strong></div>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <InstitutionHeatmap organizations={orgs} />
    <section className="glass-panel rounded-2xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-bold text-slate-900">Diretório institucional</h2><p className="text-xs text-slate-500">Instituições reais registadas na rede OSIE.</p></div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><Search className="h-4 w-4 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Pesquisar instituição ou cidade" className="w-64 max-w-full bg-transparent text-sm outline-none"/></label>
      </div>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Instituição</th><th>Código</th><th>Localização</th><th>Estado</th></tr></thead><tbody>
        {filtered.map((o)=><tr key={o.id} className="border-b border-slate-100"><td className="py-3 font-semibold">{o.name}</td><td className="font-mono text-xs">{o.facility_code || '—'}</td><td>{[o.municipality,o.province].filter(Boolean).join(', ') || '—'}</td><td>{o.status || '—'}</td></tr>)}
      </tbody></table>{!filtered.length && <p className="py-6 text-center text-sm text-slate-500">Nenhuma instituição encontrada.</p>}</div>
    </section>
  </div>;
}
