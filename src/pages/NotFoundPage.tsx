import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-md mx-auto text-center">
        <FileQuestion className="h-20 w-20 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/"
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;