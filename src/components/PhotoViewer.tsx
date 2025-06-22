import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share, Heart, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface Photo {
  id: number;
  name: string;
  url: string;
  thumbnail: string;
  size: number;
  modified: string;
}

interface PhotoViewerProps {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ photo, onClose, onNext, onPrevious }) => {
  const [rotation, setRotation] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose, onNext, onPrevious]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `http://localhost:3001${photo.url}`;
    link.download = photo.name;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.name,
          text: `Check out this photo: ${photo.name}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Photo URL copied to clipboard!');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <div className="flex-1">
          <h2 className="text-white text-lg font-medium truncate">{photo.name}</h2>
          <p className="text-white/70 text-sm">
            {formatFileSize(photo.size)} • {formatDate(photo.modified)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setRotation((rotation + 90) % 360)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Rotate"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleShare}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Share"
          >
            <Share className="h-5 w-5" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          title="Previous photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="max-w-full max-h-full flex items-center justify-center">
          <img
            src={`http://localhost:3001${photo.url}`}
            alt={photo.name}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom})`,
              cursor: zoom > 1 ? 'grab' : 'default'
            }}
            draggable={false}
          />
        </div>

        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          title="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Footer with controls */}
      <div className="p-4 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="flex items-center space-x-4 text-white/70 text-sm">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>•</span>
          <span>Use arrow keys to navigate</span>
          <span>•</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default PhotoViewer;