import { CampaignData, ReportOptions } from '../contexts/CampaignContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatFullReport } from './reportFormatter';

export const generatePdf = async (
  campaignData: CampaignData,
  reportOptions: ReportOptions,
  reportType: 'combined' | 'messaging' | 'action'
): Promise<void> => {
  try {
    console.log(`Generating ${reportType} PDF report for campaign:`, campaignData.id);
    
    // Format the report content first
    const formattedReport = await formatFullReport(campaignData);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Track sections and their pages
    const sections: { title: string; page: number }[] = [];
    let currentPage = 1;
    let yPos = margin;
    
    // Add logo if available
    if (reportOptions.logoDataUrl) {
      doc.addImage(reportOptions.logoDataUrl, 'PNG', margin, yPos, 40, 20);
      yPos += 30;
    }
    
    // Add title
    doc.setFontSize(24);
    doc.setTextColor(43, 87, 151); // Blue color
    doc.text(formattedReport.title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    
    // Add organization info
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51); // Dark gray
    const { contactDetails } = reportOptions;
    doc.text(contactDetails.organizationName, margin, yPos);
    yPos += 7;
    if (contactDetails.contactPerson) {
      doc.text(contactDetails.contactPerson, margin, yPos);
      yPos += 7;
    }
    if (contactDetails.email) {
      doc.text(contactDetails.email, margin, yPos);
      yPos += 7;
    }
    if (contactDetails.phone) {
      doc.text(contactDetails.phone, margin, yPos);
      yPos += 7;
    }
    if (contactDetails.website) {
      doc.text(contactDetails.website, margin, yPos);
      yPos += 15;
    }
    
    // Store TOC position
    const tocStartY = yPos;
    doc.setFontSize(16);
    doc.setTextColor(43, 87, 151);
    doc.text('Table of Contents', margin, yPos);
    yPos += 15;
    
    // Process each section
    for (const section of formattedReport.sections) {
      // Skip sections not relevant to the report type
      if (!shouldIncludeSection(section.title, reportType)) continue;
      
      // Check if we need a new page
      if (yPos > pageHeight - 50) {
        doc.addPage();
        currentPage++;
        yPos = margin;
      }
      
      // Track section start page
      sections.push({
        title: section.title,
        page: currentPage
      });
      
      // Add section title
      doc.setFontSize(16);
      doc.setTextColor(43, 87, 151);
      doc.text(section.title, margin, yPos);
      yPos += 10;
      
      // Process section content
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      
      const contentParts = section.content.split(/\[TABLE:([^\]]+)\]/);
      for (let i = 0; i < contentParts.length; i++) {
        if (i % 2 === 0) {
          // Regular content
          if (contentParts[i].trim()) {
            const paragraphs = contentParts[i].trim().split('\n\n');
            for (const paragraph of paragraphs) {
              const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);
              for (const line of lines) {
                if (yPos > pageHeight - 20) {
                  doc.addPage();
                  currentPage++;
                  yPos = margin;
                }
                doc.text(line, margin, yPos);
                yPos += 7;
              }
              yPos += 5; // Paragraph spacing
            }
          }
        } else {
          // Table reference
          const tableId = contentParts[i];
          const tableData = formattedReport.tables.get(tableId);
          if (tableData) {
            if (yPos > pageHeight - 50) {
              doc.addPage();
              currentPage++;
              yPos = margin;
            }
            
            (doc as any).autoTable({
              head: [tableData.headers],
              body: tableData.rows,
              startY: yPos,
              margin: { left: margin },
              styles: { fontSize: 10 },
              headStyles: { fillColor: [43, 87, 151] }
            });
            
            yPos = (doc as any).lastAutoTable.finalY + 10;
          }
        }
      }
    }
    
    // Go back to first page and add TOC
    doc.setPage(1);
    yPos = tocStartY + 15;
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    
    sections.forEach((section) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(section.title, margin, yPos);
      doc.text(section.page.toString(), pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
    });
    
    // Save the PDF
    const filename = getReportFilename(campaignData, reportType);
    doc.save(filename);
    
    console.log(`PDF report "${filename}" generated successfully`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
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
      return `${baseFilename}_combined_report.pdf`;
    case 'messaging':
      return `${baseFilename}_messaging_guide.pdf`;
    case 'action':
      return `${baseFilename}_action_plan.pdf`;
  }
};

const sanitizeFilename = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/gi, '_')
    .substring(0, 50);
};