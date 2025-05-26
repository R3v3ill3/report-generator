import { CampaignData } from '../contexts/CampaignContext';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const FORMATTING_PROMPT = `
Format this business report content with proper structure and formatting.

REQUIREMENTS:
1. Use proper heading levels (no markdown symbols)
2. Format tables with clear columns and aligned data
3. Use proper paragraph breaks and spacing
4. Maintain all original content and meaning
5. Use professional business language

DO NOT:
- Use any markdown symbols (**, ##, etc.)
- Use vertical bars (|) for tables
- Add or remove any content
- Change the meaning of any content

For tables, format like this:
Week    Day    Activity    Details
1       Mon    Planning    Initial setup
2       Tue    Review     Team meeting

For headings, use proper capitalization and no symbols:
Main Heading
  Subheading
    Section Title

Input content:`;

export const formatFullReport = async (campaignData: CampaignData): Promise<CampaignData> => {
  try {
    const formattedData = { ...campaignData };

    if (formattedData.executiveSummary) {
      formattedData.executiveSummary = await formatContent(formattedData.executiveSummary);
    }

    if (formattedData.step1Analysis) {
      formattedData.step1Analysis = await formatContent(formattedData.step1Analysis);
    }

    if (formattedData.messagingGuide) {
      formattedData.messagingGuide = await formatContent(formattedData.messagingGuide);
    }

    if (formattedData.actionPlan) {
      formattedData.actionPlan = await formatContent(formattedData.actionPlan);
    }

    return formattedData;
  } catch (error) {
    console.error('Error formatting report:', error);
    return campaignData;
  }
};

const formatContent = async (content: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional document formatter. Format the content according to the requirements while preserving all information and meaning."
        },
        {
          role: "user",
          content: FORMATTING_PROMPT + "\n\n" + content
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const formattedContent = completion.choices[0]?.message?.content;
    
    if (!formattedContent) {
      throw new Error('No formatted content received from OpenAI');
    }

    return formattedContent.trim();
  } catch (error) {
    console.error('Error formatting content:', error);
    return content;
  }
};