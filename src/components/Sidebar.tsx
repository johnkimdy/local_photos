import React from 'react';
import { Folder, Image, HardDrive, Clock, X } from 'lucide-react';

interface DirectoryInfo {
  directory: string;
  totalFiles: number;
  imageFiles: number;
  lastModified: string;
}

interface SidebarProps {
  isOpen: boolean;
  directoryInfo: DirectoryInfo | null;
  photosCount: number;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, directoryInfo, photosCount, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Library Info</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Directory Info */}
          {directoryInfo && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Photo Directory</h3>
                  <p className="text-sm text-gray-500 break-all">{directoryInfo.directory}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Image className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Photos</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{photosCount}</p>
                  <p className="text-xs text-gray-500">Currently displayed</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <HardDrive className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Total Files</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">{directoryInfo.totalFiles}</p>
                  <p className="text-xs text-gray-500">In directory</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Last Updated</span>
                  </div>
                  <p className="text-sm text-gray-700">{formatDate(directoryInfo.lastModified)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Setup Instructions</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-medium text-blue-800 mb-2">For your D:\USR\사진 directory:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Edit server.js</li>
                  <li>Change PHOTOS_DIR path</li>
                  <li>Run: node server.js</li>
                  <li>Access via browser</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;