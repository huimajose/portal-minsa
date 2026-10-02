import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';

export default function ReportsDashboard() {
  const [data,setData]=useState<StatisticsOverview|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{fetchStatisticsOverview().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Falha ao carregar dados do relatório.'));},[]);

  return <div className="space-y-6">
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[['Pacientes',data?.population.registered_patients],['Instituições',data?.network.registered_organizations],['Encontros',data?.clinical_activity.encounters],['Observações',data?.clinical_activity.observations],['Condições',data?.clinical_activity.conditions]].map(([label,value])=><div key={String(label)} className="glass-card rounded-2xl p-4"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><strong className="mt-2 block text-2xl">{value ?? '…'}</strong></div>)}
    </div>
    <section className="glass-panel rounded-2xl p-5">
      <h2 className="font-bold text-slate-900">Resumo nacional</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">Nodes ativos</span><strong className="mt-1 block text-xl">{data?.network.active_nodes ?? '—'}</strong></div>
        <div className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">Instituições no diretório</span><strong className="mt-1 block text-xl">{data?.network.organizations.length ?? '—'}</strong></div>
      </div>
    </section>
    <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600"/>Dados agregados. Nenhum registo clínico individual é apresentado.</div>
  </div>;
}