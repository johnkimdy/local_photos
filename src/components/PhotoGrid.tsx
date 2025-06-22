import React from 'react';
import { Calendar, FileImage } from 'lucide-react';

interface Photo {
  id: number;
  name: string;
  url: string;
  thumbnail: string;
  size: number;
  modified: string;
}

interface PhotoGridProps {
  photos: Photo[];
  viewMode: 'grid' | 'list';
  onPhotoClick: (photo: Photo) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, viewMode, onPhotoClick }) => {
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

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => onPhotoClick(photo)}
            className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
          >
            <div className="flex-shrink-0">
              <img
                src={`http://localhost:3001${photo.thumbnail}`}
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
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{photo.name}</h3>
              <p className="text-sm text-gray-500">{formatFileSize(photo.size)}</p>
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
            src={`http://localhost:3001${photo.thumbnail}`}
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
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-sm font-medium truncate">{photo.name}</p>
            <p className="text-white/80 text-xs">{formatFileSize(photo.size)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;