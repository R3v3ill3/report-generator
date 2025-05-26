import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, AlignmentType, TableOfContents, LevelFormat, convertInchesToTwip } from 'docx';
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
      children.push(...getExecutiveSummarySection(campaignData.executiveSummary));
    }
    
    // Report Content
    children.push(...getReportContent(campaignData, reportType));
    
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

const getExecutiveSummarySection = (executiveSummary: string) => {
  return [
    new Paragraph({
      text: 'Executive Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: executiveSummary,
          ...STYLES.normalText,
        }),
      ],
      spacing: { after: 400 },
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
        new Paragraph({
          children: [
            new TextRun({
              text: campaignData.step1Analysis,
              ...STYLES.normalText,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }
    
    if (campaignData.messagingGuide) {
      sections.push(
        new Paragraph({
          text: 'Messaging Guide',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: campaignData.messagingGuide,
              ...STYLES.normalText,
            }),
          ],
          spacing: { after: 400 },
        })
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
        new Paragraph({
          children: [
            new TextRun({
              text: campaignData.actionPlan,
              ...STYLES.normalText,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }
  }
  
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