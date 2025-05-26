import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, DownloadCloud, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCampaign } from '../contexts/CampaignContext';
import { generateDocx } from '../services/docxGenerator';
import { generatePdf } from '../services/pdfGenerator';
import { formatFullReport } from '../services/reportFormatter';

const ReportPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { campaignData, reportOptions } = useCampaign();
  
  const [activeTab, setActiveTab] = useState<'combined' | 'messaging' | 'action'>('combined');
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'docx'>('pdf');
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  useEffect(() => {
    if (!campaignData || !reportOptions) {
      navigate('/customize');
      toast.error('Please complete customization first');
      return;
    }
    
    // Determine which tab to show based on report type
    if (reportOptions.reportType === 'combined') {
      setActiveTab('combined');
    } else {
      setActiveTab('messaging');
    }
    
    // Generate preview pages (this would normally fetch from a render service)
    generatePreviewPages();
  }, [campaignData, reportOptions, navigate]);
  
  const generatePreviewPages = () => {
    // This is a placeholder. In a real implementation, you would generate actual preview
    // images of the report pages or use a PDF preview library.
    
    // For this example, we'll create mock preview pages
    const mockPages = [
      'page1', 'page2', 'page3', 'page4'
    ];
    
    setPreviewPages(mockPages);
  };
  
  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    setExportType(format);
    
    try {
      const reportTitle = getReportTitle();
      
      // Format the report content using OpenAI
      const formattedCampaignData = await formatFullReport(campaignData!);
      
      if (format === 'pdf') {
        await generatePdf(
          formattedCampaignData, 
          reportOptions!, 
          activeTab === 'combined' ? 'combined' : activeTab === 'messaging' ? 'messaging' : 'action'
        );
      } else {
        await generateDocx(
          formattedCampaignData, 
          reportOptions!, 
          activeTab === 'combined' ? 'combined' : activeTab === 'messaging' ? 'messaging' : 'action'
        );
      }
      
      toast.success(`${reportTitle} exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  const getReportTitle = () => {
    if (activeTab === 'combined') {
      return 'Combined Campaign Report';
    } else if (activeTab === 'messaging') {
      return 'Campaign Messaging Guide';
    } else {
      return 'Campaign Action Plan';
    }
  };
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(previewPages.length - 1, prev + 1));
  };
  
  const renderPreview = () => {
    if (previewPages.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating preview...</p>
          </div>
        </div>
      );
    }
    
    // In a real implementation, this would show actual rendered pages
    return (
      <div className="relative">
        <div className="bg-white rounded-lg shadow-lg p-8 min-h-[600px] border border-gray-200">
          <div className="text-center">
            {activeTab === 'combined' && (
              <h1 className="text-2xl font-bold mb-6">Combined Campaign Report</h1>
            )}
            {activeTab === 'messaging' && (
              <h1 className="text-2xl font-bold mb-6">Campaign Messaging Guide</h1>
            )}
            {activeTab === 'action' && (
              <h1 className="text-2xl font-bold mb-6">Campaign Action Plan</h1>
            )}
            
            {reportOptions?.logoDataUrl && (
              <div className="mb-6">
                <img 
                  src={reportOptions.logoDataUrl} 
                  alt="Organization Logo" 
                  className="h-16 mx-auto object-contain" 
                />
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{reportOptions?.contactDetails.organizationName}</h2>
              {reportOptions?.contactDetails.contactPerson && (
                <p className="text-gray-600">{reportOptions.contactDetails.contactPerson}</p>
              )}
            </div>
            
            {campaignData?.executiveSummary && currentPage === 0 && (
              <div className="bg-gray-50 p-6 rounded-md mb-6 text-left">
                <h2 className="text-xl font-semibold mb-3">Executive Summary</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {campaignData.executiveSummary.slice(0, 200)}...
                </p>
              </div>
            )}
            
            <div className="text-left space-y-4">
              <h2 className="text-lg font-semibold">Preview of Page {currentPage + 1}</h2>
              <p className="text-gray-600">
                This is a preview of your report. Export as PDF or Word to see the full document.
              </p>
              
              {activeTab === 'combined' && (
                <>
                  {currentPage === 0 && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-medium text-blue-800">Campaign Overview</h3>
                      <p className="text-gray-700">
                        Campaign details and context overview...
                      </p>
                    </div>
                  )}
                  {currentPage === 1 && (
                    <div className="bg-green-50 p-4 rounded-md">
                      <h3 className="font-medium text-green-800">Messaging Guide Highlights</h3>
                      <p className="text-gray-700">
                        Key messaging elements and strategies...
                      </p>
                    </div>
                  )}
                  {currentPage >= 2 && (
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h3 className="font-medium text-purple-800">Action Plan Breakdown</h3>
                      <p className="text-gray-700">
                        Tactical steps and implementation timeline...
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'messaging' && (
                <div className="bg-green-50 p-4 rounded-md">
                  <h3 className="font-medium text-green-800">Messaging Framework</h3>
                  <p className="text-gray-700">
                    Detailed messaging strategy and key points...
                  </p>
                </div>
              )}
              
              {activeTab === 'action' && (
                <div className="bg-purple-50 p-4 rounded-md">
                  <h3 className="font-medium text-purple-800">Campaign Timeline</h3>
                  <p className="text-gray-700">
                    Week-by-week action items and responsibilities...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          <button 
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className={`p-2 rounded-full ${
              currentPage === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {previewPages.length}
          </span>
          <button 
            onClick={handleNextPage}
            disabled={currentPage === previewPages.length - 1}
            className={`p-2 rounded-full ${
              currentPage === previewPages.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Preview & Export</h1>
          <p className="text-gray-600">
            Preview your report and export it in your preferred format.
          </p>
        </div>
        
        {reportOptions?.reportType === 'separate' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('messaging')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'messaging'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Messaging Guide
              </button>
              <button
                onClick={() => setActiveTab('action')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'action'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Action Plan
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Report Preview</h2>
            {renderPreview()}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Export Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className={`flex items-center justify-center p-4 border rounded-lg ${
                  isExporting && exportType === 'pdf'
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  {isExporting && exportType === 'pdf' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  ) : (
                    <DownloadCloud className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  )}
                  <span className="block font-medium">Export as PDF</span>
                  <span className="text-sm text-gray-500">Best for viewing and sharing</span>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('docx')}
                disabled={isExporting}
                className={`flex items-center justify-center p-4 border rounded-lg ${
                  isExporting && exportType === 'docx'
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  {isExporting && exportType === 'docx' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  ) : (
                    <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  )}
                  <span className="block font-medium">Export as Word</span>
                  <span className="text-sm text-gray-500">Best for editing and customizing</span>
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate('/customize')}
              className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Customization
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start New Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewPage;