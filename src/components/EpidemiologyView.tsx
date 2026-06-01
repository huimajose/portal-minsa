/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Users,
  Info,
  MapPin,
  PlusCircle,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { DiseaseMetric, EpidemiologicalAlert, UserRole } from '../types';
import { downloadCSV, downloadXLSX, downloadPDF } from '../lib/exportUtils';

interface EpidemiologyViewProps {
  diseaseMetrics: DiseaseMetric[];
  alerts: EpidemiologicalAlert[];
  selectedProvince: string;
  onSelectProvince: (p: string) => void;
  userRole: UserRole;
  onAddAlert: (alert: Omit<EpidemiologicalAlert, 'id' | 'date'>) => Promise<void>;
}

export default function EpidemiologyView({
  diseaseMetrics,
  alerts,
  selectedProvince,
  onSelectProvince,
  userRole,
  onAddAlert
}: EpidemiologyViewProps) {
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState('All');
  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false);
  const [newAlertDisease, setNewAlertDisease] = useState('Malaria');
  const [newAlertProvince, setNewAlertProvince] = useState('Luanda');
  const [newAlertLevel, setNewAlertLevel] = useState<'Normal' | 'Atenção' | 'Crítico'>('Atenção');
  const [newAlertCount, setNewAlertCount] = useState(150);
  const [newAlertGrowth, setNewAlertGrowth] = useState(15);
  const [newAlertDesc, setNewAlertDesc] = useState('');
  const [successAnimation, setSuccessAnimation] = useState(false);

  const displayDiseases = diseaseMetrics.filter(
    (d) => selectedDiseaseFilter === 'All' || d.name === selectedDiseaseFilter
  );

  const getAlertBadge = (level: 'Normal' | 'Atenção' | 'Crítico') => {
    switch (level) {
      case 'Crítico':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-800 bg-red-500/15 border border-red-500/20 rounded-full animate-pulse-subtle">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            Crítico
          </span>
        );
      case 'Atenção':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-500/15 border border-amber-500/20 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            Atenção
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-500/15 border border-emerald-500/20 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Normal
          </span>
        );
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertDesc) return;

    await onAddAlert({
      disease: newAlertDisease,
      province: newAlertProvince,
      alertLevel: newAlertLevel,
      casesCount: Number(newAlertCount),
      growthRate: Number(newAlertGrowth),
      description: newAlertDesc
    });

    setNewAlertDesc('');
    setIsNewAlertOpen(false);
    setSuccessAnimation(true);
    setTimeout(() => {
      setSuccessAnimation(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Surtos Ativos (Crítico)</span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {alerts.filter((a) => a.alertLevel === 'Crítico').length}
            </span>
          </div>
          <div className="p-3 bg-red-500/15 text-red-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6 animate-pulse-subtle" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Doenças em Monitorização</span>
            <span className="text-2xl font-bold font-mono text-slate-900">{diseaseMetrics.length}</span>
          </div>
          <div className="p-3 bg-indigo-500/15 text-indigo-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Unidade de Coordenação</span>
            <span className="text-xs font-bold text-[#004a99] block font-mono">INSP - Luanda</span>
          </div>
          <div className="p-3 bg-[#004a99]/15 text-[#004a99] rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {successAnimation && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in shadow-sm">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse-subtle"></div>
          <span>Novo alerta epidemiológico registado com sucesso nas tabelas de controlo. O banco central foi atualizado em tempo real.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="glass-panel rounded-2xl shadow-sm overflow-hidden lg:col-span-7">
          <div className="p-5 border-b border-white/20 bg-white/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-850 text-sm">Painel de Vigilância de Patologias</h3>
              <p className="text-xs text-slate-500 font-medium">Taxas globais ajustadas por província em tempo real</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {displayDiseases.length > 0 && (
                <div className="flex items-center gap-0.5 bg-white/45 p-1 rounded-xl border border-white/30 text-xs shadow-3xs">
                  <span className="text-[10px] text-slate-500 font-bold px-1.5 uppercase font-mono">Exportar:</span>
                  <button
                    onClick={() => {
                      const headers = ['Patologia', 'Casos Confirmados', 'Recuperados', 'Obitos', 'Evolucao', 'Status Alerta'];
                      const rows = displayDiseases.map((d) => [d.name, d.cases, d.recovered, d.deaths, d.trend, d.alertLevel]);
                      downloadPDF(
                        'Painel de Vigilancia de Patologias SIVE-MINSA',
                        `Filtro Doencas: ${selectedDiseaseFilter === 'All' ? 'Todas' : selectedDiseaseFilter}`,
                        headers,
                        rows,
                        'MINSA_SIVE_Vigilancia_Patologias'
                      );
                    }}
                    className="px-2 py-1 hover:bg-red-105 text-red-700 font-extrabold rounded-lg text-[9px] uppercase transition-all flex items-center gap-0.5 cursor-pointer border border-red-200/20"
                    title="Exportar PDF/Relatório"
                  >
                    <FileText className="w-3 h-3 text-red-650" />
                    PDF
                  </button>
                  <button
                    onClick={() => {
                      const headers = ['ID', 'Patologia', 'Casos Confirmados', 'Recuperados', 'Obitos', 'Evolucao', 'Status Alerta'];
                      const rows = displayDiseases.map((d) => [d.id, d.name, d.cases, d.recovered, d.deaths, d.trend, d.alertLevel]);
                      downloadXLSX(headers, rows, 'MINSA_Vigilancia_Patologias', 'Patologias_Vigiladas');
                    }}
                    className="px-2 py-1 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg text-[9px] uppercase transition-all flex items-center gap-0.5 cursor-pointer border border-emerald-200/20"
                    title="Exportar Excel"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-650" />
                    XLS
                  </button>
                  <button
                    onClick={() => {
                      const headers = ['Patologia', 'Casos Confirmados', 'Recuperados', 'Obitos', 'Evolucao', 'Status Alerta'];
                      const rows = displayDiseases.map((d) => [d.name, d.cases, d.recovered, d.deaths, d.trend, d.alertLevel]);
                      downloadCSV(headers, rows, 'MINSA_SIVE_Vigilancia_Patologias');
                    }}
                    className="px-2 py-1 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-[9px] uppercase transition-all flex items-center gap-0.5 cursor-pointer border border-slate-200/20"
                    title="Exportar CSV"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    CSV
                  </button>
                </div>
              )}

              <select
                value={selectedDiseaseFilter}
                onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
                className="bg-white/50 border border-white/30 text-xs rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004a99] focus:bg-white/70 transition-all font-mono"
              >
                <option value="All">Todas Doenças</option>
                {diseaseMetrics.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="py-3 px-5">Patologia</th>
                  <th className="py-3 px-5 text-right">Casos Registados</th>
                  <th className="py-3 px-5 text-right">Recuperados</th>
                  <th className="py-3 px-5 text-right">Obitos</th>
                  <th className="py-3 px-5">Evolucao</th>
                  <th className="py-3 px-5 text-right">Severidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {displayDiseases.map((d) => {
                  const isUp = d.trend === 'Crescente';
                  const trendColor =
                    isUp ? 'text-red-700' : d.trend === 'Decrescente' ? 'text-emerald-700' : 'text-slate-500';

                  return (
                    <tr key={d.id} className="hover:bg-white/45 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{d.name}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-800 font-semibold">{d.cases.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-emerald-700 font-bold">{d.recovered.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-red-700 font-bold">{d.deaths.toLocaleString()}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-0.5 font-bold ${trendColor}`}>
                          {isUp ? (
                            <TrendingUp className="w-3.5 h-3.5 text-red-650" />
                          ) : d.trend === 'Decrescente' ? (
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-650" />
                          ) : null}
                          {d.trend}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">{getAlertBadge(d.alertLevel)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Feed de Alertas e Surtos Ativos</h3>
                <p className="text-xs text-slate-500 font-medium">Alertas territoriais transmitidos pelos gabinetes provinciais</p>
              </div>

              {userRole !== 'VISUALIZADOR' && (
                <button
                  onClick={() => setIsNewAlertOpen(!isNewAlertOpen)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 text-[11px] font-bold rounded-xl flex items-center gap-1 leading-normal transition-all shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#004a99]" />
                  Emitir Alerta
                </button>
              )}
            </div>

            {isNewAlertOpen && (
              <form
                onSubmit={handleCreateAlert}
                className="bg-white/40 border border-white/20 rounded-xl p-4 mb-4 space-y-3 animate-fade-in text-xs max-h-[350px] overflow-y-auto"
              >
                <h4 className="font-bold text-slate-800">Novo Registro Epidemiológico</h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Patologia</label>
                    <select
                      value={newAlertDisease}
                      onChange={(e) => setNewAlertDisease(e.target.value)}
                      className="w-full bg-white/60 border border-white/30 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-[#004a99]"
                    >
                      {diseaseMetrics.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Província</label>
                    <select
                      value={newAlertProvince}
                      onChange={(e) => setNewAlertProvince(e.target.value)}
                      className="w-full bg-white/60 border border-white/30 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-[#004a99]"
                    >
                      <option value="Luanda">Luanda</option>
                      <option value="Huambo">Huambo</option>
                      <option value="Benguela">Benguela</option>
                      <option value="Uige">Uige</option>
                      <option value="Cabinda">Cabinda</option>
                      <option value="Zaire">Zaire</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Alert Level</label>
                    <select
                      value={newAlertLevel}
                      onChange={(e) => setNewAlertLevel(e.target.value as 'Normal' | 'Atenção' | 'Crítico')}
                      className="w-full bg-white/60 border border-white/30 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-[#004a99]"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Atenção">Atenção</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Nº Casos</label>
                    <input
                      type="number"
                      value={newAlertCount}
                      onChange={(e) => setNewAlertCount(Number(e.target.value))}
                      className="w-full bg-white/60 border border-white/30 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-[#004a99]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Crescimento (%)</label>
                    <input
                      type="number"
                      value={newAlertGrowth}
                      onChange={(e) => setNewAlertGrowth(Number(e.target.value))}
                      className="w-full bg-white/60 border border-white/30 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-[#004a99]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Descrição Técnica</label>
                  <textarea
                    value={newAlertDesc}
                    onChange={(e) => setNewAlertDesc(e.target.value)}
                    placeholder="Ex: Focos endemicos detetados em Cacuaco devido a fontes de agua contaminadas."
                    className="w-full h-16 bg-white/65 border border-white/30 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#004a99]"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsNewAlertOpen(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-800 hover:bg-slate-350 font-bold rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-3 py-1.5 bg-[#004a99] hover:bg-[#003b80] text-white font-bold rounded-lg transition-all">
                    Registar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white/20 rounded-xl border border-white/10">
                  <Info className="w-10 h-10 mx-auto mb-2.5 text-slate-300 animate-pulse-subtle" />
                  <p className="text-xs font-bold">Sem alertas ativos para esta seleção</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 bg-white/40 border border-white/15 rounded-xl space-y-2 hover:border-[#004a99]/35 hover:bg-white/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-extrabold text-slate-900 tracking-tight block">Surtos de {alert.disease}</span>
                        <button
                          onClick={() => onSelectProvince(alert.province)}
                          className="text-[10px] text-[#004a99] font-bold hover:underline flex items-center gap-0.5"
                        >
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {alert.province}
                        </button>
                      </div>
                      <div className="shrink-0">{getAlertBadge(alert.alertLevel)}</div>
                    </div>

                    <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">{alert.description}</p>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#004a99]" />
                        {alert.casesCount} casos (+{alert.growthRate}%)
                      </span>
                      <span>{alert.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-500/10 text-slate-700 rounded-xl border border-red-500/20 leading-relaxed text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Aviso Geral do Gabinete Epidemiológico</span>
              Em caso de alteração no rácio epidemiológico local, o gestor de cada província deve registar imediatamente a notificação.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
