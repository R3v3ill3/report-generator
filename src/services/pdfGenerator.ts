import { CampaignData, ReportOptions } from '../contexts/CampaignContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePdf = async (
  campaignData: CampaignData,
  reportOptions: ReportOptions,
  reportType: 'combined' | 'messaging' | 'action'
): Promise<void> => {
  try {
    console.log(`Generating ${reportType} PDF report for campaign:`, campaignData.id);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add cover page
    addCoverPage(doc, reportType, reportOptions, pageWidth, margin);
    doc.addPage();
    
    // Add table of contents
    addTableOfContents(doc, margin);
    doc.addPage();
    
    let currentPage = 3; // Starting after cover and TOC
    
    // Add executive summary if available
    if (campaignData.executiveSummary) {
      currentPage = addExecutiveSummary(doc, campaignData.executiveSummary, margin, contentWidth, pageHeight, currentPage);
      doc.addPage();
      currentPage++;
    }
    
    // Add report content
    currentPage = addReportContent(doc, campaignData, reportType, margin, contentWidth, pageHeight, currentPage);
    
    // Save the PDF
    const filename = getReportFilename(campaignData, reportType);
    doc.save(filename);
    
    console.log(`PDF report "${filename}" generated successfully`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
};

const addCoverPage = (doc: jsPDF, reportType: string, reportOptions: ReportOptions, pageWidth: number, margin: number) => {
  let yPos = 60;
  
  // Add logo if available
  if (reportOptions.logoDataUrl) {
    doc.addImage(reportOptions.logoDataUrl, 'PNG', margin, 20, 40, 20);
    yPos = 100;
  }
  
  // Add title
  doc.setFontSize(24);
  doc.setTextColor(43, 87, 151);
  const title = getReportTitle(reportType);
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });
  
  // Add organization info
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  yPos += 30;
  doc.text(reportOptions.contactDetails.organizationName, pageWidth / 2, yPos, { align: 'center' });
  
  if (reportOptions.contactDetails.contactPerson) {
    yPos += 20;
    doc.setFontSize(12);
    doc.text(reportOptions.contactDetails.contactPerson, pageWidth / 2, yPos, { align: 'center' });
  }
  
  // Add date
  yPos += 20;
  doc.setFontSize(12);
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(date, pageWidth / 2, yPos, { align: 'center' });
};

const addTableOfContents = (doc: jsPDF, margin: number) => {
  doc.setFontSize(20);
  doc.setTextColor(43, 87, 151);
  doc.text('Table of Contents', margin, 40);
  
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  let yPos = 60;
  
  // Add TOC entries
  const entries = [
    { title: 'Executive Summary', page: 3 },
    { title: 'Strategic Analysis', page: 4 },
    { title: 'Messaging Guide', page: 5 },
    { title: 'Action Plan', page: 6 },
  ];
  
  entries.forEach(entry => {
    doc.text(entry.title, margin, yPos);
    doc.text(entry.page.toString(), 180, yPos);
    yPos += 15;
  });
};

