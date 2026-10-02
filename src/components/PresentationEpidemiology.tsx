import { useEffect, useMemo, useState } from 'react';
import { Activity, MapPin, UsersRound } from 'lucide-react';
import type { StatisticsOverview } from '../server/statistics-service';
import { fetchStatisticsOverview } from '../lib/statistics';

export default function PresentationEpidemiology() {
  const [data,setData]=useState<StatisticsOverview|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [province,setProvince]=useState('ALL');

  useEffect(()=>{void fetchStatisticsOverview().then(setData).catch(e=>setError(e instanceof Error?e.message:'Falha ao consultar epidemiologia.'));},[]);

  const territorial=data?.territorial_epidemiology||[];
  const provinces=useMemo(()=>Array.from(new Set(territorial.map(x=>x.province).filter((x):x is string=>Boolean(x)))).sort(),[territorial]);
  const filtered=province==='ALL'?territorial:territorial.filter(x=>x.province===province);
  const provinceTotals=useMemo(()=>{
    const totals=new Map<string,number>();
    territorial.forEach(x=>{if(x.province) totals.set(x.province,(totals.get(x.province)||0)+Number(x.count||0));});
    return Array.from(totals.entries()).map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count);
  },[territorial]);
  const age=data?.age_distribution||[];
  const ageTotal=age.reduce((sum,row)=>sum+Number(row.count||0),0);

  return <div className="space-y-5">
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="glass-card rounded-2xl p-5"><MapPin className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Cobertura territorial</p><p className="mt-1 text-3xl font-bold">{provinces.length}</p><p className="text-xs text-slate-500">províncias com condição vinculada a instituição</p></section>
      <section className="glass-card rounded-2xl p-5"><UsersRound className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Perfil etário</p><p className="mt-1 text-3xl font-bold">{ageTotal}</p><p className="text-xs text-slate-500">pacientes com nascimento utilizável no agregado</p></section>
      <section className="glass-card rounded-2xl p-5"><Activity className="h-5 w-5 text-[#004a99]"/><p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Registos territorializados</p><p className="mt-1 text-3xl font-bold">{territorial.reduce((s,x)=>s+Number(x.count||0),0)}</p><p className="text-xs text-slate-500">condições com vínculo geográfico explícito</p></section>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="glass-card rounded-2xl p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Distribuição por faixa etária</h2><p className="text-xs text-slate-500">Distribuição etária da população registada</p></div></div><div className="mt-5 space-y-3">{age.map(row=>{const pct=ageTotal?Math.round((row.count/ageTotal)*100):0;return <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span>{row.label} anos</span><span className="font-semibold">{row.count} · {pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#004a99]" style={{width:`${pct}%`}}/></div></div>})}{!age.length?<p className="text-sm text-slate-400">Ainda sem datas de nascimento utilizáveis para este agregado.</p>:null}</div></section>
      <section className="glass-card rounded-2xl p-5"><h2 className="font-bold">Carga por província</h2><p className="text-xs text-slate-500">Soma de condições com vínculo institucional explícito</p><div className="mt-4 space-y-2">{provinceTotals.map(row=><button key={row.label} onClick={()=>setProvince(row.label)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-left hover:bg-slate-50"><span>{row.label}</span><span className="font-bold">{row.count}</span></button>)}{!provinceTotals.length?<p className="text-sm text-slate-400">Nenhum registo clínico possui vínculo territorial suficiente.</p>:null}</div></section>
    </div>

    <section className="glass-card rounded-2xl p-5"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 className="font-bold">Epidemiologia por província e município</h2><p className="text-xs text-slate-500">Distribuição das condições registadas por território.</p></div><select value={province} onChange={e=>setProvince(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="ALL">Todas as províncias</option>{provinces.map(p=><option key={p}>{p}</option>)}</select></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-400"><tr><th className="px-3 py-3">Província</th><th className="px-3 py-3">Município</th><th className="px-3 py-3">Condição</th><th className="px-3 py-3 text-right">Registos</th></tr></thead><tbody>{filtered.map((row,index)=><tr key={`${row.province}-${row.municipality}-${row.condition}-${index}`} className="border-b border-slate-100"><td className="px-3 py-3 font-medium">{row.province||'—'}</td><td className="px-3 py-3">{row.municipality||'Não especificado'}</td><td className="px-3 py-3">{row.condition}</td><td className="px-3 py-3 text-right font-bold">{row.count}</td></tr>)}</tbody></table></div>
    </section>
    {error?<p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>:null}
  </div>;
}
