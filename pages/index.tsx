import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100 grid place-items-center px-4 text-slate-700">
      <span className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">A redirecionar para o dashboard...</span>
    </div>
  );
}
