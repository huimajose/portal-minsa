import { useEffect, useState } from 'react';
import InstitutionHeatmap from './InstitutionHeatmap';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';

const fmt = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('pt-AO');

export default function NationalStatisticsDashboard() {
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchStatisticsOverview()
      .then((overview) => { if (mounted) { setData(overview); setError(null); } })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Serviço estatístico indisponível.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const provincesCovered = new Set((data?.network.organizations || []).map((org)=>org.province).filter(Boolean)).size;
  const municipalitiesCovered = new Set((data?.network.organizations || []).map((org)=>[org.province,org.municipality].filter(Boolean).join('::')).filter((value)=>value.includes('::'))).size;
  const georeferenced = (data?.network.organizations || []).filter((org)=>Number.isFinite(Number(org.latitude))&&Number.isFinite(Number(org.longitude))).length;
  const territorialRecords = (data?.territorial_epidemiology || []).reduce((sum,row)=>sum+Number(row.count||0),0);
  const cards = [
    ['Pacientes registados', data?.population.registered_patients],
    ['Instituições registadas', data?.network.registered_organizations],
    ['Consultas / encontros', data?.clinical_activity.encounters],
    ['Observações clínicas', data?.clinical_activity.observations],
    ['Condições clínicas', data?.clinical_activity.conditions],
    ['Nodes ativos', data?.network.active_nodes],
  ] as const;

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr] xl:items-end"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-sky-300">Centro Nacional de Situação</div><h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight">Estado consolidado da infraestrutura OSIE</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Cobertura institucional, atividade clínica agregada e situação territorial disponível para gestão nacional.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><strong className="mt-2 block text-2xl">{loading?'…':provincesCovered}</strong><span className="text-xs text-slate-300">províncias com instituições</span></div><div className="rounded-2xl bg-white/10 p-4"><strong className="mt-2 block text-2xl">{loading?'…':municipalitiesCovered}</strong><span className="text-xs text-slate-300">municípios representados</span></div></div></div>
    </section>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, value]) => <div key={label} className="glass-card rounded-2xl p-5">
        <div><span className="text-sm font-semibold text-slate-500">{label}</span></div>
        <div className="mt-4 font-mono text-3xl font-bold text-slate-900">{loading ? '…' : fmt(value)}</div>
      </div>)}
    </div>


    {data ? <InstitutionHeatmap organizations={data.network.organizations} territorial={data.territorial_epidemiology} compact /> : null}

    <section className="grid gap-4 md:grid-cols-3">
      <div className="glass-card rounded-2xl p-5"><p className="text-xs font-bold uppercase text-slate-500">Cobertura geográfica</p><strong className="mt-2 block text-2xl text-slate-900">{georeferenced}/{data?.network.organizations.length || 0}</strong><p className="mt-1 text-xs text-slate-500">instituições com coordenadas disponíveis</p></div>
      <div className="glass-card rounded-2xl p-5"><p className="text-xs font-bold uppercase text-slate-500">Cobertura territorial</p><strong className="mt-2 block text-2xl text-slate-900">{provincesCovered} prov. · {municipalitiesCovered} mun.</strong><p className="mt-1 text-xs text-slate-500">presença institucional registada no OSIE</p></div>
      <div className="glass-card rounded-2xl p-5"><p className="text-xs font-bold uppercase text-slate-500">Base epidemiológica</p><strong className="mt-2 block text-2xl text-slate-900">{fmt(territorialRecords)}</strong><p className="mt-1 text-xs text-slate-500">registos clínicos territorializados disponíveis</p></div>
    </section>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className="glass-panel rounded-2xl p-5">
        <h2 className="font-bold text-slate-800">Condições mais registadas</h2>
        <div className="mt-4 space-y-3">{data?.top_conditions.length ? data.top_conditions.map((item) => <div key={item.label} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm"><span>{item.label}</span><strong className="font-mono">{fmt(item.count)}</strong></div>) : <p className="text-sm text-slate-500">{loading ? 'A carregar…' : 'Sem dados agregados disponíveis.'}</p>}</div>
      </section>
      <section className="glass-panel rounded-2xl p-5">
        <h2 className="font-bold text-slate-800">Encontros por ano</h2>
        <div className="mt-4 space-y-3">{data?.encounters_by_year.length ? data.encounters_by_year.map((item) => <div key={item.year} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm"><span>{item.year}</span><strong className="font-mono">{fmt(item.count)}</strong></div>) : <p className="text-sm text-slate-500">{loading ? 'A carregar…' : 'Sem série temporal disponível.'}</p>}</div>
      </section>
    </div>
  </div>;
}
