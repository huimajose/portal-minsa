import { LockKeyhole } from 'lucide-react';

export default function MvpUnavailable({ title }: { title: string }) {
  return <div className="glass-panel rounded-2xl p-8 shadow-sm">
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><LockKeyhole className="h-5 w-5" /></div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#004a99]">OSIE MVP v1.0</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Este módulo foi congelado para o MVP. O Portal MINSA apresenta apenas indicadores agregados provenientes do Statistics Service. Funcionalidades sem fonte nacional validada não exibem dados de demonstração como se fossem dados reais.</p>
    </div>
  </div>;
}
