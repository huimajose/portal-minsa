import PortalShell from '../src/components/PortalShell';
import NetworkDashboard from '../src/components/NetworkDashboard';
export default function HospitalsPage(){return <PortalShell currentView="hospitals"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">OSIE · Rede Nacional</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Rede Hospitalar</h1><p className="mt-1 text-sm text-slate-500">Cobertura geográfica e diretório das instituições ligadas ao OSIE.</p></div><NetworkDashboard/></PortalShell>;}
