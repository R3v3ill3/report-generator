import { CampaignData } from '../contexts/CampaignContext';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo purposes
});

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
    console.log('Generating executive summary for campaign:', campaignData.id);
    
    // Extract relevant data for the prompt
    const messagingHighlights = campaignData.messagingGuide ? 
      campaignData.messagingGuide.substring(0, 1500) : 'Not available';
    
    const actionPlanHighlights = campaignData.actionPlan ?
      campaignData.actionPlan.substring(0, 1500) : 'Not available';
    
    const step1Highlights = campaignData.step1Analysis ?
      campaignData.step1Analysis.substring(0, 1000) : 'Not available';

    const prompt = `
      ${EXECUTIVE_SUMMARY_PROMPT}

      Campaign Purpose: ${campaignData.summary?.purpose}

      Messaging Guide Highlights:
      ${messagingHighlights}

      Action Plan Highlights:
      ${actionPlanHighlights}

      Strategic Analysis:
      ${step1Highlights}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional campaign strategist and business writer."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const summary = completion.choices[0]?.message?.content;
    
    if (!summary) {
      throw new Error('No summary generated');
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