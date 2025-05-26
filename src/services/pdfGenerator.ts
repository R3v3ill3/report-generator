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
      doc.setFontSize(16);
      doc.setTextColor(43, 87, 151);
      doc.text('Executive Summary', margin, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      const splitSummary = doc.splitTextToSize(campaignData.executiveSummary, contentWidth);
      doc.text(splitSummary, margin, yPos);
      yPos += (splitSummary.length * 7) + 15;
    }
    
    // Add specific report content based on type
    if (reportType === 'combined' || reportType === 'messaging') {
      if (campaignData.step1Analysis) {
        addSection(doc, 'Strategic Analysis', campaignData.step1Analysis, margin, yPos, contentWidth);
        yPos = doc.internal.getCurrentPageInfo().pageNumber === 1 ? yPos + 40 : 20;
      }
      
      if (campaignData.messagingGuide) {
        addSection(doc, 'Messaging Guide', campaignData.messagingGuide, margin, yPos, contentWidth);
        yPos = doc.internal.getCurrentPageInfo().pageNumber === 1 ? yPos + 40 : 20;
      }
    }
    
    if (reportType === 'combined' || reportType === 'action') {
      if (campaignData.actionPlan) {
        addSection(doc, 'Action Plan', campaignData.actionPlan, margin, yPos, contentWidth);
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
  contentWidth: number
) => {
  doc.setFontSize(16);
  doc.setTextColor(43, 87, 151);
  doc.text(title, margin, startY);
  
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  const splitContent = doc.splitTextToSize(content, contentWidth);
  doc.text(splitContent, margin, startY + 10);
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