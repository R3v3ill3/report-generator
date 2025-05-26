import { CampaignData, ReportOptions } from '../contexts/CampaignContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generatePdf = async (
  campaignData: CampaignData,
  reportOptions: ReportOptions,
  reportType: 'combined' | 'messaging' | 'action'
): Promise<void> => {
  try {
    console.log(`Generating ${reportType} PDF report for campaign:`, campaignData.id);
    
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    if (reportOptions.logoDataUrl) {
      doc.addImage(reportOptions.logoDataUrl, 'PNG', margin, yPos, 40, 20);
      yPos += 30;
    }
    
    doc.setFontSize(24);
    doc.setTextColor(43, 87, 151);
    const title = getReportTitle(reportType);
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    const { contactDetails } = reportOptions;
    doc.text(contactDetails.organizationName, margin, yPos);
    yPos += 7;
    if (contactDetails.contactPerson) {
      doc.text(contactDetails.contactPerson, margin, yPos);
      yPos += 7;
    }
    if (contactDetails.email) {
      doc.text(contactDetails.email, margin, yPos);
      yPos += 7;
    }
    if (contactDetails.phone) {
      doc.text(contactDetails.phone, margin, yPos);
      yPos += 7;
    }
    if (contactDetails.website) {
      doc.text(contactDetails.website, margin, yPos);
      yPos += 15;
    }

    const tocStartY = yPos;
    doc.setFontSize(16);
    doc.setTextColor(43, 87, 151);
    doc.text('Table of Contents', margin, yPos);
    yPos += 10;

    const sections: { title: string; page: number }[] = [];
    let currentPage = 1;

    if (campaignData.executiveSummary) {
      sections.push({ title: 'Executive Summary', page: currentPage });
      yPos = addFormattedSection(doc, 'Executive Summary', campaignData.executiveSummary, margin, yPos, contentWidth, pageHeight);
      currentPage = doc.internal.getNumberOfPages();
    }

    if (reportType === 'combined' || reportType === 'messaging') {
      if (campaignData.step1Analysis) {
        sections.push({ title: 'Strategic Analysis', page: currentPage });
        yPos = addFormattedSection(doc, 'Strategic Analysis', campaignData.step1Analysis, margin, yPos, contentWidth, pageHeight);
        currentPage = doc.internal.getNumberOfPages();
      }
      
      if (campaignData.messagingGuide) {
        sections.push({ title: 'Messaging Guide', page: currentPage });
        yPos = addFormattedSection(doc, 'Messaging Guide', campaignData.messagingGuide, margin, yPos, contentWidth, pageHeight);
        currentPage = doc.internal.getNumberOfPages();
      }
    }
    
    if (reportType === 'combined' || reportType === 'action') {
      if (campaignData.actionPlan) {
        sections.push({ title: 'Action Plan', page: currentPage });
        yPos = addFormattedSection(doc, 'Action Plan', campaignData.actionPlan, margin, yPos, contentWidth, pageHeight);
      }
    }

    doc.setPage(1);
    yPos = tocStartY + 15;
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);

    sections.forEach((section) => {
      doc.text(section.title, margin, yPos);
      doc.text(section.page.toString(), pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
    });
    
    const filename = getReportFilename(campaignData, reportType);
    doc.save(filename);
    
    console.log(`PDF report "${filename}" generated successfully`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
};

const addFormattedSection = (
  doc: jsPDF,
  title: string,
  content: string,
  margin: number,
  startY: number,
  contentWidth: number,
  pageHeight: number
): number => {
  let currentY = startY;
  const lineHeight = 7;
  const titleMargin = 10;

  if (currentY + 30 > pageHeight - margin) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(18);
  doc.setTextColor(43, 87, 151);
  doc.text(title, margin, currentY);
  currentY += titleMargin + lineHeight;

  const lines = content.split('\n');
  let inTable = false;
  let tableData: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableData = [];
      }
      const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
      if (cells.length > 0) {
        tableData.push(cells);
      }
      continue;
    }

    if (inTable && (!line.startsWith('|') || !line.endsWith('|'))) {
      inTable = false;
      if (tableData.length > 0) {
        const cleanTableData = tableData.filter(row => !row.every(cell => /^[-:]+$/.test(cell)));
        
        (doc as any).autoTable({
          startY: currentY,
          head: [cleanTableData[0]],
          body: cleanTableData.slice(1),
          margin: { left: margin },
          tableWidth: contentWidth,
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [43, 87, 151],
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250],
          },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 10;
        tableData = [];
      }
    }

    if (line.match(/^#{1,6}\s/)) {
      const level = line.match(/^(#{1,6})\s/)?.[1].length || 1;
      const text = line.replace(/^#{1,6}\s/, '');
      
      if (currentY + 20 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      const fontSize = 18 - (level * 2);
      doc.setFontSize(fontSize);
      doc.setTextColor(43, 87, 151);
      doc.text(text, margin, currentY);
      currentY += lineHeight + 5;
      continue;
    }

    if (line !== '' && !inTable) {
      if (currentY + lineHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      if (line.startsWith('**') && line.endsWith('**')) {
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        const boldText = line.slice(2, -2);
        doc.setFont(undefined, 'bold');
        const splitText = doc.splitTextToSize(boldText, contentWidth);
        doc.text(splitText, margin, currentY);
        doc.setFont(undefined, 'normal');
        currentY += (splitText.length * lineHeight) + 3;
      } else {
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        const splitText = doc.splitTextToSize(line, contentWidth);
        doc.text(splitText, margin, currentY);
        currentY += (splitText.length * lineHeight) + 3;
      }
    }
  }

  if (tableData.length > 0) {
    const cleanTableData = tableData.filter(row => !row.every(cell => /^[-:]+$/.test(cell)));
    (doc as any).autoTable({
      startY: currentY,
      head: [cleanTableData[0]],
      body: cleanTableData.slice(1),
      margin: { left: margin },
      tableWidth: contentWidth,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [43, 87, 151],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  return currentY + 15;
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