/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useMemo, useState } from 'react';
import { Database, Info, KeyRound, MapPin, Search, Settings2, ShieldCheck, UserCheck } from 'lucide-react';
import { UserSession } from '../types';
import { SecureAction, hasPermission } from './RoleGuard';
import { getDefaultPermissionsForRole } from '../lib/permissions';

const PERMISSION_KEYS: { key: SecureAction; name: string }[] = [
  { key: 'ADMIT_PATIENT', name: 'Registar Pacientes' },
  { key: 'EMIT_ALERT', name: 'Emitir Alertas' },
  { key: 'RUN_REPORTS', name: 'Gerar Relatorios' },
  { key: 'VIEW_ALL_PROVINCES', name: 'Acesso Nacional' },
  { key: 'EXPORT_XLSX', name: 'Exportar Dados' },
  { key: 'MANAGE_USERS', name: 'Gerir Utilizadores' }
];

interface ManagedUser {
  name: string;
  username: string;
  role: UserSession['role'];
  province?: string;
  permissions?: SecureAction[];
}

interface UsersViewProps {
  userSession: UserSession | null;
  usersList: ManagedUser[];
}

export default function UsersView({ userSession, usersList }: UsersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserUsername, setSelectedUserUsername] = useState<string>(usersList[0]?.username || '');

  const filteredUsers = useMemo(() => {
    return usersList.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersList, searchQuery]);

  const activeSelectedUser = useMemo(() => {
    return usersList.find((user) => user.username === selectedUserUsername) || usersList[0];
  }, [usersList, selectedUserUsername]);

  if (!userSession || !hasPermission(userSession, 'MANAGE_USERS')) {
    return (
      <div className="glass-panel border-red-500/10 bg-red-500/5 p-6 rounded-2xl">
        <div className="flex items-start gap-3 text-sm text-slate-700">
          <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-700">Acesso administrativo necessario</h3>
            <p className="mt-1 text-slate-600">
              A gestao de utilizadores deixou de suportar alteracoes locais e passa a depender do service de autenticacao.
              Apenas perfis administrativos podem consultar este painel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel-heavy p-5 rounded-2xl shadow-sm text-xs font-semibold">
        <div className="flex items-center gap-2.5 border-b border-white/20 pb-4 mb-4">
          <div className="p-2.5 bg-[#004a99]/15 text-[#004a99] rounded-xl border border-[#004a99]/20 shrink-0">
            <Settings2 className="w-5 h-5 text-[#004a99]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Gestao de Utilizadores em modo seguro</h3>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Este painel ficou somente para consulta enquanto a escrita de utilizadores e privilegios migra para o auth-service.
            </p>
          </div>
        </div>

        <div className="p-3 bg-indigo-50 text-indigo-850 rounded-xl border border-indigo-150 flex items-start gap-2.5 leading-relaxed font-semibold text-[10.5px]">
          <Info className="w-4.5 h-4.5 text-indigo-650 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-indigo-900 block uppercase tracking-wide">Leitura apenas</span>
            <p className="text-slate-700 mt-0.5 font-medium leading-relaxed">
              Criacao, eliminacao, troca de perfil e sobreposicao local de permissoes foram removidas.
              O portal passa a refletir apenas o que o backend autentica e autoriza.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-4 text-xs font-semibold">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#004a99] uppercase tracking-wide">Directorio de Agentes ({usersList.length})</span>
              <span className="text-[9.5px] text-slate-400 font-mono">Sessao backend</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#003c80] font-semibold"
              />
            </div>

            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-0.5">
              {filteredUsers.map((user) => {
                const isSelected = activeSelectedUser?.username === user.username;
                const isSelf = userSession.username === user.username;

                return (
                  <div
                    key={user.username}
                    onClick={() => setSelectedUserUsername(user.username)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-[#004a99] bg-[#004a99]/5 font-black scale-[1.01]'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 text-left grow min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 truncate block text-[11px]">{user.name}</span>
                        {isSelf && (
                          <span className="text-[8.5px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.1 rounded border border-emerald-150 uppercase tracking-widest leading-none">
                            Tu
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium font-mono truncate block">@{user.username}</span>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.2 rounded text-slate-650 tracking-wide font-mono leading-none">
                          {user.role}
                        </span>
                        {user.province && (
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-100 leading-none flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {user.province}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase">
                      Read only
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {activeSelectedUser ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs space-y-6 text-xs text-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Editor de Painel Ativo</span>
                  <h4 className="text-[15px] font-black text-slate-900 leading-tight">
                    {activeSelectedUser.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-400 font-mono font-bold">
                    ID: @{activeSelectedUser.username}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-600">
                  O login simulado foi removido.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div>
                  <span className="font-bold text-[11px] block text-slate-850">Base de Direito Regulamentar</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[10.5px] font-black text-[#004a99] uppercase bg-[#004a99]/15 px-2 py-0.5 rounded">
                      {activeSelectedUser.role}
                    </span>
                    {activeSelectedUser.province && (
                      <span className="text-[10.5px] text-slate-500 font-semibold">
                        vinculado a <strong className="text-slate-750 font-black">{activeSelectedUser.province}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-black text-slate-500 bg-slate-200/50 px-2.5 py-0.8 rounded-md uppercase text-center sm:text-right">
                  Permissoes vindas do backend
                </span>
              </div>

              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase text-[#004a99] tracking-wider block text-left">
                  Permissoes efetivas:
                </span>

                <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden shadow-3xs">
                  {PERMISSION_KEYS.map(({ key, name }) => {
                    const effectivePermissions = activeSelectedUser.permissions ?? getDefaultPermissionsForRole(activeSelectedUser.role);
                    const isEnabled = effectivePermissions.includes(key);

                    return (
                      <div
                        key={key}
                        className={`p-3.5 flex items-start gap-4 text-left select-none ${isEnabled ? 'bg-indigo-50/10' : ''}`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            readOnly
                            className="w-4.5 h-4.5 text-[#004a99] rounded-lg border-slate-300 focus:ring-[#004a99] cursor-default"
                          />
                        </div>

                        <div className="grow space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[11px] text-slate-900 leading-none">
                              {name}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 font-bold bg-slate-100 px-1 rounded uppercase tracking-wide leading-none">
                              {key}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Origem: auth-service / sessao ativa</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Nada e persistido no browser</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-10 text-center text-xs text-slate-500 font-bold">
              Nenhum agente encontrado no directorio atual.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
