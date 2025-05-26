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
  const sections: FormattedSection[] = [];
  const tables = new Map<string, TableData>();
  
  // Add executive summary if available
  if (campaignData.executiveSummary) {
    sections.push({
      title: 'Executive Summary',
      content: await formatSection(campaignData.executiveSummary),
      level: 1
    });
  }

  // Add strategic analysis if available
  if (campaignData.step1Analysis) {
    const { formattedContent, extractedTables } = await extractAndFormatTables(
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
    const { formattedContent, extractedTables } = await extractAndFormatTables(
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
    const { formattedContent, extractedTables } = await extractAndFormatTables(
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

  return {
    title: campaignData.summary?.purpose || 'Campaign Report',
    sections,
    tables
  };
};

const formatSection = async (content: string): Promise<string> => {
  // Remove any existing markdown formatting
  let formatted = content
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/\*\*/g, '')     // Remove bold markers
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .trim();

  // Split into paragraphs and format each
  const paragraphs = formatted.split('\n\n');
  const formattedParagraphs = paragraphs.map(p => p.trim()).filter(p => p.length > 0);

  return formattedParagraphs.join('\n\n');
};

const extractAndFormatTables = async (
  content: string,
  sectionPrefix: string
): Promise<{ formattedContent: string; extractedTables: Map<string, TableData> }> => {
  const tables = new Map<string, TableData>();
  let tableCounter = 1;
  let formattedContent = '';
  let currentTable: TableData | null = null;
  let isCollectingTable = false;
  
  // Split content into lines
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|')) {
      if (!isCollectingTable) {
        // Start new table
        isCollectingTable = true;
        currentTable = {
          headers: [],
          rows: []
        };
        
        // Extract headers
        const headerCells = line.split('|')
          .filter(cell => cell.trim())
          .map(cell => cell.trim());
        
        currentTable.headers = headerCells;
      } else if (!line.includes('|-')) { // Skip separator row
        // Add table row
        const rowCells = line.split('|')
          .filter(cell => cell.trim())
          .map(cell => cell.trim());
        
        if (currentTable) {
          currentTable.rows.push(rowCells);
        }
      }
    } else if (isCollectingTable) {
      // End of table reached
      isCollectingTable = false;
      if (currentTable) {
        const tableId = `${sectionPrefix}_table_${tableCounter++}`;
        tables.set(tableId, currentTable);
        formattedContent += `\n[TABLE:${tableId}]\n\n`;
      }
      
      if (line) {
        formattedContent += await formatSection(line) + '\n\n';
      }
    } else if (line) {
      formattedContent += await formatSection(line) + '\n\n';
    }
  }
  
  // Handle case where file ends with a table
  if (isCollectingTable && currentTable) {
    const tableId = `${sectionPrefix}_table_${tableCounter}`;
    tables.set(tableId, currentTable);
    formattedContent += `\n[TABLE:${tableId}]\n\n`;
  }
  
  return {
    formattedContent: formattedContent.trim(),
    extractedTables: tables
  };
};