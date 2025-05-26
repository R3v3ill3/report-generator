import { CampaignData } from '../contexts/CampaignContext';

/**
 * Formats the full campaign report data for export
 */
export const formatFullReport = async (campaignData: CampaignData): Promise<CampaignData> => {
  try {
    // Create a deep copy to avoid modifying original data
    const formattedData = JSON.parse(JSON.stringify(campaignData));
    
    // Format each section if it exists
    if (formattedData.executiveSummary) {
      formattedData.executiveSummary = formatSection(formattedData.executiveSummary);
    }
    
    if (formattedData.step1Analysis) {
      formattedData.step1Analysis = formatSection(formattedData.step1Analysis);
    }
    
    if (formattedData.messagingGuide) {
      formattedData.messagingGuide = formatSection(formattedData.messagingGuide);
    }
    
    if (formattedData.actionPlan) {
      formattedData.actionPlan = formatSection(formattedData.actionPlan);
    }
    
    return formattedData;
  } catch (error) {
    console.error('Error formatting report:', error);
    return campaignData; // Return original data if formatting fails
  }
};

/**
 * Formats a single section of content
 */
const formatSection = (content: string): string => {
  try {
    // Remove any excessive whitespace while preserving intentional line breaks
    let formatted = content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple blank lines to maximum of one
      .replace(/\s+$/gm, '') // Remove trailing whitespace from lines
      .trim();
    
    // Ensure proper spacing around markdown tables
    formatted = formatted.replace(/\n\|/g, '\n\n|'); // Add space before tables
    formatted = formatted.replace(/\|\n(?!\|)/g, '|\n\n'); // Add space after tables
    
    // Ensure proper spacing around headers
    formatted = formatted.replace(/\n(#{1,6}\s)/g, '\n\n$1');
    formatted = formatted.replace(/\n(#{1,6}\s.*)\n(?!\n)/g, '\n$1\n\n');
    
    return formatted;
  } catch (error) {
    console.error('Error formatting section:', error);
    return content; // Return original content if formatting fails
  }
};