import { CampaignData } from '../contexts/CampaignContext';

const EXECUTIVE_SUMMARY_PROMPT = `
Generate a professional executive summary for a campaign report with the following sections:

1. Overview (2-3 paragraphs)
- Campaign purpose and context
- Primary objectives and target audience
- Key strategic approach

2. Messaging Strategy Summary (1-2 paragraphs)
- Core narrative themes
- Key message frameworks
- Primary value propositions

3. Key Messages Table
| Message Type | Core Theme | Target Response | Effectiveness |
|--------------|------------|-----------------|---------------|
[Include 3-4 key messages with their themes, intended audience response, and predicted effectiveness]

4. Action Plan Highlights
- Timeline overview
- Critical milestones
- Resource requirements
- Success metrics

5. Implementation Summary Table
| Phase | Timeline | Key Activities | Expected Outcomes |
|-------|----------|----------------|-------------------|
[Break down the implementation into 3-4 phases]

Format the output as clean markdown without any special characters or formatting marks.
Ensure all content is business-appropriate and professionally written.
`;

export const generateExecutiveSummary = async (campaignData: CampaignData): Promise<string | null> => {
  try {
    // For this demo, we'll simulate the OpenAI API call
    // In a real implementation, you would make an actual API call to OpenAI
    
    console.log('Generating executive summary for campaign:', campaignData.id);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract relevant data for the prompt
    const messagingHighlights = campaignData.messagingGuide ? 
      campaignData.messagingGuide.substring(0, 1500) : 'Not available';
    
    const actionPlanHighlights = campaignData.actionPlan ?
      campaignData.actionPlan.substring(0, 1500) : 'Not available';
    
    const step1Highlights = campaignData.step1Analysis ?
      campaignData.step1Analysis.substring(0, 1000) : 'Not available';

    // Create a sample executive summary based on campaign data
    let summary = `Executive Summary: ${campaignData.summary?.purpose}\n\n`;
    
    // Overview Section
    summary += `Overview\n\n`;
    summary += `This comprehensive campaign strategy addresses ${campaignData.summary?.purpose}, targeting ${campaignData.messagingGuide ? 'specific audience segments' : 'key stakeholders'} through a multi-channel approach. The campaign aims to achieve measurable outcomes through strategic messaging and tactical implementation.\n\n`;
    
    // Messaging Strategy Summary
    if (campaignData.messagingGuide) {
      summary += `Messaging Strategy\n\n`;
      summary += `The messaging framework leverages core values and narratives that resonate with target audiences. Key themes include community engagement, positive change, and actionable solutions.\n\n`;
      
      // Key Messages Table
      summary += `Key Messages\n\n`;
      summary += `| Message Type | Core Theme | Target Response | Effectiveness |\n`;
      summary += `|--------------|------------|-----------------|---------------|\n`;
      summary += `| Values-Based | Community Impact | Emotional Connection | High |\n`;
      summary += `| Action-Oriented | Practical Solutions | Engagement | Medium-High |\n`;
      summary += `| Social Proof | Collective Success | Trust Building | High |\n\n`;
    }
    
    // Action Plan Highlights
    if (campaignData.actionPlan) {
      summary += `Action Plan Highlights\n\n`;
      summary += `The implementation strategy spans multiple phases with clear milestones and success metrics. Key resources have been allocated to ensure effective execution across all campaign touchpoints.\n\n`;
      
      // Implementation Summary Table
      summary += `Implementation Timeline\n\n`;
      summary += `| Phase | Timeline | Key Activities | Expected Outcomes |\n`;
      summary += `|-------|----------|----------------|-------------------|\n`;
      summary += `| Launch | Weeks 1-2 | Platform Setup, Initial Content | Awareness |\n`;
      summary += `| Growth | Weeks 3-4 | Community Engagement | Participation |\n`;
      summary += `| Peak | Weeks 5-6 | Action Campaigns | Conversion |\n\n`;
    }
    
    // Format the summary
    const formattedSummary = await formatExecutiveSummary(summary);
    return formattedSummary;
    
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return null;
  }
};

const formatExecutiveSummary = async (content: string): Promise<string> => {
  try {
    // Simulate formatting API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove markdown-style formatting
    let formatted = content
      .replace(/\*\*/g, '')
      .replace(/##/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return formatted;
  } catch (error) {
    console.error('Error formatting executive summary:', error);
    return content;
  }
};