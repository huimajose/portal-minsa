/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

/**
 * Downloads tabular data as a CSV file, prepending UTF-8 BOM so Microsoft Excel
 * handles Portuguese characters correctly (like Luanda, Benguela, Óbito, Diarreia, etc.).
 */
export function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => {
      const val = cell === undefined || cell === null ? '' : String(cell);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\r\n');

  // Insert UTF-8 Byte Order Mark (BOM) for compatibility with MS Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads tabular data as a formatted Excel (.xlsx) file using SheetJS (XLSX).
 */
export function downloadXLSX(headers: string[], rows: (string | number)[][], filename: string, sheetTitle: string = 'Relatório MINSA') {
  const wb = XLSX.utils.book_new();
  
  // Combine headers and rows
  const fullData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);
  
  // Basic auto-column widths
  const maxCols = headers.length;
  const colWidths = [];
  for (let c = 0; c < maxCols; c++) {
    let maxLength = headers[c].length;
    for (let r = 0; r < rows.length; r++) {
      const cellVal = rows[r][c];
      if (cellVal !== undefined && cellVal !== null) {
        maxLength = Math.max(maxLength, String(cellVal).length);
      }
    }
    colWidths.push({ wch: Math.min(40, Math.max(12, maxLength + 3)) });
  }
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31)); // sheet title max 31 chars
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Downloads tabular data as a beautiful, professional PDF using jsPDF.
 * Renders an official Republic of Angola style letterhead and a structured table.
 */
export function downloadPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2); // 180mm

  // 1. Elegant Gold & Blue Page Borders
  doc.setDrawColor(0, 74, 153); // MINSA Blue
  doc.setLineWidth(0.6);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setDrawColor(218, 165, 32); // Gold
  doc.setLineWidth(0.15);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // 2. Official Republic of Angola Header Letterhead
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('REPÚBLICA DE ANGOLA', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('MINISTÉRIO DA SAÚDE (MINSA)', pageWidth / 2, 23, { align: 'center' });
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('GABINETE DE VIGILÂNCIA EPIDEMIOLÓGICA E CONTROLO DE VETORES', pageWidth / 2, 27, { align: 'center' });
  
  // Double lines mimicking ministerial decree Separador
  doc.setDrawColor(0, 74, 153);
  doc.setLineWidth(0.4);
  doc.line(15, 30, pageWidth - 15, 30);
  doc.setDrawColor(218, 165, 32);
  doc.setLineWidth(0.2);
  doc.line(15, 31, pageWidth - 15, 31);

  // 3. Document Title Block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 74, 153);
  doc.text(title.toUpperCase(), margin, 40);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${subtitle} • Territorializado`, margin, 45);
  doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-PT')}`, pageWidth - margin, 45, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.15);
  doc.line(margin, 48, pageWidth - margin, 48);

  // 4. Draw Tabular Columns dynamically
  const startY = 56;
  const colCount = headers.length;
  const colWidth = contentWidth / colCount;

  // Header Row background & Text
  doc.setFillColor(0, 74, 153); // MINSA Blue
  doc.rect(margin, startY, contentWidth, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  headers.forEach((header, index) => {
    const textX = margin + (index * colWidth) + 2;
    doc.text(truncateText(String(header), colWidth - 4, doc), textX, startY + 5.5);
  });

  // Data Rows
  let currentY = startY + 8;
  const rowHeight = 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);

  rows.forEach((row, rowIndex) => {
    // Page overflow handler
    if (currentY + rowHeight > pageHeight - 20) {
      doc.addPage();
      
      // Secondary pages borders
      doc.setDrawColor(0, 74, 153);
      doc.setLineWidth(0.6);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
      doc.setDrawColor(218, 165, 32); 
      doc.setLineWidth(0.15);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Reset coordinates for next page
      currentY = 20;

      // Header on next page
      doc.setFillColor(0, 74, 153);
      doc.rect(margin, currentY, contentWidth, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      headers.forEach((header, index) => {
        const textX = margin + (index * colWidth) + 2;
        doc.text(truncateText(String(header), colWidth - 4, doc), textX, currentY + 5.5);
      });
      currentY += 8;
      doc.setFont('Helvetica', 'normal');
    }

    // Zebra striping colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252); // slate-50
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

    // Horizontal gridline
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.1);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    doc.setTextColor(51, 65, 85);
    row.forEach((cell, cellIndex) => {
      const textX = margin + (cellIndex * colWidth) + 2;
      const cellText = String(cell === undefined || cell === null ? '' : cell);
      doc.text(truncateText(cellText, colWidth - 4, doc), textX, currentY + 4.5);
    });

    currentY += rowHeight;
  });

  // Footer seal and signature lines
  let footerY = currentY + 12;
  if (footerY > pageHeight - 35) {
    doc.addPage();
    // borders
    doc.setDrawColor(0, 74, 153);
    doc.setLineWidth(0.6);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    doc.setDrawColor(218, 165, 32); 
    doc.setLineWidth(0.15);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    footerY = 30;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Relatório emitido através do Sistema Integrado de Vigilância Epidemiológica de Angola (SIVE-MINSA).', margin, footerY + 5);
  doc.text('Os dados constantes deste documento são de caráter confidencial restrito inter-operacional.', margin, footerY + 8);

  doc.text(`Pág. 1`, pageWidth - margin, footerY + 5, { align: 'right' });

  doc.save(`${filename}.pdf`);
}

/**
 * Truncates text so it fits beautifully in PDF table columns without overlapping
 */
function truncateText(text: string, maxWidth: number, doc: jsPDF): string {
  if (doc.getStringUnitWidth(text) * doc.getFontSize() < maxWidth) {
    return text;
  }
  let currentText = text;
  while (currentText.length > 3 && doc.getTextWidth(currentText + '...') > maxWidth) {
    currentText = currentText.substring(0, currentText.length - 1);
  }
  return currentText + '...';
}
