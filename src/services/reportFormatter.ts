import OpenAI from 'openai';
import { CampaignData } from '../contexts/CampaignContext';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const FORMATTING_PROMPT = `
As a professional document formatter, enhance the following report content with proper structure and formatting.

Guidelines:
1. Use proper heading levels (no markdown symbols)
2. Ensure paragraphs have logical breaks
3. Format tables professionally
4. Maintain consistent spacing
5. Use appropriate emphasis for key points
6. Break long sections into digestible chunks
7. Ensure proper flow between sections

Format the content following these rules:
- Use "Heading1:", "Heading2:", or "Heading3:" prefixes for headings
- Use "Table:" prefix for table content
- Use "Para:" prefix for paragraphs
- Use "Break" on its own line to indicate section breaks

Example:
Heading1: Executive Summary
Para: This report outlines...
Break
Heading2: Key Findings
Para: Analysis shows...
Table: | Metric | Value | Impact |
      | Growth | 25%   | High   |

Input content:
`;

export const formatReportContent = async (content: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional document formatter specializing in business reports."
        },
        {
          role: "user",
          content: FORMATTING_PROMPT + content
        }
      ],
      temperature: 0.7,
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

  if (formattedData.executiveSummary) {
    formattedData.executiveSummary = await formatReportContent(formattedData.executiveSummary);
  }

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