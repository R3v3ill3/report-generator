import { CampaignData } from '../contexts/CampaignContext';

interface FormattedSection {
  title: string;
  content: string[];
  tables: Table[];
}

interface Table {
  headers: string[];
  rows: string[][];
}

/**
 * Formats the full campaign report data for export
 */
export const formatFullReport = async (campaignData: CampaignData): Promise<CampaignData> => {
  try {
    // Create a deep copy to avoid modifying original data
    const formattedData = JSON.parse(JSON.stringify(campaignData));
    
    // Format each section if it exists
    if (formattedData.executiveSummary) {
      formattedData.executiveSummary = formatContent(formattedData.executiveSummary);
    }
    
    if (formattedData.step1Analysis) {
      formattedData.step1Analysis = formatContent(formattedData.step1Analysis);
    }
    
    if (formattedData.messagingGuide) {
      formattedData.messagingGuide = formatContent(formattedData.messagingGuide);
    }
    
    if (formattedData.actionPlan) {
      formattedData.actionPlan = formatContent(formattedData.actionPlan);
    }
    
    return formattedData;
  } catch (error) {
    console.error('Error formatting report:', error);
    return campaignData;
  }
};

/**
 * Formats content by properly handling headings, paragraphs, and tables
 */
const formatContent = (content: string): string => {
  try {
    // Split content into lines for processing
    const lines = content.split('\n');
    const formattedLines: string[] = [];
    let inTable = false;
    let currentTable: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Handle table lines
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          // Add a blank line before table if needed
          if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
            formattedLines.push('');
          }
        }
        currentTable.push(line);
        continue;
      } else if (inTable) {
        // Table has ended
        inTable = false;
        if (currentTable.length > 0) {
          // Process and add the table
          const formattedTable = formatTable(currentTable);
          formattedLines.push(...formattedTable);
          formattedLines.push(''); // Add blank line after table
          currentTable = [];
        }
      }
      
      // Handle headings
      if (line.match(/^#{1,6}\s/)) {
        // Add blank line before heading if needed
        if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
          formattedLines.push('');
        }
        formattedLines.push(line);
        formattedLines.push(''); // Add blank line after heading
        continue;
      }
      
      // Handle regular paragraphs
      if (line !== '') {
        formattedLines.push(line);
      } else if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
    }
    
    // Handle any remaining table
    if (currentTable.length > 0) {
      const formattedTable = formatTable(currentTable);
      formattedLines.push(...formattedTable);
    }
    
    return formattedLines.join('\n');
  } catch (error) {
    console.error('Error formatting content:', error);
    return content;
  }
};

/**
 * Formats a table ensuring proper alignment and spacing
 */
const formatTable = (tableLines: string[]): string[] => {
  if (tableLines.length < 2) return tableLines;
  
  // Process table lines
  const processedLines = tableLines.map(line => {
    // Remove outer pipes and trim cells
    return line.slice(1, -1).split('|').map(cell => cell.trim());
  });
  
  // Get maximum width for each column
  const columnWidths = processedLines[0].map((_, colIndex) => {
    return Math.max(...processedLines.map(row => row[colIndex].length));
  });
  
  // Format table lines with proper spacing
  const formattedLines = processedLines.map((row, rowIndex) => {
    const formattedRow = row.map((cell, colIndex) => {
      return cell.padEnd(columnWidths[colIndex], ' ');
    });
    
    return `| ${formattedRow.join(' | ')} |`;
  });
  
  // Add separator line after header
  if (formattedLines.length > 1) {
    const separator = columnWidths.map(width => '-'.repeat(width));
    formattedLines.splice(1, 0, `| ${separator.join(' | ')} |`);
  }
  
  return formattedLines;
};