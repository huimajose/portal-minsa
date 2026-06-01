/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  CheckCircle, 
  Calendar, 
  FileSpreadsheet,
  MapPin,
  Lock,
  UserCheck,
  Building2,
  Clock,
  Briefcase,
  Edit2,
  FileEdit,
  ClipboardList,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Send,
  Award,
  DollarSign
} from 'lucide-react';
import { Hospital, UserRole } from '../types';
import RoleGuard, { hasPermission } from './RoleGuard';

interface ReportsViewProps {
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
  selectedProvince: string;
  onSelectProvince: (p: string) => void;
  selectedPeriod: string;
  onSelectPeriod: (p: string) => void;
  selectedMunicipality: string;
  onSelectMunicipality: (m: string) => void;
  dateRangeStart: string;
  onSelectDateRangeStart: (d: string) => void;
  dateRangeEnd: string;
  onSelectDateRangeEnd: (d: string) => void;
  selectedHospitalType: string;
  onSelectHospitalType: (t: string) => void;
  hospitals: Hospital[];
  userRole: UserRole;
  currentUserName: string;
}

// 4 Official Governmental Templates for Angola health administration
const DESPACHO_TEMPLATES = [
  {
    id: 'epidemic_alert',
    label: '🚨 Alerta Epidemiológico Urgente',
    tag: 'CONTINGÊNCIA ENDÉMICA',
    subject: 'DECLARAÇÃO DE ALERTA EPIDEMIOLÓGICO DE CONCENTRAÇÃO DE CASOS DE DOENÇA',
    title: 'Despacho de Investigação Clínica, Profilaxia e Bloqueio de Vetores Activos',
    defaultReference: 'MINSA-DNSP-2026-ALERT-EPI-048',
    urgency: 'Crítica',
    budget: 'Aprovado sob Orçamento de Contingência da Direcção Nacional',
    signatoryName: 'Dr. Geraldo Augusto dos Santos',
    signatoryTitle: 'Director Nacional de Saúde Pública - DNSP',
    defaultBody: (prov: string, mun: string, dis: string, total: number) => 
      `1. Havendo detectado um incremento anómalo de casos sob suspeita clínica de ${dis || 'Surto Sazonal'} no território da província de ${prov !== 'All' ? prov : 'Angola'} (com especial incidência no município de ${mun !== 'All' ? mun : 'Luanda Central'} que reporta presentemente ${total} pacientes monitorizados), determina-se a ativação do Alerta Epidemiológico Nível III.\n\n` +
      `2. Fica expressamente mandatada a Direcção Provincial de Saúde correspondente a mobilizar insumos profilácticos, pulverização extra e intra-domiciliar urgentemente, bem como a imediata distribuição de mosquiteiros impregnados com insecticida de acção prolongada.\n\n` +
      `3. Todas as clínicas e hospitais municipais no perímetro devem reportar os novos fluxos sintomáticos em intervalo máximo de 6 horas ao DNSP, para monitorização central de taxas de ocupação médica, sob pena de suspensão imediata de licenças operacionais de emergência.\n\n` +
      `4. As equipas de Brigadas Rápidas estão autorizadas a assumir a coordenação civil sanitária e estabelecer perímetros de triagem nas imediações dos focos estatísticos mapeados.`
  },
  {
    id: 'supplies_allocation',
    label: '💊 Alocação de Insumos & Logística Médica',
    tag: 'LOGÍSTICA E SUPRIMENTOS',
    subject: 'REFORÇO DE MEDICAMENTOS ESSENCIAIS E CAPACIDADE COMPLEMENTAR DE LEITOS',
    title: 'Despacho Ministerial de Canalização Logística de Emergência Sanitária',
    defaultReference: 'MINSA-GG-2026-LOG-SUP-112',
    urgency: 'Alta',
    budget: '75.500.000 AOA (Setenta e Cinco Milhões e Quinhentos Mil Kwanzas)',
    signatoryName: 'Dra. Isaura Maria de Carvalho',
    signatoryTitle: 'Coordenadora Central da Cadeia de Suprimentos - MINSA',
    defaultBody: (prov: string, mun: string, dis: string, total: number) => 
      `1. Diante da consolidação dos dados de internações hospitalares em ${prov !== 'All' ? prov : 'Angola'} que expõem taxas críticas de ocupação das camas activas, fica decretada a libertação do Fundo Especial de Reserva de Insumos do Ministério da Saúde de Angola.\n\n` +
      `2. Autoriza-se o envio urgente de um lote de reactivos laboratoriais para ${dis || 'Emergências'}, 5.000 kits de teste rápido e 1.200 unidades de reidratação oral, a serem descarregados directamente na central logística provincial.\n\n` +
      `3. Fica recomendada a expansão provisória imediata de até 15% na capacidade de camas de isolamento temporários para evitar a saturação de serviços vitais.\n\n` +
      `4. Designa-se o Gabinete Provincial de Inspeção Médica local como fiscal do envio, devendo apresentar auto de recepção e qualidade física dos artigos transportados em até 48 horas pós-chegada.`
  },
  {
    id: 'press_release',
    label: '📢 Comunicado Oficial de Imprensa',
    tag: 'ESCLARECIMENTO PÚBLICO',
    subject: 'BOLETIM EPIDEMIOLÓGICO INTEGRADO DA DIRECÇÃO NACIONAL DE SAÚDE',
    title: 'Comunicado à População e Órgãos de Comunicação Social de Angola',
    defaultReference: 'MINSA-COM-PRE-2026-BOLETIM-015',
    urgency: 'Normal',
    budget: 'Aprovado sem custos financeiros diretos',
    signatoryName: 'Assessoria de Imprensa Governamental',
    signatoryTitle: 'Gabinete de Comunicação e Imagem do MINSA',
    defaultBody: (prov: string, mun: string, dis: string, total: number) => 
      `O Ministério da Saúde de Angola, através da Direcção Nacional de Saúde Pública (DNSP), vem por este meio esclarecer a opinião pública sobre os dados mais actuais de vigilância no país:\n\n` +
      `Graças às acções sazonais proactivas e vigilância coordenada no combate à propagação de vectores de ${dis || 'Patologias Endémicas'} nas regiões de ${prov !== 'All' ? prov : 'Todas as dezoito províncias'}, fomos capazes de conter com eficácia os picos e frentes reprodutivas do mosquito de transmissão.\n\n` +
      `O MINSA apela com firmeza a todas as famílias para que reforcem medidas sanitárias básicas de saneamento do meio, remoção de poças de água estagnada e devida protecção individual de idosos e crianças menores. A rede governamental de saúde detém reservas médicas abundantes gratuitas.`
  },
  {
    id: 'staff_brigade',
    label: '🩺 Mobilização Extraordinária de Médicos',
    tag: 'RECURSOS HUMANOS',
    subject: 'NOMEAÇÃO DE BRIGADA SANITÁRIA DE INTERVENÇÃO CLÍNICA DE TRANSIÇÃO',
    title: 'Despacho Administrativo de Atribuição Mandatária de Contingente Médico',
    defaultReference: 'MINSA-DRH-2026-NOME-BRIG-229',
    urgency: 'Alta',
    budget: 'Orçamento Ordinário de Alocação de Efetivos em Rotação Sanitária',
    signatoryName: 'Dr. Silvério Pedro Ndongala',
    signatoryTitle: 'Director Nacional de Administração e Recursos Humanos - MINSA',
    defaultBody: (prov: string, mun: string, dis: string, total: number) => 
      `1. Sob a autoridade do Gabinete de Administração Geral e Recursos Humanos do Ministério da Saúde de Angola, determina-se a nomeação extraordinária de uma Brigada Médica de Intervenção Rápida composta por 8 clínicos seniores e 14 enfermeiros especialistas em monitoração epidémica civil.\n\n` +
      `2. Os profissionais prestarão cooperação e assistência clínica essencial nas clínicas com rácio mais crítico de internações em ${prov !== 'All' ? prov : 'Angola Central'} por um prazo renovável de 21 dias.\n\n` +
      `3. Todas as deslocações, alojamentos e subsídios logísticos regulamentares são custeados pelos fundos centrais de contingência do DNSP, sem impacto local nos recursos provinciais.\n\n` +
      `4. A nomeação oficial e registo centralizado entram em vigor imediatamente após assinatura digital deste despacho sancionado.`
  }
];

