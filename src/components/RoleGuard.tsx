/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { SecureAction, hasPermission } from '../lib/permissions';

export type { SecureAction };
export { hasPermission };

interface RoleGuardProps {
  userSession?: UserSession | null;
  userRole?: UserRole;
  action: SecureAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function RoleGuard({ userSession, userRole, action, fallback, children }: RoleGuardProps) {
  const allowed = hasPermission(userSession || userRole, action);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  const displayedRole = userSession ? userSession.role : (userRole || 'VISUALIZADOR');

  return (
    <div className="glass-panel border-red-500/10 bg-red-500/5 p-4 rounded-xl flex items-start gap-2.5 animate-bounce-subtle">
      <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <div className="text-xs">
        <span className="font-bold text-red-400 block uppercase">Acesso Restrito ao Perfil</span>
        <p className="text-slate-450 leading-normal font-medium mt-0.5">
          O seu perfil ativo (<strong className="text-slate-800">{displayedRole}</strong>) nao possui privilegios de seguranca para visualizar este bloco ou realizar esta operacao.
        </p>
      </div>
    </div>
  );
}
