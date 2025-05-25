import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  
  const getStepNumber = () => {
    switch (location.pathname) {
      case '/':
        return 1;
      case '/customize':
        return 2;
      case '/preview':
        return 3;
      default:
        return 0;
    }
  };

  const stepNumber = getStepNumber();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        <Link to="/" className="flex items-center mb-4 md:mb-0">
          <FileText className="h-8 w-8 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-800">Campaign Report Generator</h1>
        </Link>
        
        {stepNumber > 0 && (
          <div className="w-full md:w-auto">
            <div className="flex items-center justify-between max-w-md mx-auto md:mx-0">
              <div className={`flex flex-col items-center ${stepNumber >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stepNumber >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  1
                </div>
                <span className="text-xs mt-1">Import</span>
              </div>
              
              <div className={`w-16 h-0.5 ${stepNumber >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              
              <div className={`flex flex-col items-center ${stepNumber >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stepNumber >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <span className="text-xs mt-1">Customize</span>
              </div>
              
              <div className={`w-16 h-0.5 ${stepNumber >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              
              <div className={`flex flex-col items-center ${stepNumber >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stepNumber >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
                <span className="text-xs mt-1">Export</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;