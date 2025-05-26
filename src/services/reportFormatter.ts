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
    sections.push({
      title: 'Executive Summary',
      content: campaignData.executiveSummary,
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

  console.log('Formatted sections:', sections.map(s => ({ title: s.title, contentLength: s.content.length })));
  console.log('Number of tables:', tables.size);

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
  let tableLines: string[] = [];
  let inTable = false;
  
  // Split content into lines while preserving paragraphs
  const lines = content.split('\n');
  let currentParagraph = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|')) {
      // We're entering a table
      if (!inTable) {
        // If we have pending paragraph content, add it
        if (currentParagraph) {
          formattedContent += currentParagraph.trim() + '\n\n';
          currentParagraph = '';
        }
        inTable = true;
      }
      tableLines.push(line);
      
      // Check if this is the end of the table
      if (!lines[i + 1]?.trim().startsWith('|')) {
        const table = processTable(tableLines);
        if (table) {
          const tableId = `${sectionPrefix}_table_${tableCounter++}`;
          tables.set(tableId, table);
          formattedContent += `[TABLE:${tableId}]\n\n`;
        }
        tableLines = [];
        inTable = false;
      }
    } else {
      // Not in a table
      if (inTable) {
        // Process any pending table
        const table = processTable(tableLines);
        if (table) {
          const tableId = `${sectionPrefix}_table_${tableCounter++}`;
          tables.set(tableId, table);
          formattedContent += `[TABLE:${tableId}]\n\n`;
        }
        tableLines = [];
        inTable = false;
      }
      
      // Handle regular content
      if (line) {
        // If this is a header (starts with #), add it as a new paragraph
        if (line.startsWith('#')) {
          if (currentParagraph) {
            formattedContent += currentParagraph.trim() + '\n\n';
            currentParagraph = '';
          }
          // Remove the # and add as a paragraph
          formattedContent += line.replace(/^#+\s*/, '').trim() + '\n\n';
        } else {
          // Regular text - add to current paragraph
          currentParagraph += (currentParagraph ? ' ' : '') + line;
        }
      } else if (currentParagraph) {
        // Empty line - end the current paragraph
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
  
  // Process headers - remove leading/trailing |
  const headers = tableLines[0]
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => cell.trim());
  
  // Skip the separator line and process data rows
  const rows = tableLines.slice(2)
    .map(line => 
      line
        .replace(/^\||\|$/g, '') // Remove leading/trailing |
        .split('|')
        .map(cell => cell.trim())
    )
    .filter(row => row.length === headers.length); // Ensure row matches headers
  
  if (headers.length === 0 || rows.length === 0) return null;
  
  return { headers, rows };
};