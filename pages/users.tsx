import PortalShell from '../src/components/PortalShell';
import UsersView from '../src/components/UsersView';
import { usePortal } from '../src/context/PortalContext';

export default function UsersPage() {
  const portal = usePortal();

  return (
    <PortalShell currentView="users">
      <UsersView
        userSession={portal.userSession}
        usersList={portal.usersListState}
      />
    </PortalShell>
  );
}
