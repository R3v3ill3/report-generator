import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType, convertInchesToTwip } from 'docx';
import { CampaignData, ReportOptions } from '../contexts/CampaignContext';

const STYLES = {
  heading1: {
    size: 32,
    bold: true,
    color: "2B5797",
    spacing: { before: 400, after: 200 },
  },
  heading2: {
    size: 28,
    bold: true,
    color: "2B5797",
    spacing: { before: 300, after: 200 },
  },
  heading3: {
    size: 24,
    bold: true,
    color: "2B5797",
    spacing: { before: 200, after: 100 },
  },
  normalText: {
    size: 24,
    color: "333333",
    spacing: { before: 100, after: 100 },
  },
  tableHeader: {
    size: 24,
    bold: true,
    color: "FFFFFF",
  },
  tableCell: {
    size: 24,
    color: "333333",
  },
  tableBorders: {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  },
  table: {
    cell: {
      margins: {
        top: convertInchesToTwip(0.1),
        bottom: convertInchesToTwip(0.1),
        left: convertInchesToTwip(0.1),
        right: convertInchesToTwip(0.1),
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
    },
    header: {
      fill: "2B5797",
      textColor: "FFFFFF",
      bold: true
    }
  }
};

const createTable = (headers: string[], rows: string[][]) => {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(header => 
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: header,
                bold: true,
                color: "FFFFFF",
              })],
            })],
            shading: {
              fill: "2B5797",
            },
            ...STYLES.table.cell
          })
        ),
      }),
      ...rows.map(row => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: cell,
                  size: 20,
                })],
              })],
              ...STYLES.table.cell
            })
          ),
        })
      ),
    ],
  });
};

export const generateDocx = async (
  campaignData: CampaignData,
  reportOptions: ReportOptions,
  reportType: 'combined' | 'messaging' | 'action'
): Promise<void> => {
  try {
    console.log(`Generating ${reportType} DOCX report for campaign:`, campaignData.id);
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Cover Page
          ...getCoverPage(reportType, reportOptions),
          
          // Table of Contents
          ...getTableOfContents(),
          
          // Executive Summary
          ...(campaignData.executiveSummary ? getExecutiveSummarySection(campaignData.executiveSummary) : []),
          
          // Report Content
          ...getReportContent(campaignData, reportType),
        ],
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

const getCoverPage = (reportType: string, reportOptions: ReportOptions) => {
  const elements = [
    new Paragraph({
      text: getReportTitle(reportType),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, before: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: reportOptions.contactDetails.organizationName,
          ...STYLES.heading2,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  ];

  if (reportOptions.contactDetails.contactPerson) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: reportOptions.contactDetails.contactPerson,
            ...STYLES.normalText,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
  }

  // Add date
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          ...STYLES.normalText,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    
    // Page break after cover
    new Paragraph({
      text: "",
      pageBreakBefore: true,
    })
  );

  return elements;
};

const getTableOfContents = () => {
  return [
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    // TOC would be populated by Word automatically
    new Paragraph({
      text: "",
      pageBreakBefore: true,
    }),
  ];
};

const getExecutiveSummarySection = (executiveSummary: string) => {
  const sections = [
    new Paragraph({
      text: 'Executive Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
  ];

  // Split the executive summary into paragraphs
  const paragraphs = executiveSummary.split('\n\n');
  
  paragraphs.forEach(para => {
    if (para.trim().startsWith('|')) {
      // This is a table
      sections.push(...createTableFromMarkdown(para));
    } else if (para.trim().startsWith('#')) {
      // This is a heading
      sections.push(
        new Paragraph({
          text: para.replace(/^#+\s/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else {
      // Regular paragraph
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.trim(),
              ...STYLES.normalText,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  sections.push(
    new Paragraph({
      text: "",
      pageBreakBefore: true,
    })
  );

  return sections;
};

const createTableFromMarkdown = (tableText: string) => {
  const rows = tableText.trim().split('\n');
  const headers = rows[0].split('|').filter(cell => cell.trim()).map(cell => cell.trim());
  
  const table = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: STYLES.tableBorders,
    rows: [
      new TableRow({
        children: headers.map(header => 
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: header,
                ...STYLES.tableHeader,
              })],
            })],
            shading: {
              fill: "2B5797",
            },
          })
        ),
      }),
      ...rows.slice(2).map(row => 
        new TableRow({
          children: row.split('|')
            .filter(cell => cell.trim())
            .map(cell => 
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: cell.trim(),
                    ...STYLES.tableCell,
                  })],
                })],
              })
            ),
        })
      ),
    ],
  });

  return [
    table,
    new Paragraph({
      text: "",
      spacing: { after: 200 },
    }),
  ];
};

const getReportContent = (campaignData: CampaignData, reportType: 'combined' | 'messaging' | 'action') => {
  const sections = [];
  
  if (reportType === 'combined' || reportType === 'messaging') {
    if (campaignData.step1Analysis) {
      sections.push(
        new Paragraph({
          text: 'Strategic Analysis',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        ...formatContentWithHeadings(campaignData.step1Analysis)
      );
    }
    
    if (campaignData.messagingGuide) {
      sections.push(
        new Paragraph({
          text: 'Messaging Guide',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        ...formatContentWithHeadings(campaignData.messagingGuide)
      );
    }
  }
  
  if (reportType === 'combined' || reportType === 'action') {
    if (campaignData.actionPlan) {
      sections.push(
        new Paragraph({
          text: 'Action Plan',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        ...formatContentWithHeadings(campaignData.actionPlan)
      );
    }
  }
  
  return sections;
};

const formatContentWithHeadings = (content: string) => {
  const sections = [];
  const paragraphs = content.split('\n\n');
  
  paragraphs.forEach(para => {
    if (para.trim().startsWith('|')) {
      sections.push(...createTableFromMarkdown(para));
    } else if (para.trim().startsWith('#')) {
      const level = (para.match(/^#+/) || [''])[0].length;
      sections.push(
        new Paragraph({
          text: para.replace(/^#+\s/, ''),
          heading: level === 1 ? HeadingLevel.HEADING_1 : 
                  level === 2 ? HeadingLevel.HEADING_2 : 
                  HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.trim(),
              ...STYLES.normalText,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });
  
  return sections;
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