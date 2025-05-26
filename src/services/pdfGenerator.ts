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
    
    // Add logo if available
    if (reportOptions.logoDataUrl) {
      doc.addImage(reportOptions.logoDataUrl, 'PNG', margin, yPos, 40, 20);
      yPos += 30;
    }
    
    // Add title
    doc.setFontSize(24);
    doc.setTextColor(43, 87, 151); // Blue color
    const title = getReportTitle(reportType);
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    
    // Add organization info
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51); // Dark gray
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

    // Initialize table of contents
    const tocStartY = yPos;
    doc.setFontSize(16);
    doc.setTextColor(43, 87, 151);
    doc.text('Table of Contents', margin, yPos);
    yPos += 10;

    // Store sections and their page numbers
    const sections: { title: string; page: number }[] = [];
    let currentPage = 1;

    // Add executive summary if available
    if (campaignData.executiveSummary) {
      sections.push({ title: 'Executive Summary', page: currentPage });
      yPos = addSection(doc, 'Executive Summary', campaignData.executiveSummary, margin, yPos, contentWidth, pageHeight);
      currentPage = doc.internal.getNumberOfPages();
    }

    // Add specific report content based on type
    if (reportType === 'combined' || reportType === 'messaging') {
      if (campaignData.step1Analysis) {
        sections.push({ title: 'Strategic Analysis', page: currentPage });
        yPos = addSection(doc, 'Strategic Analysis', campaignData.step1Analysis, margin, yPos, contentWidth, pageHeight);
        currentPage = doc.internal.getNumberOfPages();
      }
      
      if (campaignData.messagingGuide) {
        sections.push({ title: 'Messaging Guide', page: currentPage });
        yPos = addSection(doc, 'Messaging Guide', campaignData.messagingGuide, margin, yPos, contentWidth, pageHeight);
        currentPage = doc.internal.getNumberOfPages();
      }
    }
    
    if (reportType === 'combined' || reportType === 'action') {
      if (campaignData.actionPlan) {
        sections.push({ title: 'Action Plan', page: currentPage });
        yPos = addSection(doc, 'Action Plan', campaignData.actionPlan, margin, yPos, contentWidth, pageHeight);
      }
    }

    // Go back to first page and add TOC
    doc.setPage(1);
    yPos = tocStartY + 15;
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);

    sections.forEach((section) => {
      doc.text(section.title, margin, yPos);
      doc.text(section.page.toString(), pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
    });
    
    // Save the PDF
    const filename = getReportFilename(campaignData, reportType);
    doc.save(filename);
    
    console.log(`PDF report "${filename}" generated successfully`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
};

const addSection = (
  doc: jsPDF,
  title: string,
  content: string,
  margin: number,
  startY: number,
  contentWidth: number,
  pageHeight: number
): number => {
  const lineHeight = 7;
  const titleMargin = 10;
  let currentY = startY;

  // Check if we need a new page for the section
  if (currentY + 30 > pageHeight - margin) {
    doc.addPage();
    currentY = margin;
  }

  // Add section title
  doc.setFontSize(16);
  doc.setTextColor(43, 87, 151);
  doc.text(title, margin, currentY);
  currentY += titleMargin + lineHeight;

  // Add section content
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);

  // Parse content for tables
  const parts = content.split(/(?=\|)|(?<=\n)/);
  let isInTable = false;
  let tableData: string[][] = [];
  let tableHeaders: string[] = [];

  for (const part of parts) {
    if (part.startsWith('|')) {
      if (!isInTable) {
        // Start new table
        isInTable = true;
        const headerRow = part.split('|').filter(cell => cell.trim());
        tableHeaders = headerRow.map(header => header.trim());
        tableData = [];
      } else {
        // Add table row
        if (!part.includes('|-')) { // Skip separator row
          const row = part.split('|').filter(cell => cell.trim());
          tableData.push(row.map(cell => cell.trim()));
        }
      }
    } else {
      if (isInTable) {
        // End table and render it
        isInTable = false;
        if (currentY + 30 > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        (doc as any).autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: currentY,
          margin: { left: margin },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [43, 87, 151] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
        tableData = [];
        tableHeaders = [];
      }

      // Regular text content
      if (part.trim()) {
        const splitContent = doc.splitTextToSize(part.trim(), contentWidth);
        for (const line of splitContent) {
          if (currentY > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(line, margin, currentY);
          currentY += lineHeight;
        }
      }
    }
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