import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, AlignmentType, TableOfContents } from 'docx';
import { CampaignData, ReportOptions } from '../contexts/CampaignContext';
import { formatFullReport } from './reportFormatter';

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
    
    // Format the report content first
    const formattedReport = await formatFullReport(campaignData);
    
    // Initialize document sections
    const children: any[] = [];
    const sections: { title: string; startPage: number }[] = [];
    let currentPage = 1;
    
    // Add title
    children.push(
      new Paragraph({
        text: formattedReport.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
    
    // Add organization info
    children.push(...getOrganizationInfoParagraphs(reportOptions.contactDetails));
    
    // Add table of contents placeholder
    const tocStart = children.length;
    children.push(
      new Paragraph({
        text: "Table of Contents",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    
    // Process each section
    for (const section of formattedReport.sections) {
      // Skip sections not relevant to the report type
      if (!shouldIncludeSection(section.title, reportType)) continue;
      
      // Track section start page
      sections.push({
        title: section.title,
        startPage: currentPage
      });
      
      // Add section title
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      
      // Process section content
      const contentParts = section.content.split(/\[TABLE:([^\]]+)\]/);
      for (let i = 0; i < contentParts.length; i++) {
        if (i % 2 === 0) {
          // Regular content
          if (contentParts[i].trim()) {
            const paragraphs = contentParts[i].trim().split('\n\n');
            for (const paragraph of paragraphs) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: paragraph.trim(),
                      ...STYLES.normalText,
                    }),
                  ],
                  spacing: { after: 200 },
                })
              );
            }
          }
        } else {
          // Table reference
          const tableId = contentParts[i];
          const tableData = formattedReport.tables.get(tableId);
          if (tableData) {
            children.push(createTable(tableData.headers, tableData.rows));
            children.push(
              new Paragraph({
                spacing: { after: 200 },
              })
            );
          }
        }
        
        // Update current page based on content
        currentPage = Math.ceil(children.length / 40) + 1; // Approximate 40 elements per page
      }
    }
    
    // Generate table of contents
    const toc = new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
      stylesWithLevels: sections.map((section, index) => ({
        level: 0,
        styleId: `Heading${index + 1}`,
        pageNumber: section.startPage
      })),
    });
    
    // Insert TOC after placeholder
    children.splice(tocStart + 1, 0, toc);
    
    // Create the document
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

const createTable = (headers: string[], rows: string[][]) => {
  return new Table({
    width: {
      size: 100,
      type: "pct",
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
    rows: [
      new TableRow({
        children: headers.map(header => 
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: header, bold: true })],
            })],
            shading: {
              fill: "2B5797",
              color: "FFFFFF",
            },
          })
        ),
      }),
      ...rows.map(row => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: cell })],
              })],
            })
          ),
        })
      ),
    ],
  });
};

const shouldIncludeSection = (sectionTitle: string, reportType: string): boolean => {
  switch (reportType) {
    case 'combined':
      return true;
    case 'messaging':
      return ['Executive Summary', 'Strategic Analysis', 'Messaging Guide'].includes(sectionTitle);
    case 'action':
      return ['Executive Summary', 'Action Plan'].includes(sectionTitle);
    default:
      return false;
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