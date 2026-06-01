import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { downloadCSV, downloadXLSX, downloadPDF } from '../lib/exportUtils';

interface ExportDropdownProps {
  data: any[];
  filename: string;
  columns: string[];
}

export default function ExportDropdown({ data, filename, columns }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const headers = columns;
    const rows = data.map((item) =>
      columns.map((col) => {
        const keys = col.split('.');
        let value = item;
        for (const key of keys) {
          value = value?.[key] ?? '';
        }
        return value;
      })
    );

    if (format === 'csv') {
      downloadCSV(headers, rows, filename);
    } else if (format === 'xlsx') {
      downloadXLSX(headers, rows, filename);
    } else {
      downloadPDF(filename, '', headers, rows, filename);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 transition-all text-sm font-medium"
        title="Exportar dados"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-20 animate-fade-in">
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 border-b transition-all"
          >
            <File className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 border-b transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
