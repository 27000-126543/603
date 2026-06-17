import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
  key: keyof T;
  title: string;
  format?: (value: T[keyof T], row: T) => string;
}

export const exportToExcel = <T>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string
): void => {
  const formattedData = data.map((row) => {
    const formattedRow: Record<string, string> = {};
    columns.forEach((col) => {
      const value = row[col.key];
      formattedRow[col.title] = col.format ? col.format(value, row) : String(value ?? '');
    });
    return formattedRow;
  });

  const ws = XLSX.utils.json_to_sheet(formattedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '数据');

  ws['!cols'] = columns.map(() => ({ wch: 15 }));

  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = <T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string,
  fileName: string
): void => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 14, 32);
  doc.text(`数据总数: ${data.length} 条`, 14, 38);

  const tableColumn = columns.map((col) => col.title);
  const tableRows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      return col.format ? col.format(value, row) : String(value ?? '');
    })
  );

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    theme: 'grid',
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`第 ${i} 页 / 共 ${pages} 页`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  }

  doc.save(`${fileName}.pdf`);
};

export const exportReportToPDF = (
  statistics: {
    zoneUsage: Array<{ zoneName: string; usageRate: number; total: number; used: number }>;
    overtimeRate: number;
    avgWaitTime: number;
    totalApplications: number;
    todayEntryCount: number;
    todayExitCount: number;
    totalAmountThisMonth: number;
  },
  dailyTrend: Array<{ date: string; entryCount: number; exitCount: number }>,
  fileName: string
): void => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('停车场运营统计报告', 14, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`报告生成时间: ${new Date().toLocaleString('zh-CN')}`, 14, 35);

  doc.setFillColor(30, 58, 138);
  doc.roundedRect(14, 42, 182, 40, 3, 3, 'F');
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('核心指标概览', 20, 55);

  doc.setFontSize(16);
  doc.text(`今日入场: ${statistics.todayEntryCount}`, 20, 72);
  doc.text(`今日出场: ${statistics.todayExitCount}`, 70, 72);
  doc.text(`超时率: ${statistics.overtimeRate}%`, 120, 72);
  doc.text(`本月费用: ¥${statistics.totalAmountThisMonth.toFixed(2)}`, 165, 72);

  const zoneColumns = ['区域名称', '总车位', '已使用', '使用率'];
  const zoneRows = statistics.zoneUsage.map((z) => [
    z.zoneName,
    z.total.toString(),
    z.used.toString(),
    `${z.usageRate.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    head: [zoneColumns],
    body: zoneRows,
    startY: 95,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  });

  const trendColumns = ['日期', '入场数', '出场数'];
  const trendRows = dailyTrend.map((d) => [d.date, d.entryCount.toString(), d.exitCount.toString()]);

  autoTable(doc, {
    head: [trendColumns],
    body: trendRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`车辆通行证管理系统 - 第 ${i} 页 / 共 ${pages} 页`, 105, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`${fileName}.pdf`);
};

export const downloadFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
