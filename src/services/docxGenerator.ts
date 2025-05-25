import { CampaignData, ReportOptions } from '../contexts/CampaignContext';

/**
 * Generates a DOCX report for the campaign
 * @param campaignData The campaign data
 * @param reportOptions Report customization options
 * @param reportType The type of report to generate
 * @returns Promise resolving when DOCX generation is complete
 */
export const generateDocx = async (
  campaignData: CampaignData,
  reportOptions: ReportOptions,
  reportType: 'combined' | 'messaging' | 'action'
): Promise<void> => {
  // For this demo, we'll simulate DOCX generation
  // In a real implementation, you would use a library like docx.js
  
  try {
    console.log(`Generating ${reportType} DOCX report for campaign:`, campaignData.id);
    
    // Simulate DOCX generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine the filename
    let filename = '';
    if (reportType === 'combined') {
      filename = `${sanitizeFilename(campaignData.summary?.purpose || 'campaign')}_combined_report.docx`;
    } else if (reportType === 'messaging') {
      filename = `${sanitizeFilename(campaignData.summary?.purpose || 'campaign')}_messaging_guide.docx`;
    } else {
      filename = `${sanitizeFilename(campaignData.summary?.purpose || 'campaign')}_action_plan.docx`;
    }
    
    // In a real implementation, you would generate the DOCX here
    // For this demo, we'll simulate a download by creating a simple text file
    const content = getReportContent(campaignData, reportOptions, reportType);
    downloadTextAsFile(content, filename);
    
    console.log(`DOCX report "${filename}" generated successfully`);
  } catch (error) {
    console.error('Error generating DOCX report:', error);
    throw new Error('Failed to generate DOCX report');
  }
};

/**
 * Gets the content for the report based on type
 */
const getReportContent = (
  campaignData: CampaignData,
  reportOptions: ReportOptions,
  reportType: 'combined' | 'messaging' | 'action'
): string => {
  const { contactDetails } = reportOptions;
  let content = '';
  
  // Add report header
  if (reportType === 'combined') {
    content += `COMBINED CAMPAIGN REPORT\n`;
  } else if (reportType === 'messaging') {
    content += `CAMPAIGN MESSAGING GUIDE\n`;
  } else {
    content += `CAMPAIGN ACTION PLAN\n`;
  }
  content += `============================\n\n`;
  
  // Add organization info
  content += `Organization: ${contactDetails.organizationName}\n`;
  if (contactDetails.contactPerson) content += `Contact: ${contactDetails.contactPerson}\n`;
  if (contactDetails.email) content += `Email: ${contactDetails.email}\n`;
  if (contactDetails.phone) content += `Phone: ${contactDetails.phone}\n`;
  if (contactDetails.website) content += `Website: ${contactDetails.website}\n`;
  content += `\n`;
  
  // Add campaign info
  content += `Campaign: ${campaignData.summary?.purpose || 'Untitled Campaign'}\n`;
  content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
  
  // Add executive summary if available
  if (campaignData.executiveSummary) {
    content += `EXECUTIVE SUMMARY\n`;
    content += `----------------\n`;
    content += `${campaignData.executiveSummary}\n\n`;
  }
  
  // Add specific report content based on type
  if (reportType === 'combined' || reportType === 'messaging') {
    if (campaignData.step1Analysis) {
      content += `MESSAGING ANALYSIS\n`;
      content += `----------------\n`;
      content += `${campaignData.step1Analysis}\n\n`;
    }
    
    if (campaignData.messagingGuide) {
      content += `MESSAGING GUIDE\n`;
      content += `----------------\n`;
      content += `${campaignData.messagingGuide}\n\n`;
    }
  }
  
  if (reportType === 'combined' || reportType === 'action') {
    if (campaignData.actionPlan) {
      content += `ACTION PLAN\n`;
      content += `----------------\n`;
      content += `${campaignData.actionPlan}\n\n`;
    }
  }
  
  return content;
};

/**
 * Sanitizes a string for use in a filename
 */
const sanitizeFilename = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/gi, '_')
    .substring(0, 50);
};

/**
 * Helper function to simulate file download
 */
const downloadTextAsFile = (text: string, filename: string): void => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};