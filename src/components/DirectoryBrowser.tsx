import React from 'react';
import { Folder, Image, ChevronRight, ArrowLeft } from 'lucide-react';

interface Directory {
  name: string;
  path: string;
  mediaCount: number;
  subdirectoryCount: number;
  lastModified: string;
}

interface DirectoryBrowserProps {
  directories: Directory[];
  currentPath: string;
  onDirectoryClick: (path: string) => void;
  onBackClick: () => void;
  loading: boolean;
}

const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({
  directories,
  currentPath,
  onDirectoryClick,
  onBackClick,
  loading
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading directories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb and back button */}
      {currentPath && (
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={onBackClick}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">{currentPath}</span>
        </div>
      )}

      {/* Directory listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {directories.map((directory) => (
          <div
            key={directory.path}
            onClick={() => onDirectoryClick(directory.path)}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Folder className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{directory.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(directory.lastModified)}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Image className="h-4 w-4" />
                  <span>{directory.mediaCount} photos</span>
                </div>
                {directory.subdirectoryCount > 0 && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Folder className="h-4 w-4" />
                    <span>{directory.subdirectoryCount} folders</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar for media count */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (directory.mediaCount / 100) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {directories.length === 0 && (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subdirectories found</h3>
          <p className="text-gray-500">This directory doesn't contain any subdirectories</p>
        </div>
      )}
    </div>
  );
};

export default DirectoryBrowser;