import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, HeartPulse } from 'lucide-react';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';

export default function EpidemiologyDashboard() {
  const [data,setData]=useState<StatisticsOverview|null>(null);
  const [year,setYear]=useState<string>('all');
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{fetchStatisticsOverview().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Falha ao carregar epidemiologia.'));},[]);
  const years=useMemo(()=>data?.encounters_by_year.map((x)=>String(x.year)).reverse()||[],[data]);
  const encounters=year==='all' ? data?.clinical_activity.encounters : data?.encounters_by_year.find((x)=>String(x.year)===year)?.count;

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">Vigilância agregada</p><p className="mt-1 text-sm text-slate-500">Sem identificação individual de pacientes.</p></div>
      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><CalendarDays className="h-4 w-4"/><span>Período</span><select value={year} onChange={(e)=>setYear(e.target.value)} className="bg-transparent font-semibold outline-none"><option value="all">Todo o histórico</option>{years.map((y)=><option key={y}>{y}</option>)}</select></label>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="glass-card rounded-2xl p-5"><HeartPulse className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Condições registadas</p><strong className="mt-1 block text-3xl">{data?.clinical_activity.conditions ?? '…'}</strong></div>
      <div className="glass-card rounded-2xl p-5"><Activity className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Encontros {year==='all'?'':'em '+year}</p><strong className="mt-1 block text-3xl">{encounters ?? '…'}</strong></div>
      <div className="glass-card rounded-2xl p-5"><Activity className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Observações</p><strong className="mt-1 block text-3xl">{data?.clinical_activity.observations ?? '…'}</strong></div>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="glass-panel rounded-2xl p-5"><h2 className="font-bold">Condições mais registadas</h2><div className="mt-4 space-y-2">{data?.top_conditions.length?data.top_conditions.map((x,i)=><div key={x.label} className="flex items-center gap-3 rounded-xl bg-white/60 p-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#004a99]/10 text-xs font-bold text-[#004a99]">{i+1}</span><span className="flex-1 text-sm font-medium">{x.label}</span><strong>{x.count}</strong></div>):<p className="text-sm text-slate-500">Sem condições agregadas disponíveis.</p>}</div></section>
      <section className="glass-panel rounded-2xl p-5"><h2 className="font-bold">Atividade por ano</h2><div className="mt-4 space-y-2">{data?.encounters_by_year.length?data.encounters_by_year.map((x)=><div key={x.year} className="flex justify-between rounded-xl bg-white/60 p-3 text-sm"><span>{x.year}</span><strong>{x.count} encontros</strong></div>):<p className="text-sm text-slate-500">Sem série temporal disponível.</p>}</div></section>
    </div>
  </div>;
}
