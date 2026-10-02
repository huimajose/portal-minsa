import { useEffect, useState } from 'react';
import { Activity, Building2, ClipboardList, Database, HeartPulse, Users } from 'lucide-react';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';
import { localizeValue } from '../lib/localize';

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

  const cards = [
    ['Pacientes registados', data?.population.registered_patients, Users],
    ['Instituições registadas', data?.network.registered_organizations, Building2],
    ['Consultas / encontros', data?.clinical_activity.encounters, ClipboardList],
    ['Observações clínicas', data?.clinical_activity.observations, Activity],
    ['Condições clínicas', data?.clinical_activity.conditions, HeartPulse],
    ['Nodes ativos', data?.network.active_nodes, Database],
  ] as const;

  return <div className="space-y-6">
    <div className="glass-panel rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#004a99]">OSIE · Visão Nacional</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Indicadores nacionais de interoperabilidade</h1>
          <p className="mt-1 text-sm text-slate-500">Panorama consolidado da rede nacional de saúde.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${error ? 'bg-red-50 text-red-700' : loading ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error ? 'Serviço indisponível' : loading ? 'A sincronizar…' : 'Atualizado'}
        </span>
      </div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, value, Icon]) => <div key={label} className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><Icon className="h-5 w-5 text-[#004a99]" /></div>
        <div className="mt-4 font-mono text-3xl font-bold text-slate-900">{loading ? '…' : fmt(value)}</div>
        {label === 'Nodes ativos' && value == null && !loading && <p className="mt-2 text-xs text-slate-500">Informação ainda indisponível.</p>}
      </div>)}
    </div>


    <section className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-800">Instituições OSIE registadas</h2>
          <p className="mt-1 text-xs text-slate-500">Instituições participantes na rede nacional.</p>
        </div>
        <Building2 className="h-5 w-5 text-[#004a99]" />
      </div>
      <div className="mt-4 overflow-x-auto">
        {data?.network.organizations?.length ? <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="py-2 pr-4">Instituição</th><th className="py-2 pr-4">Código</th><th className="py-2 pr-4">Tipo</th><th className="py-2 pr-4">Estado</th><th className="py-2">Localização</th></tr></thead>
          <tbody>{data.network.organizations.map((org) => <tr key={org.id} className="border-b border-slate-100">
            <td className="py-3 pr-4 font-semibold text-slate-800">{org.name}</td>
            <td className="py-3 pr-4 font-mono text-xs text-slate-600">{org.facility_code || '—'}</td>
            <td className="py-3 pr-4">{localizeValue(org.type)}</td>
            <td className="py-3 pr-4">{localizeValue(org.status)}</td>
            <td className="py-3">{[org.municipality, org.province].filter(Boolean).join(', ') || 'Não disponível no registo'}</td>
          </tr>)}</tbody>
        </table> : <p className="text-sm text-slate-500">{loading ? 'A carregar…' : 'Nenhuma instituição disponível no registo OSIE.'}</p>}
      </div>
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
