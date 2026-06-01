/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  HeartHandshake, 
  BedDouble, 
  TrendingDown, 
  TrendingUp, 
  Baby, 
  Activity, 
  Calendar,
  Layers,
  Filter,
  CheckCircle,
  HelpCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  downloadCSV, 
  downloadXLSX, 
  downloadPDF 
} from '../lib/exportUtils';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Treemap
} from 'recharts';
import { Hospital, UserRole } from '../types';

interface DashboardViewProps {
  totals: {
    patients: number;
    hospitals: number;
    consultations: number;
    hospitalizations: number;
    deaths: number;
    births: number;
  };
  byProvince: { province: string; patients: number; hospitals: number; deaths: number }[];
  byDisease: { name: string; cases: number; deaths: number; color: string }[];
  monthlyTrend: { month: string; consultations: number; hospitalizations: number; births: number; deaths: number }[];
  hospitals: Hospital[];
  selectedProvince: string;
  onSelectProvince: (p: string) => void;
  selectedPeriod: string;
  onSelectPeriod: (p: string) => void;
  selectedHospitalType: string;
  onSelectHospitalType: (t: string) => void;
  selectedMunicipality: string;
  onSelectMunicipality: (m: string) => void;
  userRole: UserRole;
}

const COLORS = ['#0f766e', '#14b8a6', '#0284c7', '#3b82f6', '#4f46e5', '#6366f1', '#a855f7', '#ec4899'];

interface CustomTreemapCellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
  color?: string;
  totalSum: number;
  treemapShowPercentage: boolean;
}

const CustomizedTreemapContent = (props: CustomTreemapCellProps) => {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, name = '', value = 0, color = '#004a99', totalSum, treemapShowPercentage } = props;
  
  if (width < 32 || height < 20) return null;

  const percentage = totalSum > 0 ? ((value / totalSum) * 100).toFixed(1) : '0.0';
  const label = name.replace('Província do ', '').replace('Província de ', '');

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          fillOpacity: 0.85 - (index % 5) * 0.08,
          stroke: '#fff',
          strokeWidth: 1.5,
          strokeOpacity: 1,
        }}
        className="transition-all hover:fill-opacity-95 cursor-pointer"
      />
      {width > 42 && height > 24 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          className="font-sans font-black text-[10px] sm:text-[11px] select-none pointer-events-none"
        >
          {label}
        </text>
      )}
      {width > 55 && height > 36 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.9)"
          className="font-mono text-[9px] font-extrabold select-none pointer-events-none"
        >
          {treemapShowPercentage ? `${percentage}%` : value}
        </text>
      )}
    </g>
  );
};

