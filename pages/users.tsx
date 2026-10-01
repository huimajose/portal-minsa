import PortalShell from '../src/components/PortalShell';
import MvpUnavailable from '../src/components/MvpUnavailable';

export default function FrozenMvpPage() {
  return <PortalShell currentView="dashboard"><MvpUnavailable title="Gestão de Utilizadores" /></PortalShell>;
}
