/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { UserSession } from '../types';
import { hasPermission } from './RoleGuard';

interface NavigationProps {
  currentView: string;
  onSetView: (v: string) => void;
  userSession: UserSession | null;
  onLogout: () => void | Promise<void>;
  alerts?: unknown[];
  onSelectProvince?: (province: string) => void;
  isTopBar?: boolean;
}

export default function Navigation({ currentView, onSetView, userSession, onLogout }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const items = [
    { id: 'dashboard', label: 'Visão Nacional' },
    { id: 'hospitals', label: 'Rede Hospitalar' },
    { id: 'epidemiology', label: 'Epidemiologia' },
    { id: 'reports', label: 'Relatórios' },
    ...(userSession && hasPermission(userSession, 'MANAGE_USERS')
      ? [{ id: 'users', label: 'Administração' }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md no-print">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 lg:px-6">
        <button onClick={() => onSetView('dashboard')} className="flex min-w-0 items-center gap-3 text-left">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-[#004a99] text-sm font-black text-white"><img src="/logo.png" alt="" className="h-full w-full object-contain" onError={(e)=>{e.currentTarget.style.display='none';e.currentTarget.parentElement?.append('M');}} /></span>
          <span className="min-w-0">
            <strong className="block truncate text-base text-[#004a99]">Portal MINSA</strong>
            <span className="hidden text-[11px] text-slate-500 sm:block">Centro Nacional de Situação</span>
          </span>
        </button>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {items.map((item) => {
            const active = currentView === item.id;
            return <button key={item.id} onClick={() => onSetView(item.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? 'bg-[#004a99] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-[#004a99]'}`}>
              {item.label}
            </button>;
          })}
        </nav>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 xl:flex">
          <span className="max-w-36 truncate text-xs font-semibold text-slate-600">{userSession?.name}</span>
        </div>

        <button onClick={() => setOpen(!open)} className="ml-auto rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden" aria-label="Abrir navegação">
          <Menu className="h-5 w-5" />
        </button>
        <button onClick={() => void onLogout()} className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-700" title="Terminar sessão">
          <LogOut className="h-4 w-4" />
        </button>

        {open && <div className="absolute left-4 right-4 top-[68px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl lg:hidden">
          {items.map((item) => {
            return <button key={item.id} onClick={() => { onSetView(item.id); setOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${currentView === item.id ? 'bg-[#004a99]/10 text-[#004a99]' : 'text-slate-700'}`}>
              {item.label}
            </button>;
          })}
        </div>}
      </div>
    </header>
  );
}
