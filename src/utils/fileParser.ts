import { CampaignData } from '../contexts/CampaignContext';

/**
 * Parses an imported JSON file containing campaign data
 * @param fileContent The content of the imported JSON file
 * @returns Parsed campaign data or null if invalid
 */
export const parseImportedFile = async (fileContent: string): Promise<CampaignData | null> => {
  try {
    const parsedData = JSON.parse(fileContent);
    
    // Validate that the file contains required campaign data
    if (!isValidCampaignData(parsedData)) {
      console.error('Invalid campaign data format');
      return null;
    }
    
    // Return normalized campaign data
    return normalizeCampaignData(parsedData);
  } catch (error) {
    console.error('Error parsing file content:', error);
    return null;
  }
};

/**
 * Validates that the parsed data has the required structure
 */
const isValidCampaignData = (data: any): boolean => {
  // Basic validation for required fields
  // At minimum, we need either a messaging guide or action plan
  if (!data) return false;
  
  // Check for essential data structure
  const hasMessagingData = data.messagingGuide || data.step1Analysis;
  const hasActionPlanData = data.actionPlan;
  const hasSummaryData = data.summary && data.summary.purpose;
  
  return (hasMessagingData || hasActionPlanData) && hasSummaryData;
};

/**
 * Normalizes campaign data to ensure consistent structure
 */
const normalizeCampaignData = (data: any): CampaignData => {
  // Create a normalized structure with optional fields
  return {
    id: data.id || `campaign-${Date.now()}`,
    summary: data.summary || {},
    messagingGuide: data.messagingGuide || '',
    step1Analysis: data.step1Analysis || '',
    actionPlan: data.actionPlan || '',
    // Include any other fields that might be present
    ...data
  };
};