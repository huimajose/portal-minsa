import PortalShell from '../src/components/PortalShell';
import EpidemiologyDashboard from '../src/components/EpidemiologyDashboard';
import PresentationEpidemiology from '../src/components/PresentationEpidemiology';

export default function EpidemiologyPage(){
  return <PortalShell currentView="epidemiology">
    <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">OSIE · Saúde Pública</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Epidemiologia</h1><p className="mt-1 text-sm text-slate-500">Indicadores clínicos agregados, dimensão territorial e perfil etário para vigilância nacional, sem exposição de pacientes.</p></div>
    <EpidemiologyDashboard/>
    <PresentationEpidemiology/>
  </PortalShell>;
}
