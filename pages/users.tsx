import PortalShell from '../src/components/PortalShell';
import UsersView from '../src/components/UsersView';
import { usePortal } from '../src/context/PortalContext';

export default function UsersPage() {
  const { userSession, usersListState } = usePortal();

  return (
    <PortalShell currentView="users">
      <UsersView userSession={userSession} usersList={usersListState} />
    </PortalShell>
  );
}
