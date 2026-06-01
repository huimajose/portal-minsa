/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, KeyRound, HelpCircle, Layers } from 'lucide-react';
import { login } from '../lib/auth';
import { UserSession } from '../types';

interface LoginProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const session = await login(username, password);
      onLoginSuccess(session);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Falha ao autenticar com o servico.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001730] text-slate-200 antialiased font-sans flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#004a99]/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#14b8a6]/10 blur-[140px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-2xl shadow-xl justify-center items-center backdrop-blur-md">
            <Layers className="w-10 h-10 text-sky-400" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-sky-400 tracking-widest uppercase font-mono block">
              Republica de Angola
            </span>
            <h2 className="mt-1 text-2xl font-black text-white tracking-tight">
              Portal do Sistema Central MINSA
            </h2>
            <p className="mt-1 text-xs text-slate-400 font-medium">
              Acesso Restrito ao Gabinete de Tecnologia e DNSP
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/10">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <span className="text-sm font-bold text-slate-100">Autenticacao de acesso via backend</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 font-medium leading-relaxed animate-fade-in mb-2">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nome de Utilizador / Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: geraldo.admin"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Palavra-passe / Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-[#004a99] hover:bg-[#003b80] active:bg-[#002f66] border border-white/10 text-white rounded-xl py-2.5 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>A autenticar sessao segura...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              Sessao protegida por cookie HttpOnly
            </span>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300 leading-relaxed">
              O portal deixou de expor perfis de demonstracao e palavras-passe na interface.
              Use credenciais emitidas pelo ambiente autenticado ou configuradas no backend de desenvolvimento.
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 leading-normal font-mono">
          Aviso: o acesso nao autorizado a este sistema e punivel nos termos da lei, sendo todas as sessoes monitorizadas sob auditoria regulamentar.
        </p>
      </div>
    </div>
  );
}
