import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, AlignmentType, TableOfContents, convertInchesToTwip } from 'docx';
import { CampaignData, ReportOptions } from '../contexts/CampaignContext';

const STYLES = {
  heading1: {
    size: 32,
    bold: true,
    color: "2B5797",
  },
  heading2: {
    size: 28,
    bold: true,
    color: "2B5797",
  },
  heading3: {
    size: 24,
    bold: true,
    color: "2B5797",
  },
  normalText: {
    size: 24,
    color: "333333",
  },
  table: {
    width: { size: 100, type: "pct" },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  },
};

export const generateDocx = async (
  campaignData: CampaignData,
  reportOptions: ReportOptions,
  reportType: 'combined' | 'messaging' | 'action'
): Promise<void> => {
  try {
    console.log(`Generating ${reportType} DOCX report for campaign:`, campaignData.id);
    
    const children = [
      // Title
      new Paragraph({
        text: getReportTitle(reportType),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      
      // Organization Info
      ...getOrganizationInfoParagraphs(reportOptions.contactDetails),
      
      // Table of Contents
      new Paragraph({
        text: "Table of Contents",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
        stylesWithLevels: [
          { level: 0, styleId: "Heading1" },
          { level: 1, styleId: "Heading2" },
          { level: 2, styleId: "Heading3" },
        ],
      }),
      new Paragraph({
        children: [new TextRun({ break: 2 })],
      }),
    ];
    
    // Executive Summary
    if (campaignData.executiveSummary) {
      children.push(...parseAndFormatSection('Executive Summary', campaignData.executiveSummary));
    }
    
    // Report Content
    if (reportType === 'combined' || reportType === 'messaging') {
      if (campaignData.step1Analysis) {
        children.push(...parseAndFormatSection('Strategic Analysis', campaignData.step1Analysis));
      }
      if (campaignData.messagingGuide) {
        children.push(...parseAndFormatSection('Messaging Guide', campaignData.messagingGuide));
      }
    }
    
    if (reportType === 'combined' || reportType === 'action') {
      if (campaignData.actionPlan) {
        children.push(...parseAndFormatSection('Action Plan', campaignData.actionPlan));
      }
    }
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });
    
    // Generate and save the document
    const buffer = await Packer.toBlob(doc);
    const filename = getReportFilename(campaignData, reportType);
    
    // Create download link
    const url = window.URL.createObjectURL(buffer);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`DOCX report "${filename}" generated successfully`);
  } catch (error) {
    console.error('Error generating DOCX report:', error);
    throw new Error('Failed to generate DOCX report');
  }
};

const parseAndFormatSection = (title: string, content: string): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];
  const lines = content.split('\n');
  let currentTable: string[][] = [];
  let inTable = false;
  
  // Add section title
  elements.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Handle table lines
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      // Process table row
      const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
      if (cells.length > 0) {
        currentTable.push(cells);
      }
      continue;
    }
    
    // Handle end of table
    if (inTable && (!line.startsWith('|') || !line.endsWith('|'))) {
      inTable = false;
      if (currentTable.length > 0) {
        elements.push(createTable(currentTable));
        currentTable = [];
      }
    }
    
    // Handle headings
    if (line.match(/^#{1,6}\s/)) {
      const level = line.match(/^(#{1,6})\s/)?.[1].length || 1;
      const text = line.replace(/^#{1,6}\s/, '');
      elements.push(
        new Paragraph({
          text,
          heading: level as HeadingLevel,
          spacing: { before: 300, after: 150 },
        })
      );
      continue;
    }
    
    // Handle regular paragraphs
    if (line !== '') {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              ...STYLES.normalText,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }
  
  // Handle any remaining table
  if (currentTable.length > 0) {
    elements.push(createTable(currentTable));
  }
  
  return elements;
};

const createTable = (tableData: string[][]): Table => {
  // Remove separator row if present
  const rows = tableData.filter(row => !row.every(cell => /^[-:]+$/.test(cell)));
  
  return new Table({
    width: {
      size: 100,
      type: "pct",
    },
    rows: rows.map((rowData, rowIndex) => {
      return new TableRow({
        children: rowData.map(cellText => {
          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    bold: rowIndex === 0, // Bold headers
                    ...STYLES.normalText,
                  }),
                ],
              }),
            ],
          });
        }),
      });
    }),
  });
};

const getOrganizationInfoParagraphs = (contactDetails: ReportOptions['contactDetails']) => {
  const paragraphs = [];
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactDetails.organizationName,
          ...STYLES.heading2,
        }),
      ],
      spacing: { after: 200 },
    })
  );
  
  if (contactDetails.contactPerson) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactDetails.contactPerson,
            ...STYLES.normalText,
          }),
        ],
      })
    );
  }
  
  if (contactDetails.email) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactDetails.email,
            ...STYLES.normalText,
          }),
        ],
      })
    );
  }
  
  if (contactDetails.phone) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactDetails.phone,
            ...STYLES.normalText,
          }),
        ],
      })
    );
  }
  
  if (contactDetails.website) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactDetails.website,
            ...STYLES.normalText,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }
  
  return paragraphs;
};

const getReportTitle = (reportType: 'combined' | 'messaging' | 'action'): string => {
  switch (reportType) {
    case 'combined':
      return 'Campaign Report';
    case 'messaging':
      return 'Campaign Messaging Guide';
    case 'action':
      return 'Campaign Action Plan';
  }
};

const getReportFilename = (campaignData: CampaignData, reportType: 'combined' | 'messaging' | 'action'): string => {
  const baseFilename = sanitizeFilename(campaignData.summary?.purpose || 'campaign');
  switch (reportType) {
    case 'combined':
      return `${baseFilename}_combined_report.docx`;
    case 'messaging':
      return `${baseFilename}_messaging_guide.docx`;
    case 'action':
      return `${baseFilename}_action_plan.docx`;
  }
};

const sanitizeFilename = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/gi, '_')
    .substring(0, 50);
};