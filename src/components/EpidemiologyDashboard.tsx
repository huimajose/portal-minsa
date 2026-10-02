import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, HeartPulse, SlidersHorizontal } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';

type Mode = 'total' | 'percentage';

export default function EpidemiologyDashboard() {
  const [data,setData]=useState<StatisticsOverview|null>(null);
  const [year,setYear]=useState('all');
  const [condition,setCondition]=useState('all');
  const [mode,setMode]=useState<Mode>('total');
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{fetchStatisticsOverview().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Falha ao carregar epidemiologia.'));},[]);

  const years=useMemo(()=>data?.encounters_by_year.map((x)=>String(x.year)).reverse()||[],[data]);
  const encounters=year==='all' ? data?.clinical_activity.encounters : data?.encounters_by_year.find((x)=>String(x.year)===year)?.count;
  const totalConditions=data?.top_conditions.reduce((sum,x)=>sum+x.count,0)||0;
  const conditionRows=useMemo(()=> {
    const rows=data?.top_conditions||[];
    const selected=condition==='all'?rows:rows.filter((x)=>x.label===condition);
    return selected.map((x)=>({name:x.label,value:mode==='percentage'&&totalConditions?Number(((x.count/totalConditions)*100).toFixed(1)):x.count}));
  },[data,condition,mode,totalConditions]);

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col border-b border-slate-200 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5 lg:border-b-0 lg:border-r"><SlidersHorizontal className="h-4 w-4 text-[#004a99]"/><strong className="text-sm">Registos clínicos agregados</strong></div>
        <div className="grid flex-1 gap-2 px-3 py-2 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-500">Indicador<select value={condition} onChange={(e)=>setCondition(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"><option value="all">Todas as condições</option>{data?.top_conditions.map((x)=><option key={x.label} value={x.label}>{x.label}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-500">Período<select value={year} onChange={(e)=>setYear(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"><option value="all">Todo o histórico</option>{years.map((y)=><option key={y}>{y}</option>)}</select></label>
          <div className="text-xs font-semibold text-slate-500">Métrica<div className="mt-1 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">{(['total','percentage'] as Mode[]).map((m)=><button key={m} onClick={()=>setMode(m)} className={`flex-1 rounded-md px-2 py-1 text-[11px] font-bold ${mode===m?'bg-[#004a99] text-white':'text-slate-500'}`}>{m==='total'?'Total':'Percentagem'}</button>)}</div></div>
        </div>
      </div>
      <div className="px-3 py-2.5">
        {conditionRows.length?<div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={conditionRows} layout="vertical" margin={{left:8,right:12}}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number"/><YAxis type="category" dataKey="name" width={120} tick={{fontSize:11}}/><Tooltip formatter={(value)=>[`${value}${mode==='percentage'?'%':''}`,mode==='percentage'?'Percentagem':'Total']}/><Bar dataKey="value" fill="#66cbd3" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div>:<p className="py-10 text-center text-sm text-slate-500">Sem condições agregadas.</p>}
      </div>
    </section>
    {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="glass-card rounded-2xl p-5"><HeartPulse className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Condições</p><strong className="mt-1 block text-3xl">{data?.clinical_activity.conditions??'…'}</strong></div>
      <div className="glass-card rounded-2xl p-5"><Activity className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Encontros {year==='all'?'':'em '+year}</p><strong className="mt-1 block text-3xl">{encounters??'…'}</strong></div>
      <div className="glass-card rounded-2xl p-5"><CalendarDays className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Observações</p><strong className="mt-1 block text-3xl">{data?.clinical_activity.observations??'…'}</strong></div>
    </div>
  </div>;
}