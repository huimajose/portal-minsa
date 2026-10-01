import { useEffect, useState } from 'react';
import { Download, FileText, ShieldCheck } from 'lucide-react';
import { fetchStatisticsOverview } from '../lib/statistics';
import type { StatisticsOverview } from '../server/statistics-service';

export default function ReportsDashboard() {
  const [data,setData]=useState<StatisticsOverview|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{fetchStatisticsOverview().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Falha ao carregar dados do relatório.'));},[]);

  const exportPdf=async()=>{
    if(!data) return;
    const { jsPDF }=await import('jspdf');
    const doc=new jsPDF();
    doc.setFontSize(18); doc.text('OSIE - Relatorio Nacional MINSA',14,18);
    doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleString('pt-AO')}`,14,26);
    doc.text('Fonte: Statistics Service / Database Manager. Dados agregados, sem registos individuais.',14,33);
    const rows=[
      ['Pacientes registados',data.population.registered_patients],
      ['Instituicoes OSIE',data.network.registered_organizations],
      ['Encontros',data.clinical_activity.encounters],
      ['Observacoes',data.clinical_activity.observations],
      ['Condicoes',data.clinical_activity.conditions]
    ];
    let y=46; doc.setFontSize(13); doc.text('Indicadores nacionais',14,y); y+=9; doc.setFontSize(11);
    rows.forEach(([label,value])=>{doc.text(String(label),14,y);doc.text(String(value),120,y);y+=8;});
    y+=5; doc.setFontSize(13); doc.text('Instituicoes registadas',14,y); y+=8; doc.setFontSize(9);
    data.network.organizations.forEach((o)=>{ if(y>280){doc.addPage();y=18;} doc.text(`${o.name} | ${o.facility_code||'-'} | ${[o.municipality,o.province].filter(Boolean).join(', ')||'-'}`,14,y);y+=6;});
    doc.save(`osie-minsa-relatorio-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const exportCsv=()=>{
    if(!data) return;
    const rows=[['indicador','valor'],['pacientes_registados',data.population.registered_patients],['instituicoes_registadas',data.network.registered_organizations],['encontros',data.clinical_activity.encounters],['observacoes',data.clinical_activity.observations],['condicoes',data.clinical_activity.conditions]];
    const csv=rows.map((r)=>r.join(';')).join('\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`osie-minsa-indicadores-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <section className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2 text-[#004a99]"><FileText className="h-5 w-5"/><span className="text-xs font-bold uppercase tracking-[0.16em]">Relatório Nacional OSIE</span></div><h2 className="mt-2 text-xl font-bold">Snapshot executivo do MVP</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Exporta somente os agregados reais atualmente fornecidos pelo Statistics Service.</p></div>
        <div className="flex flex-wrap gap-2"><button disabled={!data} onClick={exportPdf} className="flex items-center gap-2 rounded-xl bg-[#004a99] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Download className="h-4 w-4"/>PDF</button><button disabled={!data} onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"><Download className="h-4 w-4"/>CSV</button></div>
      </div>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[['Pacientes',data?.population.registered_patients],['Instituições',data?.network.registered_organizations],['Encontros',data?.clinical_activity.encounters],['Observações',data?.clinical_activity.observations],['Condições',data?.clinical_activity.conditions]].map(([l,v])=><div key={String(l)} className="glass-card rounded-2xl p-4"><p className="text-xs font-bold uppercase text-slate-500">{l}</p><strong className="mt-2 block text-2xl">{v ?? '…'}</strong></div>)}
    </div>
    <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><ShieldCheck className="h-5 w-5 shrink-0"/><p><strong>Privacidade por desenho.</strong> Este módulo não exporta linhas clínicas nem identificadores individuais de pacientes.</p></div>
  </div>;
}