const addExecutiveSummary = (
  doc: jsPDF,
  summary: string,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  currentPage: number
): number => {
  let yPos = 40;
  
  // Add section title
  doc.setFontSize(20);
  doc.setTextColor(43, 87, 151);
  doc.text('Executive Summary', margin, yPos);
  yPos += 20;
  
  // Process summary content
  const paragraphs = summary.split('\n\n');
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  
  paragraphs.forEach(para => {
    if (para.trim().startsWith('|')) {
      // Handle table
      const tableData = parseMarkdownTable(para);
      if (yPos + 100 > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        yPos = margin;
      }
      
      doc.autoTable({
        startY: yPos,
        head: [tableData.headers],
        body: tableData.rows,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [43, 87, 151],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else if (para.trim().startsWith('#')) {
      // Handle heading
      if (yPos + 20 > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        yPos = margin;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(43, 87, 151);
      doc.text(para.replace(/^#+\s/, ''), margin, yPos);
      yPos += 15;
      
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
    } else {
      // Handle regular paragraph
      const lines = doc.splitTextToSize(para.trim(), contentWidth);
      
      if (yPos + (lines.length * 7) > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        yPos = margin;
      }
      
      doc.text(lines, margin, yPos);
      yPos += lines.length * 7 + 10;
    }
  });
  
  return currentPage;
};

const parseMarkdownTable = (tableText: string) => {
  const rows = tableText.trim().split('\n');
  const headers = rows[0].split('|').filter(cell => cell.trim()).map(cell => cell.trim());
  const dataRows = rows.slice(2).map(row => 
    row.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
  );
  
  return {
    headers,
    rows: dataRows,
  };
};

const addReportContent = (
  doc: jsPDF,
  campaignData: CampaignData,
  reportType: string,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  currentPage: number
): number => {
  if (reportType === 'combined' || reportType === 'messaging') {
    if (campaignData.step1Analysis) {
      doc.addPage();
      currentPage++;
      currentPage = addSection(doc, 'Strategic Analysis', campaignData.step1Analysis, margin, contentWidth, pageHeight, currentPage);
    }
    
    if (campaignData.messagingGuide) {
      doc.addPage();
      currentPage++;
      currentPage = addSection(doc, 'Messaging Guide', campaignData.messagingGuide, margin, contentWidth, pageHeight, currentPage);
    }
  }
  
  if (reportType === 'combined' || reportType === 'action') {
    if (campaignData.actionPlan) {
      doc.addPage();
      currentPage++;
      currentPage = addSection(doc, 'Action Plan', campaignData.actionPlan, margin, contentWidth, pageHeight, currentPage);
    }
  }
  
  return currentPage;
};

const addSection = (
  doc: jsPDF,
  title: string,
  content: string,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  currentPage: number
): number => {
  let yPos = 40;
  
  // Add section title
  doc.setFontSize(20);
  doc.setTextColor(43, 87, 151);
  doc.text(title, margin, yPos);
  yPos += 20;
  
  // Process content
  const paragraphs = content.split('\n\n');
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  
  paragraphs.forEach(para => {
    if (para.trim().startsWith('|')) {
      // Handle table
      const tableData = parseMarkdownTable(para);
      if (yPos + 100 > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        yPos = margin;
      }
      
      doc.autoTable({
        startY: yPos,
        head: [tableData.headers],
        body: tableData.rows,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [43, 87, 151],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else if (para.trim().startsWith('#')) {
      // Handle heading
      if (yPos + 20 > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        yPos = margin;
      }
      
      const level = (para.match(/^#+/) || [''])[0].length;
      doc.setFontSize(level === 1 ? 18 : level === 2 ? 16 : 14);
      doc.setTextColor(43, 87, 151);
      doc.text(para.replace(/^#+\s/, ''), margin, yPos);
      yPos += 15;
      
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
    } else {
      // Handle regular paragraph
      const lines = doc.splitTextToSize(para.trim(), contentWidth);
      
      if (yPos + (lines.length * 7) > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        yPos = margin;
      }
      
      doc.text(lines, margin, yPos);
      yPos += lines.length * 7 + 10;
    }
  });
  
  return currentPage;
};

const getReportTitle = (reportType: 'combined' | 'messaging' | 'action'): string => {
  switch (reportType) {
    case 'combined':
      return 'Campaign Report';
    case 'messaging':
      return 'Campaign Messaging Guide';
    case 'action':
      return 'Campaign Action Plan';
  }
};

const getReportFilename = (campaignData: CampaignData, reportType: 'combined' | 'messaging' | 'action'): string => {
  const baseFilename = sanitizeFilename(campaignData.summary?.purpose || 'campaign');
  switch (reportType) {
    case 'combined':
      return `${baseFilename}_combined_report.pdf`;
    case 'messaging':
      return `${baseFilename}_messaging_guide.pdf`;
    case 'action':
      return `${baseFilename}_action_plan.pdf`;
  }
};

const sanitizeFilename = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/gi, '_')
    .substring(0, 50);
};