import React from 'react';
import { Calendar, FileImage, Play } from 'lucide-react';

interface Photo {
  id: number;
  name: string;
  url: string;
  thumbnail: string;
  size: number;
  modified: string;
  type?: string;
}

interface PhotoGridProps {
  photos: Photo[];
  viewMode: 'grid' | 'list';
  onPhotoClick: (photo: Photo) => void;
  serverUrl: string;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, viewMode, onPhotoClick, serverUrl }) => {
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImageUrl = (photo: Photo) => {
    // If serverUrl is empty (GitHub Pages), use the direct URL
    if (!serverUrl) return photo.thumbnail;
    return `${serverUrl}${photo.thumbnail}`;
  };

  const isVideo = (photo: Photo) => {
    return photo.type === 'video' || 
           photo.name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/);
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => onPhotoClick(photo)}
            className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
          >
            <div className="flex-shrink-0 relative">
              <img
                src={getImageUrl(photo)}
                alt={photo.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <FileImage className="h-6 w-6 text-gray-400" />
              </div>
              {isVideo(photo) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{photo.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatFileSize(photo.size)}</span>
                {isVideo(photo) && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Video</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(photo.modified)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          onClick={() => onPhotoClick(photo)}
          className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
        >
          <img
            src={getImageUrl(photo)}
            alt={photo.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full flex items-center justify-center">
            <FileImage className="h-8 w-8 text-gray-400" />
          </div>
          
          {/* Video indicator */}
          {isVideo(photo) && (
            <div className="absolute top-2 right-2">
              <div className="bg-black bg-opacity-60 rounded-full p-1.5">
                <Play className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-sm font-medium truncate">{photo.name}</p>
            <div className="flex items-center justify-between">
              <p className="text-white/80 text-xs">{formatFileSize(photo.size)}</p>
              {isVideo(photo) && (
                <span className="text-white/80 text-xs bg-blue-600 px-1.5 py-0.5 rounded">Video</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;