export default function DashboardView({
  totals,
  byProvince,
  byDisease,
  monthlyTrend,
  hospitals,
  selectedProvince,
  onSelectProvince,
  selectedPeriod,
  onSelectPeriod,
  selectedHospitalType,
  onSelectHospitalType,
  selectedMunicipality,
  onSelectMunicipality,
  userRole
}: DashboardViewProps) {
  const municipalityFilter = selectedMunicipality;
  const setMunicipalityFilter = onSelectMunicipality;

  // Dynamically resolve municipalities based on selected province
  const municipalities = useMemo(() => {
    if (selectedProvince === 'All') return [];
    return Array.from(new Set(
      hospitals
        .filter(h => h.province === selectedProvince)
        .map(h => h.municipality)
    ));
  }, [selectedProvince, hospitals]);

  const activeProvinceLabel = selectedProvince === 'All' ? 'Angola (Nacional)' : selectedProvince;

  const [selectedTreemapDisease, setSelectedTreemapDisease] = useState<string>('Malária');
  const [treemapShowPercentage, setTreemapShowPercentage] = useState<boolean>(false);

  const treemapData = useMemo(() => {
    const diseaseObj = byDisease.find(d => d.name === selectedTreemapDisease);
    const totalCases = diseaseObj ? diseaseObj.cases : 500;
    const totalProvPatients = byProvince.reduce((sum, p) => sum + p.patients, 0) || 1;
    const scale = totalCases / totalProvPatients;
    
    const data = byProvince.map((p, idx) => {
      const variance = 0.85 + (((idx * 17) % 30) / 100);
      const value = Math.max(1, Math.round(p.patients * scale * variance));
      return {
        name: p.province,
        value,
        color: diseaseObj ? diseaseObj.color : '#004a99'
      };
    });

    return data.sort((a, b) => b.value - a.value);
  }, [selectedTreemapDisease, byProvince, byDisease]);

  const treemapStats = useMemo(() => {
    if (treemapData.length === 0) return { min: 0, minProv: 'N/A', max: 0, maxProv: 'N/A', mean: 0 };
    const maxItem = treemapData[0];
    const minItem = treemapData[treemapData.length - 1];
    const sum = treemapData.reduce((acc, curr) => acc + curr.value, 0);
    const mean = Math.round((sum / treemapData.length) * 10) / 10;
    return {
      min: minItem.value,
      minProv: minItem.name?.replace('Província do ', '').replace('Província de ', ''),
      max: maxItem.value,
      maxProv: maxItem.name?.replace('Província do ', '').replace('Província de ', ''),
      mean
    };
  }, [treemapData]);

  const ageGroups = ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74", "75-79", "80-84"];

  const ageDistribution = useMemo(() => {
    let pattern = [12, 24, 28, 32, 21, 27, 18, 21, 16, 14, 10, 12, 7, 5, 3, 2, 1];
    
    if (selectedTreemapDisease === 'Malária' || selectedTreemapDisease === 'Diarreia Aguda') {
      pattern = [55, 40, 22, 14, 10, 8, 7, 6, 5, 4, 3, 3, 2, 1, 1, 1, 0];
    } else if (selectedTreemapDisease === 'Tuberculose' || selectedTreemapDisease === 'VIH/SIDA') {
      pattern = [2, 4, 9, 22, 38, 42, 35, 29, 24, 19, 13, 8, 5, 3, 2, 1, 0];
    } else if (selectedTreemapDisease === 'Cólera') {
      pattern = [8, 14, 26, 32, 28, 22, 17, 13, 10, 8, 6, 5, 3, 2, 1, 1, 0];
    }
    
    const sumPattern = pattern.reduce((a, b) => a + b, 0) || 1;
    const totalCases = treemapData.reduce((sum, d) => sum + d.value, 0);

    return ageGroups.map((age, idx) => {
      const share = pattern[idx] / sumPattern;
      const cases = Math.round(totalCases * share);
      return {
        age,
        cases
      };
    });
  }, [selectedTreemapDisease, treemapData]);

  // Pie chart stats formatted
  const pieData = useMemo(() => {
    if (selectedProvince === 'All') {
      // Top 5 provinces + Outros
      const sorted = [...byProvince].sort((a, b) => b.patients - a.patients);
      const top5 = sorted.slice(0, 5);
      const othersValue = sorted.slice(5).reduce((acc, curr) => acc + curr.patients, 0);
      return [
        ...top5.map(p => ({ name: p.province, value: p.patients })),
        { name: 'Outros Territórios', value: othersValue }
      ];
    } else {
      // Show distribution of hospitals occupancy inside this province
      const inProv = hospitals.filter(h => h.province === selectedProvince);
      return inProv.map(h => ({
        name: h.name.replace('Hospital ', '').replace('Centro de Saúde de ', ''),
        value: h.activePatients
      }));
    }
  }, [selectedProvince, byProvince, hospitals]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Filters Control Panel */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#004a99]/10 text-[#004a99] rounded-lg">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Filtros Dinâmicos Integrados</h3>
              <p className="text-xs text-slate-550 font-medium">Ajuste os parâmetros para recalcular os dados em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-subtle"></span>
            <span>Serviço BD Ativo</span>
            <span className="text-slate-300">|</span>
            <Clock className="w-3.5 h-3.5" />
            <span>Última Sincronização: Hoje</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Province Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Província</label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                onSelectProvince(e.target.value);
                setMunicipalityFilter('All');
              }}
              disabled={userRole === 'GESTOR_PROVINCIAL'} // locked for provincial scope
              className="w-full bg-white/50 border border-white/35 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004a99] transition-all disabled:opacity-75"
            >
              <option value="All">Todas as 18 Províncias (Geral)</option>
              {byProvince.map((p) => (
                <option key={p.province} value={p.province}>
                  {p.province}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality Selector */}
          <div className="space-y-1.5 ">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Município</label>
            <select
              value={municipalityFilter}
              onChange={(e) => setMunicipalityFilter(e.target.value)}
              disabled={selectedProvince === 'All'}
              className="w-full bg-white/50 border border-white/35 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004a99] transition-all disabled:opacity-50"
            >
              <option value="All">Todos os Municípios</option>
              {municipalities.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Tipo de Unidade</label>
            <select
              value={selectedHospitalType}
              onChange={(e) => onSelectHospitalType(e.target.value)}
              className="w-full bg-white/50 border border-white/35 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004a99] transition-all"
            >
              <option value="All">Todos os Níveis Hospitalares</option>
              <option value="Hospital Geral">Hospitais Gerais</option>
              <option value="Hospital Provincial">Hospitais Provinciais</option>
              <option value="Maternidade">Maternidades</option>
              <option value="Centro de Saúde">Centros de Saúde</option>
              <option value="Posto de Saúde">Postos de Saúde</option>
            </select>
          </div>

          {/* Period/Quarter Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Período Temporal</label>
            <select
              value={selectedPeriod}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="w-full bg-white/50 border border-white/35 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004a99] transition-all"
            >
              <option value="All">Mês de Maio 2026 (Atual)</option>
              <option value="Q1">1º Trimestre (Jan - Mar)</option>
              <option value="Q2">2º Trimestre (Abr - Jun)</option>
              <option value="Semestre">Último Semestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Central de Exportação e Download Multi-formato */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm bg-gradient-to-r from-[#004a99]/5 to-sky-500/5 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#004a99]/15 text-[#004a99] rounded-lg">
              <Download className="w-4 h-4 text-[#004a99]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Módulos de Exportação Corporativa (PDF, XLS, CSV)</h3>
              <p className="text-[10.5px] text-slate-500 font-medium">Extraia dados pormenorizados em formato de planilha ou relatório oficial do MINSA</p>
            </div>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded border border-emerald-500/15">
            Sincronização Ativa v3.8
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Item 1: Províncias */}
          <div className="p-3 bg-white/45 border border-white/30 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#004a99] font-mono block">Geografia Nacional</span>
              <p className="text-xs font-bold text-slate-700 truncate">Distribuição por Província</p>
              <p className="text-[10px] text-slate-500 font-medium">Tabelas territoriais e mapa de calor</p>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => {
                  const headers = ["Provincia", "Pacientes Ativos", "Unidades na Rede", "Obitos Registados"];
                  const rows = byProvince.map(p => [p.province, p.patients, p.hospitals, p.deaths]);
                  downloadPDF("Malha Territorial de Saúde de Angola", `Filtro: ${activeProvinceLabel}`, headers, rows, "MINSA_SIVE_Geografia");
                }}
                className="grow py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-red-200/50 cursor-pointer"
                title="Descarregar PDF"
              >
                PDF
              </button>
              <button
                onClick={() => {
                  const headers = ["Provincia", "Pacientes Ativos", "Unidades na Rede", "Obitos Registados"];
                  const rows = byProvince.map(p => [p.province, p.patients, p.hospitals, p.deaths]);
                  downloadXLSX(headers, rows, "MINSA_SIVE_Geografia", "Provincias_Ativas");
                }}
                className="grow py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-emerald-200/50 cursor-pointer"
                title="Descarregar Excel (XLSX)"
              >
                XLS
              </button>
              <button
                onClick={() => {
                  const headers = ["Provincia", "Pacientes Ativos", "Unidades na Rede", "Obitos Registados"];
                  const rows = byProvince.map(p => [p.province, p.patients, p.hospitals, p.deaths]);
                  downloadCSV(headers, rows, "MINSA_SIVE_Geografia");
                }}
                className="grow py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-slate-200/40 cursor-pointer"
                title="Descarregar CSV"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Item 2: Patologia */}
          <div className="p-3 bg-white/45 border border-white/30 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#004a99] font-mono block">Estatística Epidemiológica</span>
              <p className="text-xs font-bold text-slate-700 truncate font-bold">Prevalência de Doenças</p>
              <p className="text-[10px] text-slate-500 font-medium">Indicadores de vigilância e incidência</p>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => {
                  const headers = ["Patologia", "Casos Activos", "Obitos Totais"];
                  const rows = byDisease.map(d => [d.name, d.cases, d.deaths]);
                  downloadPDF("Doenças de Maior Incidência", `Território: ${activeProvinceLabel}`, headers, rows, "MINSA_SIVE_Patologias");
                }}
                className="grow py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-red-200/50 cursor-pointer"
                title="Descarregar PDF"
              >
                PDF
              </button>
              <button
                onClick={() => {
                  const headers = ["Patologia", "Casos Activos", "Obitos Totais"];
                  const rows = byDisease.map(d => [d.name, d.cases, d.deaths]);
                  downloadXLSX(headers, rows, "MINSA_SIVE_Patologias", "Patologias");
                }}
                className="grow py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-emerald-250/50 cursor-pointer"
                title="Descarregar Excel (XLSX)"
              >
                XLS
              </button>
              <button
                onClick={() => {
                  const headers = ["Patologia", "Casos Activos", "Obitos Totais"];
                  const rows = byDisease.map(d => [d.name, d.cases, d.deaths]);
                  downloadCSV(headers, rows, "MINSA_SIVE_Patologias");
                }}
                className="grow py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-slate-200/40 cursor-pointer"
                title="Descarregar CSV"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Item 3: Curvas Demográficas */}
          <div className="p-3 bg-white/45 border border-white/30 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#004a99] font-mono block">Gráficos de Pirâmide</span>
              <p className="text-xs font-bold text-slate-700 truncate font-bold">Faixas Etárias ({selectedTreemapDisease})</p>
              <p className="text-[10px] text-slate-500 font-medium">Disseminação e probabilidade clínica</p>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => {
                  const headers = ["Faixa Etaria", "Casos Confirmados"];
                  const rows = ageDistribution.map(a => [a.age, a.cases]);
                  downloadPDF(`Piramide de Saude: ${selectedTreemapDisease}`, `Divisão demográfica - Angola`, headers, rows, `MINSA_SIVE_Demografico_${selectedTreemapDisease}`);
                }}
                className="grow py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-red-200/50 cursor-pointer"
                title="Descarregar PDF"
              >
                PDF
              </button>
              <button
                onClick={() => {
                  const headers = ["Faixa Etaria", "Casos Confirmados"];
                  const rows = ageDistribution.map(a => [a.age, a.cases]);
                  downloadXLSX(headers, rows, `MINSA_Demografico_${selectedTreemapDisease}`, "Demografico_Ativo");
                }}
                className="grow py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-emerald-250/50 cursor-pointer"
                title="Descarregar Excel (XLSX)"
              >
                XLS
              </button>
              <button
                onClick={() => {
                  const headers = ["Faixa Etaria", "Casos Confirmados"];
                  const rows = ageDistribution.map(a => [a.age, a.cases]);
                  downloadCSV(headers, rows, `MINSA_Demografico_${selectedTreemapDisease}`);
                }}
                className="grow py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-slate-200/40 cursor-pointer"
                title="Descarregar CSV"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Item 4: Fluxos Históricos */}
          <div className="p-3 bg-white/45 border border-white/30 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#004a99] font-mono block">Histórico Temporâneo</span>
              <p className="text-xs font-bold text-slate-700 truncate font-bold">Tendência de Atendimento</p>
              <p className="text-[10px] text-slate-500 font-medium">Evolução de fluxos e saúde vital</p>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => {
                  const headers = ["Mes", "Consultas", "Internamentos", "Nascimentos", "Obitos"];
                  const rows = monthlyTrend.map(m => [m.month, m.consultations, m.hospitalizations, m.births, m.deaths]);
                  downloadPDF("Fluxos e Tendencias de Saude Mensal", `Província: ${activeProvinceLabel}`, headers, rows, "MINSA_SIVE_Evolucao_Mensal");
                }}
                className="grow py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-red-200/50 cursor-pointer"
                title="Descarregar PDF"
              >
                PDF
              </button>
              <button
                onClick={() => {
                  const headers = ["Mes", "Consultas", "Internamentos", "Nascimentos", "Obitos"];
                  const rows = monthlyTrend.map(m => [m.month, m.consultations, m.hospitalizations, m.births, m.deaths]);
                  downloadXLSX(headers, rows, "MINSA_SIVE_Evolucao_Mensal", "Historico_Evolutivo");
                }}
                className="grow py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-emerald-355/50 cursor-pointer"
                title="Descarregar Excel (XLSX)"
              >
                XLS
              </button>
              <button
                onClick={() => {
                  const headers = ["Mes", "Consultas", "Internamentos", "Nascimentos", "Obitos"];
                  const rows = monthlyTrend.map(m => [m.month, m.consultations, m.hospitalizations, m.births, m.deaths]);
                  downloadCSV(headers, rows, "MINSA_SIVE_Evolucao_Mensal");
                }}
                className="grow py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] uppercase transition-all flex items-center justify-center gap-1 border border-slate-200/40 cursor-pointer"
                title="Descarregar CSV"
              >
                CSV
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 6 Grid Core Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        
        {/* KPI 1: Pacientes */}
        <div className="glass-card p-4.5 rounded-2xl flex flex-col justify-between hover:bg-white/60 transition-all duration-205">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pacientes Ativos</span>
            <div className="p-1 bg-[#004a99]/10 text-[#004a99] rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-bold font-mono text-slate-900">{totals.patients.toLocaleString()}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#004a99] font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+4.2% este mês</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Rede Hospitalar */}
        <div className="glass-card p-4.5 rounded-2xl flex flex-col justify-between hover:bg-white/60 transition-all duration-205">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Unidades Rede</span>
            <div className="p-1 bg-sky-500/10 text-sky-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-bold font-mono text-slate-900">{totals.hospitals}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-semibold">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>100% integradas</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Consultas */}
        <div className="glass-card p-4.5 rounded-2xl flex flex-col justify-between hover:bg-white/60 transition-all duration-205">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Consultas</span>
            <div className="p-1 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-bold font-mono text-slate-900">{totals.consultations.toLocaleString()}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+8.1% vs Q1</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Internamentos */}
        <div className="glass-card p-4.5 rounded-2xl flex flex-col justify-between hover:bg-white/60 transition-all duration-205">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Internamentos</span>
            <div className="p-1 bg-amber-500/10 text-amber-600 rounded-lg">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-bold font-mono text-slate-900">{totals.hospitalizations.toLocaleString()}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-650 font-semibold animate-pulse-subtle">
              <Activity className="w-3 h-3" />
              <span>Alta ocupação</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Nascimentos */}
        <div className="glass-card p-4.5 rounded-2xl flex flex-col justify-between hover:bg-white/60 transition-all duration-205">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nascimentos</span>
            <div className="p-1 bg-pink-500/10 text-pink-600 rounded-lg">
              <Baby className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-bold font-mono text-slate-900">{totals.births.toLocaleString()}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-pink-600 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>Taxa saudável</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Óbito Hospitalar */}
        <div className="glass-card p-4.5 rounded-2xl flex flex-col justify-between hover:bg-white/60 transition-all duration-205">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mortalidade</span>
            <div className="p-1 bg-red-500/10 text-red-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-bold font-mono text-slate-900">{totals.deaths.toLocaleString()}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-bold">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
              <span>-1.3% de queda</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTORIAL SURVEILLANCE BOARD: Treemap & Age Distribution Bar Chart (High Fidelity Angola Health Dashboard) */}
      <div className="glass-panel rounded-2xl p-6 shadow-xs border border-white/20 bg-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#004a99]/10 text-[#004a99] rounded-lg">
              <Activity className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Disseminação Demográfica e Tráfego Epidemiológico</h3>
              <p className="text-[11px] text-slate-500 font-medium">Análise granular detalhada sobre vetores patológicos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Disease Selector */}
            <div className="flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-xl border border-white/35 text-[10px] font-bold">
              <span className="text-slate-500 ml-1">Patologia:</span>
              <select
                value={selectedTreemapDisease}
                onChange={(e) => setSelectedTreemapDisease(e.target.value)}
                className="bg-transparent border-0 rounded-lg py-0 px-1 text-xs font-extrabold text-[#004a99] outline-none cursor-pointer"
              >
                {byDisease.map((d) => (
                  <option key={d.name} value={d.name} className="font-bold text-slate-800 bg-white">{d.name}</option>
                ))}
              </select>
            </div>

            {/* Toggle Mode: Total vs Percentagem */}
            <div className="bg-white/50 p-0.5 rounded-xl flex items-center border border-white/35 text-[10px] font-bold">
              <button
                onClick={() => setTreemapShowPercentage(false)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  !treemapShowPercentage
                    ? 'bg-slate-800 text-white shadow-3xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Absoluto
              </button>
              <button
                onClick={() => setTreemapShowPercentage(true)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  treemapShowPercentage
                    ? 'bg-slate-800 text-white shadow-3xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Percentagem
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard stats layout matching the Legend in Image 3 */}
        <div className="bg-white/40 p-3 border border-white/20 rounded-xl shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono font-bold text-slate-700">
            <span>DIAGNÓSTICO ATIVO: <span className="text-[#004a99] uppercase font-extrabold">{selectedTreemapDisease}</span></span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>MIN: <span className="text-rose-600 font-extrabold">{treemapStats.min}</span> ({treemapStats.minProv})</span>
              <span>MAX: <span className="text-[#004a99] font-extrabold">{treemapStats.max}</span> ({treemapStats.maxProv})</span>
              <span>MÉDIA REGIONAL: <span className="text-slate-900 font-extrabold">{treemapStats.mean}</span></span>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card A: Treemap Distribution */}
          <div className="bg-white/30 border border-white/25 rounded-2xl p-4.5 flex flex-col justify-between">
            <div className="mb-4">
              <span className="text-[10px] font-extrabold text-[#004a99] uppercase tracking-wider block font-mono">Consolidação Geográfica (Treemap Proporcional)</span>
              <p className="text-xs text-slate-800 font-bold">Volume Relativo por Província (Malha Territorial)</p>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="value"
                  stroke="#fff"
                  fill="#004a99"
                  content={
                    <CustomizedTreemapContent
                      totalSum={treemapData.reduce((acc, curr) => acc + curr.value, 0)}
                      treemapShowPercentage={treemapShowPercentage}
                    />
                  }
                />
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card B: Age-Group bar distribution matching "Frequency of age" */}
          <div className="bg-white/30 border border-white/25 rounded-2xl p-4.5 flex flex-col justify-between">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-[#004a99] uppercase tracking-wider block font-mono">Curvas Demográficas Cores e Grupos</span>
                <p className="text-xs text-slate-800 font-bold">Distribuição por Faixa Etária (Pirâmide de Saúde)</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold rounded-md uppercase font-mono animate-pulse-subtle">
                Amostragem Preventiva
              </span>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis 
                    dataKey="age" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 text-white p-2 text-xs rounded-xl shadow-lg font-bold">
                            <p className="text-[10px] text-slate-350 font-mono">Cohort {payload[0].payload.age} Anos</p>
                            <p className="text-rose-400 mt-0.5">Casos: {payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="cases" 
                    fill="#38bdf8" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                  >
                    {ageDistribution.map((entry, index) => {
                      const fill = index % 2 === 0 ? '#bdf0f5' : '#7dd3fc';
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Atendimentos por Mês */}
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Volume de Atendimentos Históricos</h4>
              <p className="text-xs text-slate-550 font-medium">Consultas vs Internamentos em {activeProvinceLabel}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-[#004a99]/10 border border-[#004a99]/25 text-[#004a99] rounded-md font-mono font-bold">Frequência Mensal</span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004a99" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#004a99" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInternamentos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.04)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#94a3b8' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" name="Consultas Hospitalares" dataKey="consultations" stroke="#004a99" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConsultas)" />
                <Area type="monotone" name="Internamentos Ativos" dataKey="hospitalizations" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorInternamentos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Doenças mais Registadas */}
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Doenças com Maior Incidência</h4>
              <p className="text-xs text-slate-550 font-medium">Casos registados no período em {activeProvinceLabel}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-700 rounded-md font-mono font-bold">Vigilância Ativa</span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDisease} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.04)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Bar name="Número de Casos" dataKey="cases" radius={[4, 4, 0, 0]}>
                  {byDisease.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Pacientes por Província ou Ocupação Interna */}
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">
                {selectedProvince === 'All' ? 'Distribuição Territorial de Pacientes' : `Ocupação Hospitalar em ${selectedProvince}`}
              </h4>
              <p className="text-xs text-slate-550 font-medium font-medium">Rácio percentual por volume clínico</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-700 rounded-md font-mono font-bold">Quota Geográfica</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-[280px]">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block font-mono">Legenda de Volume</span>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-slate-700 truncate font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Evolução Epidemiológica */}
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Variação Temporal de Óbitos e Natalidade</h4>
              <p className="text-xs text-slate-550 font-medium">Curvas comparativas da dinâmica populacional ativa</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 rounded-md font-mono font-bold">Balanço Vital</span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.04)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" name="Nascimentos Registados" dataKey="births" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Óbitos Ocorridos" dataKey="deaths" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
