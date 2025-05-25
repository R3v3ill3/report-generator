import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCampaign } from '../contexts/CampaignContext';
import { generateExecutiveSummary } from '../services/openaiService';

const ReportCustomizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { campaignData, updateCampaignData, setReportOptions } = useCampaign();
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [contactDetails, setContactDetails] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: ''
  });
  const [reportType, setReportType] = useState<'combined' | 'separate'>('combined');
  const [isGeneratingExecutiveSummary, setIsGeneratingExecutiveSummary] = useState(false);
  const [executiveSummaryGenerated, setExecutiveSummaryGenerated] = useState(false);

  useEffect(() => {
    if (!campaignData) {
      navigate('/');
      toast.error('Please import campaign data first');
    }
  }, [campaignData, navigate]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateExecutiveSummary = async () => {
    if (!campaignData) {
      toast.error('No campaign data available');
      return;
    }

    setIsGeneratingExecutiveSummary(true);
    try {
      const executiveSummary = await generateExecutiveSummary(campaignData);
      
      if (executiveSummary) {
        updateCampaignData({ executiveSummary });
        setExecutiveSummaryGenerated(true);
        toast.success('Executive summary generated successfully');
      } else {
        toast.error('Failed to generate executive summary');
      }
    } catch (error) {
      console.error('Error generating executive summary:', error);
      toast.error('Failed to generate executive summary');
    } finally {
      setIsGeneratingExecutiveSummary(false);
    }
  };

  const handleContinue = () => {
    if (!contactDetails.organizationName) {
      toast.error('Please enter your organization name');
      return;
    }

    const logoDataUrl = logoPreview;
    
    setReportOptions({
      reportType,
      logoDataUrl,
      contactDetails
    });
    
    navigate('/preview');
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Customize Your Report</h1>
          <p className="text-gray-600">
            Add your organization's branding and details to personalize your report.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Organization Logo</h2>
            
            {!logoPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-3">Upload your organization's logo</p>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer inline-block">
                  Select Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  Recommended: PNG or JPEG, 300x100 pixels or larger
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Uploaded Logo</h3>
                  <button 
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={logoPreview} 
                    alt="Organization Logo" 
                    className="max-h-28 object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={contactDetails.organizationName}
                  onChange={handleContactChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={contactDetails.contactPerson}
                  onChange={handleContactChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactDetails.email}
                    onChange={handleContactChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={contactDetails.phone}
                    onChange={handleContactChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={contactDetails.website}
                  onChange={handleContactChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Report Options</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Report Type</h3>
                <div className="flex flex-col space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="combined"
                      checked={reportType === 'combined'}
                      onChange={() => setReportType('combined')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">Combined Report (Messaging Guide & Action Plan)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="separate"
                      checked={reportType === 'separate'}
                      onChange={() => setReportType('separate')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">Separate Reports (Individual Messaging Guide & Action Plan)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Executive Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {executiveSummaryGenerated ? (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Executive summary generated</p>
                        <p className="mt-1 text-sm text-gray-600">
                          The AI-generated executive summary will be included in your report.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Generate an executive summary</p>
                        <p className="mt-1 text-sm text-gray-600">
                          Our AI will analyze your campaign data and generate a professional executive summary.
                        </p>
                        <button
                          onClick={handleGenerateExecutiveSummary}
                          disabled={isGeneratingExecutiveSummary}
                          className={`mt-3 px-4 py-2 text-sm rounded-md ${
                            isGeneratingExecutiveSummary
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isGeneratingExecutiveSummary ? (
                            <>
                              <span className="inline-block mr-2 animate-spin">⟳</span>
                              Generating...
                            </>
                          ) : (
                            'Generate Executive Summary'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue to Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCustomizationPage;