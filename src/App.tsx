import React, { useState, useEffect } from 'react';
import { Camera, Grid, List, Search, Cast, Download, Share, Heart, Info, Folder } from 'lucide-react';
import PhotoGrid from './components/PhotoGrid';
import PhotoViewer from './components/PhotoViewer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

interface Photo {
  id: number;
  name: string;
  url: string;
  thumbnail: string;
  size: number;
  modified: string;
}

interface DirectoryInfo {
  directory: string;
  totalFiles: number;
  imageFiles: number;
  lastModified: string;
}

function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directoryInfo, setDirectoryInfo] = useState<DirectoryInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load photos from server
  useEffect(() => {
    loadPhotos();
    loadDirectoryInfo();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/photos');
      if (!response.ok) {
        throw new Error('Failed to load photos');
      }
      const photoData = await response.json();
      setPhotos(photoData);
      setError(null);
    } catch (err) {
      setError('Unable to connect to photo server. Make sure the server is running on port 3001.');
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDirectoryInfo = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/info');
      if (response.ok) {
        const info = await response.json();
        setDirectoryInfo(info);
      }
    } catch (err) {
      console.error('Error loading directory info:', err);
    }
  };

  // Filter photos based on search
  const filteredPhotos = photos.filter(photo =>
    photo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Screen casting functionality
  const handleScreenCast = async () => {
    try {
      if ('presentation' in navigator && 'PresentationRequest' in window) {
        // Use Presentation API for Chromecast-like functionality
        const presentationRequest = new (window as any).PresentationRequest([window.location.origin]);
        const connection = await presentationRequest.start();
        console.log('Started presentation:', connection);
      } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // Fallback to screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        console.log('Screen sharing started:', stream);
      } else {
        alert('Screen casting is not supported in this browser');
      }
    } catch (err) {
      console.error('Error starting screen cast:', err);
      alert('Unable to start screen casting');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onScreenCast={handleScreenCast}
        onRefresh={loadPhotos}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          directoryInfo={directoryInfo}
          photosCount={filteredPhotos.length}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading photos...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="text-red-800 font-medium">Server Connection Error</h3>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
                <div className="mt-4 p-4 bg-red-100 rounded border text-sm text-red-800">
                  <p className="font-medium">To set up the photo server:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Open a terminal in this project directory</li>
                    <li>Run: <code className="bg-red-200 px-1 rounded">node server.js</code></li>
                    <li>The server will start on http://localhost:3001</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms' : 'Add some photos to your directory to get started'}
                    </p>
                  </div>
                ) : (
                  <PhotoGrid
                    photos={filteredPhotos}
                    viewMode={viewMode}
                    onPhotoClick={setSelectedPhoto}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onNext={() => {
            const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
            const nextIndex = (currentIndex + 1) % filteredPhotos.length;
            setSelectedPhoto(filteredPhotos[nextIndex]);
          }}
          onPrevious={() => {
            const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
            const prevIndex = currentIndex === 0 ? filteredPhotos.length - 1 : currentIndex - 1;
            setSelectedPhoto(filteredPhotos[prevIndex]);
          }}
        />
      )}
    </div>
  );
}

export default App;