import OpenAI from 'openai';
import { CampaignData } from '../contexts/CampaignContext';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const FORMATTING_PROMPT = `
As a professional business report writer, format and enhance the following content into a well-structured report section.

Requirements:
1. Create clear section headings without any markdown symbols
2. Format tables professionally with clear columns and rows
3. Break text into logical paragraphs with proper transitions
4. Maintain professional business language
5. Preserve all factual content while improving readability
6. Use proper hierarchical structure (main sections and subsections)

DO NOT:
- Add markdown symbols (**, ##, etc.)
- Use vertical bars (|) for tables
- Add any content not present in the original
- Change the meaning of any content

Format tables like this:
Column 1    Column 2    Column 3
Value 1     Value 2     Value 3

Input content:
`;

const EXECUTIVE_SUMMARY_PROMPT = `
Create a professional executive summary for this campaign report. The summary should:

1. Begin with a clear overview of the campaign purpose
2. Highlight key strategic elements
3. Summarize main recommendations
4. Present metrics and results professionally
5. Use clear business language
6. Include section headings for organization
7. Format any data or metrics in clear tables

Keep the original content but improve the structure and presentation.

Input content:
`;

export const formatReportContent = async (content: string, isExecutiveSummary = false): Promise<string> => {
  try {
    const prompt = isExecutiveSummary ? EXECUTIVE_SUMMARY_PROMPT : FORMATTING_PROMPT;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional business report writer and formatter."
        },
        {
          role: "user",
          content: prompt + content
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent formatting
      max_tokens: 2000
    });

    return completion.choices[0]?.message?.content || content;
  } catch (error) {
    console.error('Error formatting report content:', error);
    return content;
  }
};

export const formatFullReport = async (campaignData: CampaignData): Promise<CampaignData> => {
  const formattedData = { ...campaignData };

  // Format executive summary with special handling
  if (formattedData.executiveSummary) {
    formattedData.executiveSummary = await formatReportContent(formattedData.executiveSummary, true);
  }

  // Format other sections
  if (formattedData.step1Analysis) {
    formattedData.step1Analysis = await formatReportContent(formattedData.step1Analysis);
  }

  if (formattedData.messagingGuide) {
    formattedData.messagingGuide = await formatReportContent(formattedData.messagingGuide);
  }

  if (formattedData.actionPlan) {
    formattedData.actionPlan = await formatReportContent(formattedData.actionPlan);
  }

  return formattedData;
};