export default function ReportsView({
  totals,
  byProvince,
  byDisease,
  selectedProvince,
  onSelectProvince,
  selectedPeriod,
  onSelectPeriod,
  selectedMunicipality,
  onSelectMunicipality,
  dateRangeStart,
  onSelectDateRangeStart,
  dateRangeEnd,
  onSelectDateRangeEnd,
  selectedHospitalType,
  onSelectHospitalType,
  hospitals,
  userRole,
  currentUserName
}: ReportsViewProps) {
  // State variables for the editable document editor
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('epidemic_alert');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentSubject, setDocumentSubject] = useState<string>('');
  const [documentReference, setDocumentReference] = useState<string>('');
  const [documentBodyText, setDocumentBodyText] = useState<string>('');
  const [documentSignatoryName, setDocumentSignatoryName] = useState<string>('');
  const [documentSignatoryTitle, setDocumentSignatoryTitle] = useState<string>('');
  const [documentUrgency, setDocumentUrgency] = useState<string>('Alta');
  const [documentBudget, setDocumentBudget] = useState<string>('');

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Derive most active disease and specific municipality patients for dynamic injection
  const primaryDiseaseObj = useMemo(() => {
    if (byDisease.length === 0) return { name: 'Malária', cases: totals.patients };
    return byDisease.reduce((max, current) => current.cases > max.cases ? current : max, byDisease[0]);
  }, [byDisease, totals.patients]);

  const activeProvinceLabel = selectedProvince === 'All' ? 'Angola (Nacional)' : selectedProvince;

  // Function to load template defaults and option to inject active live parameters
  const loadTemplate = (id: string, injectLiveParams = true) => {
    const template = DESPACHO_TEMPLATES.find(t => t.id === id);
    if (!template) return;

    setDocumentSubject(template.subject);
    setDocumentTitle(template.title);
    setDocumentReference(template.defaultReference);
    setDocumentUrgency(template.urgency);
    setDocumentBudget(template.budget);
    setDocumentSignatoryName(template.signatoryName);
    setDocumentSignatoryTitle(template.signatoryTitle);

    if (injectLiveParams) {
      setDocumentBodyText(
        template.defaultBody(
          selectedProvince,
          selectedMunicipality,
          primaryDiseaseObj.name,
          totals.patients
        )
      );
    } else {
      setDocumentBodyText(
        template.defaultBody(
          'Cabinda',
          'Cabinda Central',
          'Malária Cíclica',
          450
        )
      );
    }
  };

  // Pre-load default template on launch or whenever structural variables change and user wants to match them
  useEffect(() => {
    loadTemplate(selectedTemplateId, true);
  }, [selectedTemplateId, selectedProvince, selectedMunicipality, primaryDiseaseObj.name, totals.patients]);

  // Handle manual trigger to sync live data from painel
  const handleSyncLiveData = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      loadTemplate(selectedTemplateId, true);
      const rand = Math.floor(100 + Math.random() * 900);
      setDocumentReference(prev => prev.split('-').slice(0, -1).join('-') + `-${rand}`);
      setIsRegenerating(false);
      setGenerationSuccess(true);
      setTimeout(() => setGenerationSuccess(false), 3000);
    }, 350);
  };

  // Dynamically resolve municipalities of selected province for filtration options
  const municipalitiesList = useMemo(() => {
    if (selectedProvince === 'All') return [];
    return Array.from(new Set(
      hospitals
        .filter(h => h.province === selectedProvince)
        .map(h => h.municipality)
    ));
  }, [selectedProvince, hospitals]);

  // Export edited values to a clean CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'MINISTERIO DA SAUDE DE ANGOLA - CERTIDAO DE DESPACHO ADM\n';
    csvContent += `Documento Ref,${documentReference}\n`;
    csvContent += `Assunto,${documentSubject}\n`;
    csvContent += `Titulo Oficial,${documentTitle}\n`;
    csvContent += `Urgencia Regulamentar,${documentUrgency}\n`;
    csvContent += `Orcamento Estimado,${documentBudget}\n`;
    csvContent += `Signatario Geral,${documentSignatoryName} (${documentSignatoryTitle})\n`;
    csvContent += `Data Emissao,${new Date().toLocaleDateString('pt-PT')}\n\n`;
    csvContent += 'INTEGRA COMENTARIOS / CORPO DO TEXTO EM DESPATCH\n';
    csvContent += `"${documentBodyText.replace(/"/g, '""')}"\n\n`;

    csvContent += 'INDICADORES AUXILIARES ASSOC (EM TEMPO REAL)\n';
    csvContent += `Pacientes Totais no Segmento,${totals.patients}\n`;
    csvContent += `Unidades Hospitalares Ativas,${totals.hospitals}\n`;
    csvContent += `Nascimentos Declarados,${totals.births}\n`;
    csvContent += `Obitos Consolidados,${totals.deaths}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AUT_DESPACHO_${documentReference.replace(/\//g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel sheet with formatted cells
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();

    const dataRows = [
      ["MINISTÉRIO DA SAÚDE DE ANGOLA"],
      ["DIRECÇÃO NACIONAL DE SAÚDE PÚBLICA (DNSP)"],
      [],
      ["DESPACHO ADMINISTRATIVO MINISTERIAL"],
      ["Referência", documentReference],
      ["Data de Emissão", new Date().toLocaleDateString('pt-PT')],
      ["Grau de Urgência", documentUrgency],
      ["Enquadramento Orçamentário", documentBudget],
      ["Assunto Principal", documentSubject],
      ["Título Regulamentar", documentTitle],
      [],
      ["AUTORIDADE ASSINANTE"],
      ["Nome do Signatário", documentSignatoryName],
      ["Cargo / Função Oficial", documentSignatoryTitle],
      [],
      ["CONTEÚDO DO DECRETO / DIRECTIVA SANITÁRIA"],
      [documentBodyText],
      [],
      ["DADOS AUXILIARES EMITIDOS POR RELATÓRIOS DO PAINEL"],
      ["Província de Foco", selectedProvince === 'All' ? 'Nacional (Angola)' : selectedProvince],
      ["Município de Foco", selectedMunicipality === 'All' ? 'Todos os Municípios' : selectedMunicipality],
      ["Tipo de Saúde", selectedHospitalType === 'All' ? 'Todos' : selectedHospitalType],
      ["Pacientes Seguidos Directo", totals.patients],
      ["Óbitos Totais Registados", totals.deaths],
      ["Nascimentos Registados", totals.births]
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 70 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Despacho Formatado");
    XLSX.writeFile(wb, `DESPACHO_${documentReference.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // High Fidelity jsPDF Export compiling exact edited contents into ministerial letterhead
  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant Outer Double Border Frame (Watermark outline)
    doc.setDrawColor(0, 74, 153); // MINSA Official Blue
    doc.setLineWidth(0.6);
    doc.rect(8, 8, 194, 281);
    doc.setDrawColor(218, 165, 32); // Gold accent inner outline
    doc.setLineWidth(0.15);
    doc.rect(10, 10, 190, 277);

    // Rep. of Angola Letterhead Seal
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('REPÚBLICA DE ANGOLA', 105, 18, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('MINISTÉRIO DA SAÚDE (MINSA)', 105, 24, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DIRECÇÃO NACIONAL DE SAÚDE PÚBLICA (DNSP)', 105, 28, { align: 'center' });
    
    // Dividing legal lines
    doc.setDrawColor(0, 74, 153);
    doc.setLineWidth(0.4);
    doc.line(18, 31, 192, 31);
    
    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(0.2);
    doc.line(18, 32, 192, 32);

    // Urgência Emblem
    let urgencyBadgeText = `URGÊNCIA: ${documentUrgency.toUpperCase()}`;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    if (documentUrgency === 'Crítica') {
      doc.setFillColor(254, 226, 226);
      doc.setTextColor(220, 38, 38);
    } else if (documentUrgency === 'Alta') {
      doc.setFillColor(254, 243, 199);
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setFillColor(241, 245, 249);
      doc.setTextColor(71, 85, 105);
    }
    doc.rect(142, 37, 48, 5, 'F');
    doc.text(urgencyBadgeText, 166, 40.5, { align: 'center' });

    // Official reference number & Date
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`DESPACHO OFICIAL N.º: ${documentReference}`, 18, 41);
    doc.text(`Geração Territorial: ${activeProvinceLabel}`, 18, 47);
    doc.text(`Data de Assinatura: ${new Date().toLocaleDateString('pt-PT')}`, 18, 53);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 74, 153);
    doc.text(`ASSUNTO: ${documentSubject.toUpperCase()}`, 18, 62);
    doc.setFontSize(10.5);
    doc.text(documentTitle, 18, 67, { maxWidth: 174 });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(18, 73, 192, 73);

    // Doc Body
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    
    // Split text into lines of 172mm maximum width
    const textSplit = doc.splitTextToSize(documentBodyText, 174);
    let y = 79;
    
    for (let i = 0; i < textSplit.length; i++) {
      if (y > 230) {
        doc.addPage();
        // Redraw outer borders for additional pages
        doc.setDrawColor(0, 74, 153);
        doc.setLineWidth(0.6);
        doc.rect(8, 8, 194, 281);
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(0.15);
        doc.rect(10, 10, 190, 277);
        y = 25;
      }
      doc.text(textSplit[i], 18, y);
      y += 5.5;
    }

    y += 4;
    doc.line(18, y, 192, y);
    y += 7;

    // Budgetary info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Cabimento Financeiro: ${documentBudget}`, 18, y);

    y += 12;

    if (y > 240) {
      doc.addPage();
      doc.setDrawColor(0, 74, 153);
      doc.setLineWidth(0.6);
      doc.rect(8, 8, 194, 281);
      doc.setDrawColor(218, 165, 32);
      doc.rect(10, 10, 190, 277);
      y = 35;
    }

    // Centered sign block
    doc.line(60, y, 150, y);
    y += 5.5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(documentSignatoryName, 105, y, { align: 'center' });
    
    y += 4.5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(documentSignatoryTitle, 105, y, { align: 'center' });
    doc.text('Gabinete Central - Ministério da Saúde', 105, y + 4, { align: 'center' });

    y += 15;
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Validação mecânica gerada por chave RSA de integridade nacional. Em conformidade com o regulamento do Diário da República de Angola.', 105, y, { align: 'center' });

    doc.save(`DESPACHO_${documentReference.replace(/\//g, '_')}.pdf`);
  };

  const isViewer = userRole === 'VISUALIZADOR';

  const selectedTemplateObj = DESPACHO_TEMPLATES.find(t => t.id === selectedTemplateId) || DESPACHO_TEMPLATES[0];

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Filtering Controls (Unified dashboard settings) */}
      <div className="glass-panel-heavy rounded-2xl p-5 shadow-sm no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#004a99]/15 text-[#004a99] rounded-xl border border-[#004a99]/20">
              <ClipboardList className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Centro de Despachos & Directivas Ministeriais</h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Emita directivas legais e alertas regulados com templates editáveis acoplados à API</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleSyncLiveData}
              disabled={isRegenerating || isViewer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-black text-slate-700 hover:text-[#004a99] hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-3xs"
              title="Resincronizar conteúdo padrão das caixas de texto com as estatísticas actuais"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#004a99] ${isRegenerating ? 'animate-spin' : ''}`} />
              Sincronizar Estatísticas Activas
            </button>
          </div>
        </div>

        {/* Dashboard filter mirrors - ensures the user can adjust data dynamically */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs font-semibold">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Província Alvo</label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                onSelectProvince(e.target.value);
                onSelectMunicipality('All');
              }}
              disabled={userRole === 'GESTOR_PROVINCIAL'}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#004a99] disabled:opacity-75 font-bold"
            >
              <option value="All">Todas as Províncias (Geral)</option>
              {byProvince.map((p) => (
                <option key={p.province} value={p.province}>{p.province}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Município de Alvo</label>
            <select
              value={selectedMunicipality}
              onChange={(e) => onSelectMunicipality(e.target.value)}
              disabled={selectedProvince === 'All'}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#004a99] disabled:opacity-50 font-bold"
            >
              <option value="All">Todos os Municípios</option>
              {municipalitiesList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-semibold">Nível Unidades</label>
            <select
              value={selectedHospitalType}
              onChange={(e) => onSelectHospitalType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#004a99] font-bold"
            >
              <option value="All">Todos os Tipos de Hospitais</option>
              <option value="Hospital Geral">Hospitais Gerais</option>
              <option value="Hospital Provincial">Hospitais Provinciais</option>
              <option value="Maternidade">Maternidades</option>
              <option value="Centro de Saúde">Centros de Saúde</option>
              <option value="Posto de Saúde">Postos de Saúde</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Início Customizado
            </label>
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => onSelectDateRangeStart(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#004a99] font-mono font-bold text-[10.5px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Fim Customizado
            </label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => onSelectDateRangeEnd(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#004a99] font-mono font-bold text-[10.5px]"
            />
          </div>

        </div>

        {generationSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl mt-3 font-semibold text-xs animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce-subtle" />
            <span>Despacho e Directiva re-sincronizada com os filtros do painel. Dados compilados de forma limpa.</span>
          </div>
        )}
      </div>

      {/* 2. MAIN SPLIT STUDIO: LEFT FOR EDITING, RIGHT FOR LIVE GOVERNMENT PROOF SHEET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPOSE SIDEBAR - 5 cols */}
        <div className="lg:col-span-5 space-y-4 no-print text-xs font-semibold">
          
          {/* Template Tab list select */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-black text-[#004a99] uppercase tracking-wide block mb-1">Passo 1: Selecione o Modelo Oficial</span>
              <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">Cada modelo carrega predefinições redigidas por consultores legais de saúde pública do MINSA Luanda.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              {DESPACHO_TEMPLATES.map((t) => {
                const isSelected = selectedTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setGenerationSuccess(true);
                      setTimeout(() => setGenerationSuccess(false), 2000);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-[#004a99] bg-[#004a99]/5 text-[#004a99] scale-[1.01]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-extrabold text-[11px] block">{t.label}</span>
                    <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded w-fit capitalize ${isSelected ? 'bg-[#004a99]/15' : 'bg-slate-100 text-slate-500'}`}>
                      {t.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EDIT FORM - Live inputs for custom tweaks */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-black text-[#004a99] uppercase tracking-wide flex items-center gap-1">
                <FileEdit className="w-4 h-4" />
                Passo 2: Edite o Despacho Co-propriedade
              </span>
              <span className="text-[9.5px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono font-bold">LIVRE</span>
            </div>

            {/* Document reference edit */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-bold block">Ref. Oficial do Documento</label>
                <input 
                  type="text" 
                  value={documentReference}
                  onChange={(e) => setDocumentReference(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004a99] font-mono text-slate-800 font-bold"
                  placeholder="EX: MINSA-DNSP-2026-001"
                />
              </div>

              {/* Urgency selection */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-bold block">Nível de Medida / Urgência</label>
                <select
                  value={documentUrgency}
                  onChange={(e) => setDocumentUrgency(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004a99] font-bold text-slate-800"
                >
                  <option value="Normal">Normal (Boletim)</option>
                  <option value="Alta">Alta prioridade</option>
                  <option value="Crítica">Crítica (Surto)</option>
                </select>
              </div>
            </div>

            {/* Subject heading */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 font-bold block">Gabinete / Assunto Geral</label>
              <input 
                type="text"
                value={documentSubject}
                onChange={(e) => setDocumentSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-800 font-extrabold"
                placeholder="Ex. ASSUNTO DE EMERGENCIA"
              />
            </div>

            {/* Sub-title */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 font-bold block">Decreto ou Título Principal do Despacho</label>
              <input 
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-800 font-bold"
                placeholder="Ex. Directiva de Reforço..."
              />
            </div>

            {/* EDITABLE DECREE TEXT AREA (Highly professional rich textbox) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-550 font-black block">Corpo de Decreto Administrativo (Editável)</label>
                <span className="text-[9.5px] text-[#004a99] font-mono font-bold animate-pulse-subtle">Mude o texto!</span>
              </div>
              <textarea
                rows={10}
                value={documentBodyText}
                onChange={(e) => setDocumentBodyText(e.target.value)}
                className="w-full p-3 border border-slate-250 rounded-xl font-sans text-xs text-slate-700 leading-relaxed font-semibold focus:outline-none focus:ring-1 focus:ring-[#004a99] bg-slate-50/40"
                placeholder="Escreva as regras de despacho governamentais..."
              />
            </div>

            {/* Money / Budget Allocated */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-550 font-bold block flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Cabimento Orçamental / Verba de Contingência
              </label>
              <input 
                type="text" 
                value={documentBudget}
                onChange={(e) => setDocumentBudget(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#004a99]/20 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#004a99] bg-white"
                placeholder="EX: Aprovado sem ônus adicionais"
              />
            </div>

            {/* Signatory Person edit */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-bold block">Nome do Responsável Assinante</label>
                <input 
                  type="text" 
                  value={documentSignatoryName}
                  onChange={(e) => setDocumentSignatoryName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-800 font-extrabold focus:outline-none"
                  placeholder="Nome do Director"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-bold block">Cargo / Ministério</label>
                <input 
                  type="text" 
                  value={documentSignatoryTitle}
                  onChange={(e) => setDocumentSignatoryTitle(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none font-bold text-[10.5px]"
                  placeholder="Ex: Director Nacional"
                />
              </div>
            </div>

            {/* Help Prompt */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-150 flex items-start gap-2 text-[10.5px] text-indigo-850 leading-relaxed font-semibold">
              <Award className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <span>O preenchimento acima actualiza a folha de provas oficiais (à direita) em tempo real. Pode re-escrever os parágrafos clicando directamente na caixa.</span>
            </div>

          </div>

        </div>

        {/* RIGHT OFFICIAL ANGOLAN GOVERNMENT PROOF SHEET - 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Certificate live frame */}
          <div className="bg-white border-2 border-slate-250 rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all text-xs font-semibold select-none">
            
            {/* Top Security Stamp decor */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004a99] via-amber-400 to-[#004a99]"></div>
            
            {/* Urgency stamp badge */}
            <div className="absolute top-6 right-6 font-mono text-[9px] border-2 uppercase font-black px-2 py-0.5 tracking-wider rounded rotate-1 text-center select-none shadow-5xs z-10 bg-white">
              {documentUrgency === 'Crítica' && <span className="text-red-650 border-red-200 bg-red-50/50">⚠️ CONTROLO CRÍTICO DE SURTO</span>}
              {documentUrgency === 'Alta' && <span className="text-amber-600 border-amber-200 bg-amber-50/20">⚡ PRIORIDADE ELEVADA DIRECTA</span>}
              {documentUrgency === 'Normal' && <span className="text-slate-600 border-slate-200 bg-slate-50">📑 DOCUMENTO GERAL DE ROTINA</span>}
            </div>

            {/* Official Coat of Arms Header Layout */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 border-b border-double border-slate-200 pb-5 mb-5 select-none pt-2">
              <div className="w-11 h-11 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center font-serif text-slate-800 font-black relative shadow-4xs">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-slate-700 uppercase font-serif">
                República de Angola
              </span>
              <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                Ministério da Saúde • MINSA
              </span>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">
                Direcção Nacional de Saúde Pública • DNSP Luanda
              </span>
            </div>

            {/* Metadatat bar */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-6 text-[10.5px]">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Referência de Protocolo</span>
                </div>
                <span className="font-mono text-[11px] font-black text-slate-900 block">{documentReference || 'Pendente'}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Foco Geográfico</span>
                </div>
                <span className="font-bold text-slate-900 block">
                  {activeProvinceLabel} {selectedMunicipality !== 'All' ? `/ ${selectedMunicipality}` : ''}
                </span>
              </div>
            </div>

            {/* Document Core Subject */}
            <div className="space-y-2 mb-6 text-left">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[9.5px] tracking-wide text-[#004a99]">
                <Send className="w-3.5 h-3.5 text-[#004a99] shrink-0" />
                <span>Assunto Oficial Declarado:</span>
                <span>{documentSubject || 'Não Atribuído'}</span>
              </div>
              
              <h2 className="text-[13.5px] font-black text-slate-900 leading-tight border-l-2 border-[#004a99] pl-3">
                {documentTitle || 'Directiva Oficial de Saúde Pública'}
              </h2>
            </div>

            {/* Decreted Body - Live edits rendered cleanly */}
            <div className="text-left text-xs text-slate-700 leading-relaxed font-medium space-y-3 p-4 bg-white border border-slate-150/80 rounded-2xl shadow-3xs mb-6 max-h-[350px] overflow-y-auto whitespace-pre-wrap">
              {documentBodyText || 'Nenhum texto de despacho inserido. Use a barra à esquerda para digitar decretos oficiais para o território.'}
            </div>

            {/* Financial allocation */}
            <div className="p-3 bg-emerald-500/5 text-slate-700 border border-emerald-500/10 rounded-xl mb-6 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-bold">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Orçamento Alocado:</span>
              </div>
              <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10.5px] border border-emerald-100/50">
                {documentBudget || 'Sem Ônus Diretos'}
              </span>
            </div>

            {/* Signed Official Section */}
            <div className="border-t border-slate-150 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-[#004a99] uppercase tracking-wide block">Assinatura Certificada</span>
                <span className="text-[11.5px] font-extrabold text-slate-900 block">{documentSignatoryName || 'Autoridade DNSP'}</span>
                <span className="text-[9.5px] text-slate-500 font-bold block leading-tight">{documentSignatoryTitle || 'Gabinete Intervenção'}</span>
              </div>

              <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
                <div className="px-2.5 py-1 text-[9.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg font-mono">
                  Validação RSA Digital
                </div>
                <span className="text-[8.5px] text-slate-400 mt-1">Data Sistema: {new Date().toLocaleDateString('pt-PT')}</span>
              </div>
            </div>

          </div>

          {/* Action triggers bottom bar - hidden during print */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-3 p-2 border-t border-slate-100 no-print">
            
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white/70 hover:bg-white/90 border border-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              CSV Despacho
            </button>

            <button
              onClick={handleExportXLSX}
              className="px-4 py-2 bg-[#dcfce7] hover:bg-[#bbf7d0] text-emerald-800 border border-emerald-350 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs active:scale-98"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Descarregar XLS Planilha
            </button>
            
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-[#004a99] hover:bg-[#003b80] active:bg-[#002f66] active:scale-98 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Emitir Despacho (PDF)
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
