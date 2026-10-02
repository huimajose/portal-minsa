import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from './Navigation';
import { usePortal } from '../context/PortalContext';

interface PortalShellProps {
  currentView: string;
  children: React.ReactNode;
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Visão Nacional',
  hospitals: 'Rede Hospitalar',
  epidemiology: 'Epidemiologia',
  reports: 'Relatórios',
  users: 'Administração',
};

const normalizeViewToPath = (view: string) => {
  if (view === 'dashboard') {
    return '/dashboard';
  }
  return `/${view}`;
};

export default function PortalShell({ currentView, children }: PortalShellProps) {
  const router = useRouter();
  const {
    userSession,
    isSessionLoading,
    handleLogout,
    setSelectedProvince
  } = usePortal();

  useEffect(() => {
    if (!isSessionLoading && !userSession) {
      void router.replace('/login');
    }
  }, [isSessionLoading, userSession, router]);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-100 grid place-items-center px-4 text-slate-700">
        <span className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">A carregar o portal...</span>
      </div>
    );
  }

  if (!userSession) {
    return (
      <div className="min-h-screen bg-slate-100 grid place-items-center px-4">
        <span className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200 text-slate-700">
          A redirecionar para o login seguro...
        </span>
      </div>
    );
  }

  const handleRouteChange = (view: string) => {
    void router.push(normalizeViewToPath(view));
  };

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    void router.push('/dashboard');
  };

  const pageTitle = VIEW_TITLES[currentView] || 'Portal MINSA';

  return (
    <>
      <Head>
        <title>{pageTitle} | OSIE</title>
      </Head>
      <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navigation
        currentView={currentView}
        onSetView={handleRouteChange}
        userSession={userSession}
        onLogout={handleLogout}
        alerts={[]}
        onSelectProvince={handleProvinceSelect}
        isTopBar={true}
      />

      <div className="mx-auto max-w-full lg:max-w-[1600px] px-3 py-4 lg:px-6 lg:py-6">
        <section className="space-y-6">
          {children}
        </section>
      </div>
    </div>
    </>
  );
}
