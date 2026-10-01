import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Login from '../src/components/Login';
import { usePortal } from '../src/context/PortalContext';

export default function LoginPage() {
  const router = useRouter();
  const { userSession, isSessionLoading, handleLoginSuccess } = usePortal();

  useEffect(() => {
    if (!isSessionLoading && userSession) {
      void router.replace('/dashboard');
    }
  }, [isSessionLoading, userSession, router]);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-100 grid place-items-center px-4 text-slate-700">
        <span className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">A carregar autenticacao...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <Login
        onLoginSuccess={(session) => {
          handleLoginSuccess(session);
        }}
      />
    </div>
  );
}
