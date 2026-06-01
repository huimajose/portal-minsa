/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Building2, 
  MapPin, 
  Bed, 
  UserCheck, 
  Activity, 
  ChevronRight, 
  ArrowLeft,
  Users,
  ShieldAlert,
  Phone,
  Mail,
  User,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  FileText
} from 'lucide-react';
import { Hospital, UserRole } from '../types';
import { downloadCSV, downloadXLSX, downloadPDF } from '../lib/exportUtils';

interface HospitalsViewProps {
  hospitals: Hospital[];
  selectedProvince: string;
  onSelectProvince: (p: string) => void;
  userRole: UserRole;
  onAddPatientToHospital: (hospitalId: string, consultationData?: { disease: string; isHospitalized: boolean; triageLevel: 'Normal' | 'Atenção' | 'Crítico' }) => void;
}

export default function HospitalsView({
  hospitals,
  selectedProvince,
  onSelectProvince,
  userRole,
  onAddPatientToHospital
}: HospitalsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [activeHospitalId, setActiveHospitalId] = useState<string | null>(null);

  // Form states for registering new clinical records
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientDisease, setPatientDisease] = useState('Malária');
  const [isHospitalizedState, setIsHospitalizedState] = useState(true);
  const [patientTriage, setPatientTriage] = useState<'Normal' | 'Atenção' | 'Crítico'>('Normal');
  const [registrySuccessMsg, setRegistrySuccessMsg] = useState('');

  // Quick simulation state for assigning temporary staff
  const [staffSuccessMsg, setStaffSuccessMsg] = useState('');

  // Find currently active hospital
  const selectedHospital = useMemo(() => {
    if (!activeHospitalId) return null;
    return hospitals.find(h => h.id === activeHospitalId) || null;
  }, [activeHospitalId, hospitals]);

  // Handle filtrations
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            h.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            h.province.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'All' || h.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [hospitals, searchTerm, selectedType]);

  const handleSimulateStaffHire = () => {
    setStaffSuccessMsg('Requisição enviada! Nova escala médica processada no serviço central.');
    setTimeout(() => setStaffSuccessMsg(''), 4000);
  };

  // Return Detail Screen mimicking /hospitals/[id]
  if (selectedHospital) {
    const isOverloaded = selectedHospital.occupancyRate >= 80;
    const alertColor = selectedHospital.status === 'Sobrecarregado' ? 'text-red-600 bg-red-50 border-red-100' : 
                       selectedHospital.status === 'Manutenção' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                       'text-emerald-600 bg-emerald-50 border-emerald-100';

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back navigation bar */}
        <button
          onClick={() => setActiveHospitalId(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-[#004a99] font-semibold text-xs glass-card border border-white/30 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#004a99]" />
          Voltar para a Rede Hospitalar
        </button>

        {/* Detail Title Header Card */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#004a99]/15 text-[#004a99] rounded-2xl shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-950">{selectedHospital.name}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${alertColor}`}>
                  {selectedHospital.status}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-700">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#004a99]" />
                  {selectedHospital.municipality}, Província do {selectedHospital.province}
                </span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="bg-[#004a99]/10 text-[#004a99] px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                  {selectedHospital.type}
                </span>
              </div>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 block text-right font-medium">Identificador de Registro</span>
            <span className="font-mono font-bold text-slate-900 text-sm block tracking-wider uppercase text-right">{selectedHospital.id}</span>
          </div>
        </div>

        {/* Statistics & Staffing details for /hospitals/[id] */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Occupancy card */}
          <div className="glass-panel rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-4">Ocupação de Camas</h3>
            </div>

            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Occupancy indicator */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="62" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="12" fill="transparent" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="62" 
                    stroke={isOverloaded ? '#ef4444' : '#004a99'} 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={389.5} 
                    strokeDashoffset={389.5 - (389.5 * selectedHospital.occupancyRate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono text-slate-900">{selectedHospital.occupancyRate}%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Ocupação</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Total de Camas Instaladas:</span>
                <span className="font-mono font-bold text-slate-900">{selectedHospital.beds}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Pacientes Atualmente Internados:</span>
                <span className="font-mono font-bold text-slate-900">{selectedHospital.activePatients}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Camas Disponíveis:</span>
                <span className="font-mono font-bold text-[#004a99]">{selectedHospital.beds - selectedHospital.activePatients}</span>
              </div>
            </div>
          </div>

          {/* Clinical Staff */}
          <div className="glass-panel rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-4">Recursos Humanos</h3>
            </div>

            <div className="space-y-4">
              {/* Doctors Ratio */}
              <div className="p-3 bg-white/40 border border-white/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#004a99]/10 text-[#004a99] rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Corpo Médico</span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Rácio: 1 Médico para {(selectedHospital.beds / selectedHospital.doctors).toFixed(1)} camas
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">{selectedHospital.doctors}</span>
                  <span className="text-[9px] uppercase font-bold text-[#004a99] bg-[#004a99]/10 px-1.5 py-0.5 rounded">Ativos</span>
                </div>
              </div>

              {/* Nurses Ratio */}
              <div className="p-3 bg-white/40 border border-white/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-500/10 text-purple-700 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enfermagem Geral</span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Rácio: 1 Enfermeiro para {(selectedHospital.beds / selectedHospital.nurses).toFixed(1)} camas
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">{selectedHospital.nurses}</span>
                  <span className="text-[9px] uppercase font-bold text-purple-700 bg-purple-500/10 px-1.5 py-0.5 rounded">Escala</span>
                </div>
              </div>

              {/* Overall Clinical Ratio safety standard */}
              <div className="text-xs p-3.5 border border-[#004a99]/20 bg-[#004a99]/5 text-slate-705 rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#004a99] shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px] font-medium">
                  Unidade operacional em conformidade com as diretivas recomendadas pelo Gabinete de Recursos Humanos do MINSA.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="glass-panel rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-4">Contacto</h3>
            </div>

            <div className="space-y-3.5 my-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <User className="w-4 h-4 text-[#004a99]" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Diretor Geral</span>
                  <span className="font-bold text-slate-900">{selectedHospital.director}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-[#004a99]" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Contacto Direto</span>
                  <span className="font-mono font-bold text-slate-900">{selectedHospital.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-[#004a99]" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono font-medium">Correio Eletrónico</span>
                  <span className="font-mono font-bold text-[#004a99]">{selectedHospital.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/20 flex flex-wrap gap-2">
              <button
                onClick={handleSimulateStaffHire}
                className="grow bg-[#004a99] hover:bg-[#003b80] text-white rounded-xl py-2 px-3 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Reforçar Escala
              </button>
            </div>
          </div>

        </div>

        {/* Administrative actions */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Operações</h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column - Spannig 2 columns */}
            <div className="lg:col-span-2 p-5 bg-white/50 border border-slate-200/50 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-[#004a99] tracking-wide uppercase">Registo Epidemiológico de Doente</span>
                <span className="text-[10px] text-slate-400 font-mono">Formulário de Entrada Directa</span>
              </div>

              {registrySuccessMsg ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-150 animate-fade-in space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[13px]">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                    Registo Centralizado Efetuado com Sucesso!
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    {registrySuccessMsg}
                  </p>
                  <button 
                    onClick={() => setRegistrySuccessMsg('')} 
                    className="mt-1 text-[11px] font-bold text-[#004a99] hover:underline cursor-pointer"
                  >
                    Registrar Outra Ocorrência
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!patientName.trim()) {
                      alert('Por favor introduza o nome do paciente.');
                      return;
                    }
                    if (patientAge === '') {
                      alert('Por favor introduza a idade do paciente.');
                      return;
                    }

                    // Call prop mutator
                    onAddPatientToHospital(selectedHospital.id, {
                      disease: patientDisease,
                      isHospitalized: isHospitalizedState,
                      triageLevel: patientTriage
                    });

                    setRegistrySuccessMsg(`Paciente "${patientName}" (${patientAge} anos) foi admitido em regime de ${isHospitalizedState ? 'Internamento' : 'Ambulatório'} com suspeita de ${patientDisease} nesta unidade. Os dados de ocupação de camas e as métricas epidemiológicas provinciais foram atualizados em tempo real.`);
                    
                    // Reset fields
                    setPatientName('');
                    setPatientAge('');
                    setPatientTriage('Normal');
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Patient Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block">Nome do Paciente ou Token MINSA:</label>
                      <input 
                        type="text"
                        placeholder="Ex: Manuel Agostinho Neto"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#004a99] focus:outline-none"
                        required
                      />
                    </div>

                    {/* Patient Age */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block">Idade (Anos):</label>
                      <input 
                        type="number"
                        placeholder="Ex: 34"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#004a99] focus:outline-none"
                        min="0"
                        max="125"
                        required
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Selected Pathology */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block">Suspeita Clínica / Patologia:</label>
                      <select
                        value={patientDisease}
                        onChange={(e) => setPatientDisease(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-[#004a99] focus:outline-none"
                      >
                        <option value="Malária">Malária</option>
                        <option value="Cólera">Cólera</option>
                        <option value="Sarampo">Sarampo</option>
                        <option value="Dengue">Dengue</option>
                        <option value="COVID-19">COVID-19</option>
                        <option value="Tuberculose">Tuberculose</option>
                        <option value="Diarreia Aguda">Diarreia Aguda</option>
                      </select>
                    </div>

                    {/* Internment status vs outpatient */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block">Regime de Atendimento:</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsHospitalizedState(true)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                            isHospitalizedState
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Internamento
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsHospitalizedState(false)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                            !isHospitalizedState
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Ambulatório
                        </button>
                      </div>
                    </div>

                    {/* Triage clinical priority */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block">Gravidade / Nível Triagem:</label>
                      <div className="flex gap-1">
                        {(['Normal', 'Atenção', 'Crítico'] as const).map((level) => {
                          const isSel = patientTriage === level;
                          const colorClass = 
                            level === 'Crítico' ? (isSel ? 'bg-rose-600 border-rose-600 text-white' : 'hover:bg-rose-50 text-rose-600 border-rose-200') :
                            level === 'Atenção' ? (isSel ? 'bg-amber-500 border-amber-500 text-white' : 'hover:bg-amber-50 text-amber-600 border-amber-200') :
                            (isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-600 border-emerald-200');

                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setPatientTriage(level)}
                              className={`grow py-1.5 rounded-lg text-[9.5px] font-black border transition-colors cursor-pointer ${colorClass}`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {userRole === 'VISUALIZADOR' ? (
                    <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-[10.5px] font-semibold border border-rose-100 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-650 shrink-0" />
                      <span>Seu perfil de convidado de Leitura não tem autorizações para submeter novos registos clínicos.</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isHospitalizedState && selectedHospital.activePatients >= selectedHospital.beds}
                      className="w-full bg-[#004a99] hover:bg-[#003b80] disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      {isHospitalizedState && selectedHospital.activePatients >= selectedHospital.beds 
                        ? 'Capacidade do Hospital Esgotada (Impossível Internar)' 
                        : 'Simular Submissão e Emitir Guia Digital Centralizada'}
                    </button>
                  )}
                </form>
              )}
            </div>

            {/* Operator Badge & Info - 1 column */}
            <div className="p-5 bg-white/40 border border-white/20 rounded-2xl flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="text-xs font-black text-slate-700 block mb-1">Perfil do Operador Activo</span>
                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 mb-3">
                  <span className="text-[10px] font-mono block text-sky-400 font-bold uppercase tracking-wider">{userRole}</span>
                  <p className="text-xs font-bold text-slate-200 leading-tight">Credenciais do Utilizador</p>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
                    Seu perfil concede autonomia de escrita para simular o preenchimento de diagnósticos em Angola.
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  A submissão do formulário atualiza imediatamente as camas e rácio no módulo hospitalar, bem como o indicador global de incidência da doença na Província de <strong>{selectedHospital.province}</strong>.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#004a99] tracking-wide uppercase px-2 py-0.5 bg-[#004a99]/15 border border-[#004a99]/20 rounded-md">
                  Vínculo Governamental
                </span>
                <span className="text-[9.5px] text-slate-400 font-bold">MINSA v3.8</span>
              </div>
            </div>

          </div>
          {staffSuccessMsg && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-100 animate-fade-in flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle"></div>
              {staffSuccessMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Hub */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative grow max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="w-4 h-4 text-[#004a99]" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome do Hospital, província ou município..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/35 rounded-xl text-xs font-semibold text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004a99] focus:bg-white/70 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-bold shrink-0">Nível Unidade:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white/50 border border-white/35 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-805 focus:outline-none focus:ring-2 focus:ring-[#004a99] focus:bg-white/70 transition-all"
          >
            <option value="All font-bold">Todos</option>
            <option value="Hospital Geral text-slate-800">Hospital Geral</option>
            <option value="Hospital Provincial text-slate-800">Hospital Provincial</option>
            <option value="Centro de Saúde text-slate-800">Centro de Saúde</option>
            <option value="Maternidade text-slate-800">Maternidade</option>
            <option value="Hospital Militar text-slate-800">Militar</option>
          </select>
        </div>
      </div>

      {/* Network List Stats Overlay */}
      <div className="glass-panel rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-white/20 bg-white/20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-850 text-sm">Unidades Registadas</h3>
            <p className="text-xs text-slate-500 font-medium">Total: {hospitals.length} | Filtradas: {filteredHospitals.length}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {filteredHospitals.length > 0 && (
              <div className="flex items-center gap-2 bg-white/45 p-2 rounded-xl border border-white/30">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Exportar:</span>
                <button
                  onClick={() => {
                    const headers = ["Hospital", "Provincia", "Municipio", "Tipo", "Camas", "Ocupacao"];
                    const rows = filteredHospitals.map(h => [h.name, h.province, h.municipality, h.type, h.beds, `${h.occupancyRate}%`]);
                    downloadPDF("MINSA_Hospitais", "", headers, rows, "Rede_Hospitalar");
                  }}
                  className="px-2.5 py-1 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[9px] uppercase transition-all border border-red-200"
                >
                  PDF
                </button>
                <button
                  onClick={() => {
                    const headers = ["Hospital", "Provincia", "Municipio", "Tipo", "Camas", "Ocupacao"];
                    const rows = filteredHospitals.map(h => [h.name, h.province, h.municipality, h.type, h.beds, `${h.occupancyRate}%`]);
                    downloadXLSX(headers, rows, "MINSA_Hospitais", "Rede");
                  }}
                  className="px-2.5 py-1 hover:bg-green-100 text-green-700 font-bold rounded-lg text-[9px] uppercase transition-all border border-green-200"
                >
                  XLS
                </button>
                <button
                  onClick={() => {
                    const headers = ["Hospital", "Provincia", "Municipio", "Tipo", "Camas", "Ocupacao"];
                    const rows = filteredHospitals.map(h => [h.name, h.province, h.municipality, h.type, h.beds, `${h.occupancyRate}%`]);
                    downloadCSV(headers, rows, "MINSA_Hospitais");
                  }}
                  className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[9px] uppercase transition-all border border-slate-200"
                >
                  CSV
                </button>
              </div>
            )}

            <span className="text-xs text-slate-500 font-mono">
              {selectedProvince === 'All' ? 'Nacional' : selectedProvince}
            </span>
          </div>
        </div>

        {filteredHospitals.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Nenhum hospital encontrado</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Tente ajustar seus termos de pesquisa ou remova os filtros ativos para ver mais resultados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="py-3 px-5">Nome do Hospital</th>
                  <th className="py-3 px-5">Região / Localização</th>
                  <th className="py-3 px-5">Capacidade</th>
                  <th className="py-3 px-5 text-center">Médicos/Enf</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Ocupação</th>
                  <th className="py-3 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {filteredHospitals.map((hospital) => {
                  const isOverloaded = hospital.occupancyRate >= 85;
                  const alertBadge = hospital.status === 'Sobrecarregado' ? 'bg-red-500/10 text-red-700 border-red-500/20' : 
                                     hospital.status === 'Manutenção' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' :
                                     'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';

                  return (
                    <tr key={hospital.id} className="hover:bg-white/45 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-white/50 rounded-lg text-[#004a99]">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{hospital.name}</span>
                            <span className="text-[10px] text-slate-500 capitalize font-medium">{hospital.type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-slate-800 font-semibold block">{hospital.municipality}</span>
                        <span className="text-[10px] text-slate-500">Província: {hospital.province}</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Bed className="w-3.5 h-3.5 text-[#004a99]" />
                          <span>{hospital.beds} Camas</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="font-mono text-slate-600 font-semibold block">{hospital.doctors} Med / {hospital.nurses} Enf</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${alertBadge}`}>
                          {hospital.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="w-full max-w-[100px] flex items-center gap-2">
                          <div className="grow bg-black/5 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${isOverloaded ? 'bg-red-500' : 'bg-[#004a99]'}`}
                              style={{ width: `${hospital.occupancyRate}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-[11px] shrink-0">{hospital.occupancyRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setActiveHospitalId(hospital.id)}
                          className="px-3 py-1.5 text-xs font-bold text-[#004a99] hover:text-white hover:bg-[#004a99] bg-[#004a99]/10 border border-[#004a99]/20 rounded-xl transition-all inline-flex items-center gap-1 shadow-sm"
                        >
                          Detalhes
                          <ChevronRight className="w-3.5 h-3.5 text-[#004a99] hover:text-white" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
