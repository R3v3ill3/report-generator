import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCampaign } from '../contexts/CampaignContext';
import { parseImportedFile } from '../utils/fileParser';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCampaignData } = useCampaign();
  const [isDragging, setIsDragging] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      setIsLoading(false);
      return;
    }

    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          const parsedData = await parseImportedFile(result);
          
          if (parsedData) {
            setCampaignData(parsedData);
            setFileUploaded(true);
            setUploadedFileName(file.name);
            toast.success('File successfully imported');
          } else {
            toast.error('Invalid file format. Please check the file structure.');
          }
        } catch (error) {
          console.error('Error parsing file:', error);
          toast.error('Failed to parse the file. Please check the file format.');
        } finally {
          setIsLoading(false);
        }
      };

      fileReader.onerror = () => {
        toast.error('Error reading file');
        setIsLoading(false);
      };

      fileReader.readAsText(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      toast.error('An error occurred while processing the file');
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/customize');
  };

  const handleStartOver = () => {
    setFileUploaded(false);
    setUploadedFileName('');
    setCampaignData(null);
  };

  const renderUploadUI = () => {
    if (fileUploaded) {
      return (
        <div className="text-center p-6">
          <div className="mb-4 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">File Successfully Imported</h3>
          <p className="text-gray-600 mb-4">{uploadedFileName}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleContinue}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue to Customization
            </button>
            <button
              onClick={handleStartOver}
              className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Import Different File
            </button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`border-2 border-dashed rounded-lg p-10 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleFileDrop}
      >
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
        </h3>
        <p className="text-gray-600 mb-4">or</p>
        <label className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
          Browse Files
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileInput}
            disabled={isLoading}
          />
        </label>
        <p className="mt-4 text-sm text-gray-500">
          Supports JSON files exported from Praxis campaign system
        </p>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">Campaign Report Generator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Import your campaign messaging guide and action plan to generate professionally styled reports with executive summaries in Word and PDF formats.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4">Import Campaign Data</h2>
          
          {isLoading ? (
            <div className="text-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your file...</p>
            </div>
          ) : (
            renderUploadUI()
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">About This Tool</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800">What does this tool do?</h3>
              <p className="text-gray-600">
                This standalone application allows you to import campaign messaging guides and action plans from the Praxis system, customize them with your organization's branding, and export them as professional reports.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Supported File Formats</h3>
              <p className="text-gray-600">
                Currently, we support JSON files exported from the Praxis campaign system. The file should contain messaging guide and/or action plan data.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Report Options</h3>
              <p className="text-gray-600">
                You can generate a combined report with both messaging guide and action plan, or create individual reports for each component. All reports include an AI-generated executive summary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;