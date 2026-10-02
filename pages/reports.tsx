import PortalShell from '../src/components/PortalShell';
import ReportsDashboard from '../src/components/ReportsDashboard';
export default function ReportsPage(){return <PortalShell currentView="reports"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">OSIE · Informação Executiva</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Relatórios</h1></div><ReportsDashboard/></PortalShell>;}
