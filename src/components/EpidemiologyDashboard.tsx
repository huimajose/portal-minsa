import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Database, HeartPulse, SlidersHorizontal } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';

type Mode = 'total' | 'percentage';

function EmptyAnalytic({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 text-center">
    <Database className="h-7 w-7 text-slate-400" />
    <h3 className="mt-3 font-bold text-slate-700">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>
  </div>;
}

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
    return selected.map((x)=>({name:x.label,total:x.count,value:mode==='percentage'&&totalConditions?Number(((x.count/totalConditions)*100).toFixed(1)):x.count}));
  },[data,condition,mode,totalConditions]);
  const values=conditionRows.map((x)=>x.value);
  const summary=values.length?{min:Math.min(...values),max:Math.max(...values),mean:values.reduce((a,b)=>a+b,0)/values.length}:null;

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid border-b border-slate-200 lg:grid-cols-[1fr_1.5fr]">
        <div className="flex items-center gap-3 border-b p-4 lg:border-b-0 lg:border-r">
          <SlidersHorizontal className="h-5 w-5 text-[#004a99]"/><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Fonte</p><strong className="text-sm">OSIE · Registos clínicos agregados</strong></div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-500">Indicador<select value={condition} onChange={(e)=>setCondition(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800"><option value="all">Todas as condições</option>{data?.top_conditions.map((x)=><option key={x.label} value={x.label}>{x.label}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-500">Período<select value={year} onChange={(e)=>setYear(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800"><option value="all">Todo o histórico</option>{years.map((y)=><option key={y}>{y}</option>)}</select></label>
          <div className="text-xs font-semibold text-slate-500">Métrica<div className="mt-1 flex rounded-lg border border-slate-200 bg-slate-50 p-1">{(['total','percentage'] as Mode[]).map((m)=><button key={m} onClick={()=>setMode(m)} className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold ${mode===m?'bg-[#004a99] text-white':'text-slate-500'}`}>{m==='total'?'Total':'Percentagem'}</button>)}</div></div>
        </div>
      </div>


          <section className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Distribuição territorial</h3><p className="mt-1 text-xs text-slate-500">Treemap por província/município</p><div className="mt-3"><EmptyAnalytic title="Agregado territorial ainda indisponível" text="A localização das instituições existe, mas as condições clínicas ainda não possuem uma dimensão territorial confiável no contrato analítico."/></div></section>
        </div>
      </div>
    </section>

    {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    <div className="grid gap-4 sm:grid-cols-3">
      <div className="glass-card rounded-2xl p-5"><HeartPulse className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Condições</p><strong className="mt-1 block text-3xl">{data?.clinical_activity.conditions??'…'}</strong></div>
      <div className="glass-card rounded-2xl p-5"><Activity className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Encontros {year==='all'?'':'em '+year}</p><strong className="mt-1 block text-3xl">{encounters??'…'}</strong></div>
      <div className="glass-card rounded-2xl p-5"><CalendarDays className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">Observações</p><strong className="mt-1 block text-3xl">{data?.clinical_activity.observations??'…'}</strong></div>
    </div>

    <section className="glass-panel rounded-2xl p-5"><div><h2 className="font-bold">Distribuição por faixa etária</h2><p className="text-xs text-slate-500">Estrutura preparada para 0–4, 5–9, 10–14 e intervalos subsequentes.</p></div><div className="mt-4"><EmptyAnalytic title="Idade clínica ainda não agregada" text="O gráfico não será estimado. Ele será ativado quando o DBM disponibilizar data de nascimento/idade associável às condições através de um endpoint agregado e sem PII."/></div></section>
  </div>;
}
