import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share, RotateCw, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

interface Photo {
  id: number;
  name: string;
  url: string;
  thumbnail: string;
  size: number;
  modified: string;
  type?: string;
}

interface PhotoViewerProps {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  serverUrl: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ photo, onClose, onNext, onPrevious, serverUrl }) => {
  const [rotation, setRotation] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const isVideo = () => {
    return photo.type === 'video' || 
           photo.name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/);
  };

  const getMediaUrl = () => {
    if (!serverUrl) return photo.url;
    return `${serverUrl}${photo.url}`;
  };

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
        case ' ':
          e.preventDefault();
          if (isVideo() && videoRef.current) {
            if (isPlaying) {
              videoRef.current.pause();
            } else {
              videoRef.current.play();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose, onNext, onPrevious, isPlaying]);

  useEffect(() => {
    // Reset zoom and rotation when photo changes
    setZoom(1);
    setRotation(0);
    setIsPlaying(false);
  }, [photo.id]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getMediaUrl();
    link.download = photo.name;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.name,
          text: `Check out this ${isVideo() ? 'video' : 'photo'}: ${photo.name}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert(`${isVideo() ? 'Video' : 'Photo'} URL copied to clipboard!`);
    }
  };

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
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
          <h2 className="text-white text-lg font-medium truncate flex items-center space-x-2">
            <span>{photo.name}</span>
            {isVideo() && <span className="text-xs bg-blue-600 px-2 py-1 rounded">Video</span>}
          </h2>
          <p className="text-white/70 text-sm">
            {formatFileSize(photo.size)} • {formatDate(photo.modified)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isVideo() && (
            <>
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
            </>
          )}

          {isVideo() && (
            <button
              onClick={handleVideoPlayPause}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}
          
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

      {/* Media container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          title="Previous media"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="max-w-full max-h-full flex items-center justify-center">
          {isVideo() ? (
            <video
              ref={videoRef}
              src={getMediaUrl()}
              className="max-w-full max-h-full object-contain"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => {
                // Auto-play on load (optional)
                // videoRef.current?.play();
              }}
            />
          ) : (
            <img
              src={getMediaUrl()}
              alt={photo.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                cursor: zoom > 1 ? 'grab' : 'default'
              }}
              draggable={false}
            />
          )}
        </div>

        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          title="Next media"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Footer with controls */}
      <div className="p-4 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="flex items-center space-x-4 text-white/70 text-sm">
          {!isVideo() && (
            <>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <span>•</span>
            </>
          )}
          <span>Use arrow keys to navigate</span>
          <span>•</span>
          {isVideo() ? (
            <span>Press SPACE to play/pause</span>
          ) : (
            <span>Use mouse wheel to zoom</span>
          )}
          <span>•</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default PhotoViewer;