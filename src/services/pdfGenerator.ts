import { CampaignData, ReportOptions } from '../contexts/CampaignContext';
import { jsPDF } from 'jspdf';

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
    
    // Add executive summary if available
    if (campaignData.executiveSummary) {
      yPos = addSection(doc, 'Executive Summary', campaignData.executiveSummary, margin, yPos, contentWidth, pageHeight);
    }
    
    // Add specific report content based on type
    if (reportType === 'combined' || reportType === 'messaging') {
      if (campaignData.step1Analysis) {
        yPos = addSection(doc, 'Strategic Analysis', campaignData.step1Analysis, margin, yPos, contentWidth, pageHeight);
      }
      
      if (campaignData.messagingGuide) {
        yPos = addSection(doc, 'Messaging Guide', campaignData.messagingGuide, margin, yPos, contentWidth, pageHeight);
      }
    }
    
    if (reportType === 'combined' || reportType === 'action') {
      if (campaignData.actionPlan) {
        yPos = addSection(doc, 'Action Plan', campaignData.actionPlan, margin, yPos, contentWidth, pageHeight);
      }
    }
    
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
  const splitContent = doc.splitTextToSize(content, contentWidth);

  // Calculate if we need a new page
  for (let i = 0; i < splitContent.length; i++) {
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    doc.text(splitContent[i], margin, currentY);
    currentY += lineHeight;
  }

  return currentY + 15; // Return the new Y position with some padding
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