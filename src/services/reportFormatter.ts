import { CampaignData } from '../contexts/CampaignContext';

interface FormattedSection {
  title: string;
  content: string;
  level: number;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface FormattedReport {
  title: string;
  sections: FormattedSection[];
  tables: Map<string, TableData>;
}

export const formatFullReport = async (campaignData: CampaignData): Promise<FormattedReport> => {
  console.log('Formatting report for campaign data:', campaignData);
  
  const sections: FormattedSection[] = [];
  const tables = new Map<string, TableData>();
  
  // Add executive summary if available
  if (campaignData.executiveSummary) {
    console.log('Processing executive summary');
    const formattedSummary = await formatSection(campaignData.executiveSummary);
    sections.push({
      title: 'Executive Summary',
      content: formattedSummary,
      level: 1
    });
  }

  // Add strategic analysis if available
  if (campaignData.step1Analysis) {
    console.log('Processing strategic analysis');
    const { formattedContent, extractedTables } = await processContent(
      campaignData.step1Analysis,
      'analysis'
    );
    
    sections.push({
      title: 'Strategic Analysis',
      content: formattedContent,
      level: 1
    });
    
    // Add extracted tables to the map
    extractedTables.forEach((table, key) => tables.set(key, table));
  }

  // Add messaging guide if available
  if (campaignData.messagingGuide) {
    console.log('Processing messaging guide');
    const { formattedContent, extractedTables } = await processContent(
      campaignData.messagingGuide,
      'messaging'
    );
    
    sections.push({
      title: 'Messaging Guide',
      content: formattedContent,
      level: 1
    });
    
    extractedTables.forEach((table, key) => tables.set(key, table));
  }

  // Add action plan if available
  if (campaignData.actionPlan) {
    console.log('Processing action plan');
    const { formattedContent, extractedTables } = await processContent(
      campaignData.actionPlan,
      'action'
    );
    
    sections.push({
      title: 'Action Plan',
      content: formattedContent,
      level: 1
    });
    
    extractedTables.forEach((table, key) => tables.set(key, table));
  }

  console.log('Formatted sections:', sections);
  console.log('Extracted tables:', tables);

  return {
    title: getReportTitle(campaignData),
    sections,
    tables
  };
};

const getReportTitle = (campaignData: CampaignData): string => {
  if (campaignData.summary?.purpose) {
    return `Campaign Report: ${campaignData.summary.purpose}`;
  }
  return 'Campaign Report';
};

const formatSection = async (content: string): Promise<string> => {
  if (!content) return '';
  
  // Remove any existing markdown formatting while preserving content structure
  let formatted = content
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/\*\*/g, '')     // Remove bold markers
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .trim();

  // Split into paragraphs and format each
  const paragraphs = formatted.split('\n\n');
  const formattedParagraphs = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return formattedParagraphs.join('\n\n');
};

const processContent = async (
  content: string,
  sectionPrefix: string
): Promise<{ formattedContent: string; extractedTables: Map<string, TableData> }> => {
  if (!content) {
    return { formattedContent: '', extractedTables: new Map() };
  }

  const tables = new Map<string, TableData>();
  let tableCounter = 1;
  let formattedContent = '';
  let currentTable: TableData | null = null;
  let tableLines: string[] = [];
  
  // Split content into lines
  const lines = content.split('\n');
  let currentParagraph = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|')) {
      // If we have any pending paragraph content, add it
      if (currentParagraph) {
        formattedContent += currentParagraph.trim() + '\n\n';
        currentParagraph = '';
      }
      
      tableLines.push(line);
      
      // If next line doesn't start with |, process the table
      if (!lines[i + 1]?.trim().startsWith('|')) {
        const table = processTable(tableLines);
        if (table) {
          const tableId = `${sectionPrefix}_table_${tableCounter++}`;
          tables.set(tableId, table);
          formattedContent += `[TABLE:${tableId}]\n\n`;
        }
        tableLines = [];
      }
    } else {
      // If we were collecting table lines, process the table
      if (tableLines.length > 0) {
        const table = processTable(tableLines);
        if (table) {
          const tableId = `${sectionPrefix}_table_${tableCounter++}`;
          tables.set(tableId, table);
          formattedContent += `[TABLE:${tableId}]\n\n`;
        }
        tableLines = [];
      }
      
      // Handle regular content
      if (line) {
        currentParagraph += (currentParagraph ? ' ' : '') + line;
      } else if (currentParagraph) {
        formattedContent += currentParagraph.trim() + '\n\n';
        currentParagraph = '';
      }
    }
  }
  
  // Handle any remaining content
  if (currentParagraph) {
    formattedContent += currentParagraph.trim() + '\n\n';
  }
  
  if (tableLines.length > 0) {
    const table = processTable(tableLines);
    if (table) {
      const tableId = `${sectionPrefix}_table_${tableCounter}`;
      tables.set(tableId, table);
      formattedContent += `[TABLE:${tableId}]\n\n`;
    }
  }
  
  return {
    formattedContent: formattedContent.trim(),
    extractedTables: tables
  };
};

const processTable = (tableLines: string[]): TableData | null => {
  if (tableLines.length < 3) return null; // Need at least header, separator, and one data row
  
  const headers = tableLines[0]
    .split('|')
    .filter(cell => cell.trim())
    .map(cell => cell.trim());
  
  const rows = tableLines.slice(2) // Skip header and separator
    .filter(line => line.includes('|'))
    .map(line => 
      line
        .split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim())
    );
  
  if (headers.length === 0 || rows.length === 0) return null;
  
  return { headers, rows };
};