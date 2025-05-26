import { CampaignData } from '../contexts/CampaignContext';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const FORMATTING_PROMPT = `
Format this business report content with proper structure and formatting.

REQUIREMENTS:
1. Preserve table structure using tab-separated columns
2. Format headings with proper hierarchy (no symbols)
3. Use proper paragraph breaks and spacing
4. Maintain all original content and meaning
5. Use professional business language

For tables, format like this:
Week\tDay\tActivity\tDetails
1\tMon\tPlanning\tInitial setup
2\tTue\tReview\tTeam meeting

For headings, use proper capitalization and no symbols, with one blank line before and after:

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
          content: "You are a professional document formatter specializing in business reports. Format the content according to the requirements while preserving all information, meaning, and especially table structures. Use tabs to separate table columns."
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

    // Post-process the content to ensure proper table structure
    return postProcessContent(formattedContent.trim());
  } catch (error) {
    console.error('Error formatting content:', error);
    return content;
  }
};

const postProcessContent = (content: string): string => {
  // Split content into lines
  const lines = content.split('\n');
  const processedLines = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table start (line contains tabs)
    if (line.includes('\t')) {
      inTable = true;
      // Ensure consistent table formatting
      processedLines.push(line.split('\t').join('\t'));
    } else {
      if (inTable) {
        // Add extra line break after table
        processedLines.push('');
        inTable = false;
      }
      
      // Handle headings and paragraphs
      if (line.length > 0) {
        // Add extra line break before headings
        if (isHeading(line) && processedLines.length > 0) {
          processedLines.push('');
        }
        processedLines.push(line);
      } else {
        // Preserve single line breaks
        processedLines.push('');
      }
    }
  }

  return processedLines.join('\n');
};

const isHeading = (line: string): boolean => {
  // Simple heuristic: headings are typically shorter and don't end with punctuation
  return line.length < 100 && 
         !line.endsWith('.') && 
         !line.endsWith('?') && 
         !line.endsWith('!') &&
         line.split(' ').length < 10;
};