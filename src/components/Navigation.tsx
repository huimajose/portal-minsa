/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Building2,
  Activity,
  FileText,
  UserCheck,
  Menu,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Layers,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { UserRole, UserSession, EpidemiologicalAlert } from '../types';
import { hasPermission } from './RoleGuard';

interface NavigationProps {
  currentView: string;
  onSetView: (v: string) => void;
  userSession: UserSession | null;
  onLogout: () => void | Promise<void>;
  alerts?: EpidemiologicalAlert[];
  onSelectProvince?: (province: string) => void;
  isTopBar?: boolean;
}

export default function Navigation({
  currentView,
  onSetView,
  userSession,
  onLogout,
  alerts = [],
  onSelectProvince,
  isTopBar = false
}: NavigationProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    if (alerts.length > 0) {
      setHasUnread(true);
    }
  }, [alerts.length]);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN_MINSA':
        return 'Admin MINSA (Nacional)';
      case 'ANALISTA':
        return 'Analista Tecnico';
      case 'GESTOR_PROVINCIAL':
        return 'Gestor Provincial (Huambo)';
      default:
        return 'Visualizador Externo';
    }
  };

  const allowedMenuItems = [
    { id: 'dashboard', label: 'Painel Estatistico', icon: Home },
    { id: 'hospitals', label: 'Unidades Hospitalares', icon: Building2 },
    { id: 'epidemiology', label: 'Vigilancia Epidemiologica', icon: Activity },
    { id: 'reports', label: 'Despachos e Relatorios', icon: FileText },
    ...(userSession && hasPermission(userSession, 'MANAGE_USERS')
      ? [{ id: 'users', label: 'Gestao de Utilizadores', icon: UserCheck }]
      : [])
  ];

  const criticalAlerts = alerts.filter((a) => a.alertLevel === 'Crítico' || a.alertLevel === 'Atenção');

  const handleNotifClick = (province: string) => {
    if (onSelectProvince) {
      onSelectProvince(province);
    }
    onSetView('dashboard');
    setIsNotifOpen(false);
  };

  return isTopBar ? (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
        <div className="mx-auto max-w-full px-3 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-[#004a99] text-white rounded-lg shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-[#004a99] text-base truncate">Portal MINSA</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Republica de Angola</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 transition-all text-sm font-medium"
                  title="Menu de Navegacao"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">Menu</span>
                </button>

                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-20 animate-fade-in">
                    {allowedMenuItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSetView(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left border-b last:border-b-0 ${
                            isActive ? 'bg-[#004a99]/10 text-[#004a99]' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs">{userSession?.role.replace(/_/g, ' ')}</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsMobileMenuOpen(false);
                    if (!isNotifOpen) setHasUnread(false);
                  }}
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 transition-all text-sm font-medium"
                  title="Notificacoes de Alerta"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Alertas</span>
                  {hasUnread && criticalAlerts.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full -translate-y-1/2 translate-x-1/2">
                      {criticalAlerts.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-20 animate-fade-in text-xs">
                    <div className="p-3 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Alertas Ativos</span>
                      <span className="text-[10px] font-mono text-slate-500">{criticalAlerts.length}</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {criticalAlerts.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">Sem alertas criticos</div>
                      ) : (
                        criticalAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            onClick={() => {
                              handleNotifClick(alert.province);
                              setIsNotifOpen(false);
                            }}
                            className="p-3 hover:bg-slate-50 cursor-pointer transition-all flex gap-2"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div className="space-y-1 text-left">
                              <div className="font-bold text-slate-900">{alert.disease}</div>
                              <div className="text-slate-600">{alert.province}</div>
                              <div className="text-[9px] text-slate-500">{alert.date}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => void onLogout()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-all text-sm font-medium"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  ) : (
    <div className="space-y-4 no-print">
      <div className="bg-slate-900/75 backdrop-blur-md text-white rounded-2xl p-4.5 shadow-sm border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#004a99]/20 text-[#004a99] rounded-xl border border-white/10">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider font-mono">Controlo de perfis regulamentares</span>
              <h3 className="font-bold text-xs text-slate-200">O perfil ativo e validado pelo backend de autenticacao.</h3>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-[11px] font-semibold text-slate-300">
            A troca de perfil foi removida deste ambiente.
          </div>
        </div>

        {userSession && (
          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle"></div>
              <span>
                Sessao Ativa: <strong className="text-white font-semibold">{userSession.name}</strong>
                {userSession.province && ` • Provincia: ${userSession.province}`}
              </span>
            </div>
            <span className="font-mono text-[10px] text-sky-400 font-bold bg-[#004a99]/20 px-2 py-0.5 rounded border border-[#004a99]/30">
              {getRoleLabel(userSession.role)} (Sessao Autorizada)
            </span>
          </div>
        )}
      </div>

      <header className="glass-panel-heavy rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#004a99] text-white rounded-xl shadow-md shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-[#004a99] text-lg tracking-tight">Portal Institucional MINSA</h1>
            <p className="text-xs text-slate-600 font-medium">Republica de Angola • Ministerio da Saude</p>
          </div>
        </div>

        <div className="space-y-4 w-full">
          <nav className="grid gap-2.5">
            {allowedMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSetView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold tracking-tight transition-all text-left ${
                    isActive
                      ? 'bg-[#004a99]/10 text-[#004a99] border border-[#004a99]/20 shadow-sm'
                      : 'text-slate-700 hover:text-[#004a99] hover:bg-white/75 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isActive ? 'text-[#004a99]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setHasUnread(false);
              }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white/70 hover:bg-white text-slate-700 transition-all cursor-pointer"
              title="Notificacoes de alerta de surtos"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alertas
              </span>
              {hasUnread && criticalAlerts.length > 0 ? (
                <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {criticalAlerts.length}
                </span>
              ) : null}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-full sm:w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-20 animate-fade-in text-xs">
                <div className="p-3.5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Alertas Ativos MINSA</span>
                  <span className="text-[10px] font-mono text-slate-500 font-extrabold">{criticalAlerts.length} Notificacoes</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {criticalAlerts.length === 0 ? (
                    <div className="p-5 text-center text-slate-500 font-medium">
                      Sem surtos criticos pendentes em Angola.
                    </div>
                  ) : (
                    criticalAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => handleNotifClick(alert.province)}
                        className="p-3.5 hover:bg-slate-50/65 cursor-pointer transition-all flex gap-2.5"
                      >
                        <div className="p-1.5 rounded-lg shrink-0 h-fit bg-red-50 text-red-650 mt-0.5 border border-red-100/30">
                          <AlertTriangle className="w-4 h-4 animate-pulse-subtle" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-rose-700 uppercase text-[9px] tracking-wide bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                              {alert.alertLevel === 'Crítico' ? 'Critico' : 'Recurso'}
                            </span>
                            <span className="font-bold text-slate-850 font-mono text-[9px]">{alert.date}</span>
                          </div>
                          <span className="font-extrabold text-slate-900 block leading-tight">
                            Surto de {alert.disease} em {alert.province}
                          </span>
                          <p className="text-[10.5px] text-slate-600 line-clamp-2 leading-relaxed">
                            {alert.description}
                          </p>
                          <span className="text-[9.5px] font-semibold text-[#004a99] hover:underline flex items-center gap-0.5 mt-1">
                            Focar no Mapa e Painel <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-150 text-center bg-slate-50/25">
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="w-full text-[10px] font-bold text-[#004a99] hover:text-[#003b80]"
                  >
                    Fechar Notificacoes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
