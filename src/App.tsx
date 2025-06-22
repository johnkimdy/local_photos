import React, { useState, useEffect } from 'react';
import { Camera, Grid, List, Search, Cast, Info, Folder, ArrowLeft } from 'lucide-react';
import PhotoGrid from './components/PhotoGrid';
import PhotoViewer from './components/PhotoViewer';
import DirectoryBrowser from './components/DirectoryBrowser';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

interface Photo {
  id: number;
  name: string;
  url: string;
  thumbnail: string;
  size: number;
  modified: string;
  directory?: string;
  type?: string;
}

interface Directory {
  name: string;
  path: string;
  mediaCount: number;
  subdirectoryCount: number;
  lastModified: string;
}

interface DirectoryInfo {
  directory: string;
  totalFiles: number;
  imageFiles: number;
  lastModified: string;
}

// Check if we're running on GitHub Pages or locally
const isGitHubPages = window.location.hostname.includes('github.io');
const SERVER_URL = isGitHubPages ? '' : 'http://localhost:3001';

// Demo data for GitHub Pages
const demoPhotos: Photo[] = [
  {
    id: 1,
    name: 'demo-landscape.jpg',
    url: 'https://picsum.photos/1920/1080?random=1',
    thumbnail: 'https://picsum.photos/300/300?random=1',
    size: 2048000,
    modified: new Date().toISOString(),
    directory: 'Landscapes',
    type: 'image'
  },
  {
    id: 2,
    name: 'demo-portrait.jpg',
    url: 'https://picsum.photos/1080/1920?random=2',
    thumbnail: 'https://picsum.photos/300/300?random=2',
    size: 1536000,
    modified: new Date(Date.now() - 86400000).toISOString(),
    directory: 'Portraits',
    type: 'image'
  },
  {
    id: 3,
    name: 'demo-nature.jpg',
    url: 'https://picsum.photos/1920/1080?random=3',
    thumbnail: 'https://picsum.photos/300/300?random=3',
    size: 3072000,
    modified: new Date(Date.now() - 172800000).toISOString(),
    directory: 'Nature',
    type: 'image'
  }
];

const demoDirectories: Directory[] = [
  {
    name: 'Landscapes',
    path: 'Landscapes',
    mediaCount: 45,
    subdirectoryCount: 3,
    lastModified: new Date().toISOString()
  },
  {
    name: 'Portraits',
    path: 'Portraits',
    mediaCount: 23,
    subdirectoryCount: 1,
    lastModified: new Date(Date.now() - 86400000).toISOString()
  },
  {
    name: 'Nature',
    path: 'Nature',
    mediaCount: 67,
    subdirectoryCount: 5,
    lastModified: new Date(Date.now() - 172800000).toISOString()
  }
];

function App() {
  const [mode, setMode] = useState<'directories' | 'photos'>('directories');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directoryInfo, setDirectoryInfo] = useState<DirectoryInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isGitHubPages) {
      // Use demo data for GitHub Pages
      setTimeout(() => {
        setDirectories(demoDirectories);
        setDirectoryInfo({
          directory: 'Demo Gallery',
          totalFiles: 135,
          imageFiles: 135,
          lastModified: new Date().toISOString()
        });
        setLoading(false);
      }, 1000);
    } else {
      loadDirectories('');
      loadStats();
    }
  }, []);

  const loadDirectories = async (path: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const url = path 
        ? `${SERVER_URL}/api/directories/${encodeURIComponent(path)}`
        : `${SERVER_URL}/api/directories`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load directories');
      }
      
      const data = await response.json();
      setDirectories(data.directories || []);
      setCurrentPath(path);
      setMode('directories');
    } catch (err) {
      setError('Unable to connect to photo server. Make sure the server is running on port 3001.');
      console.error('Error loading directories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (directoryPath: string, page: number = 1, limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * limit;
      const response = await fetch(
        `${SERVER_URL}/api/photos/${encodeURIComponent(directoryPath)}?limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load photos');
      }
      
      const data = await response.json();
      
      if (page === 1) {
        setPhotos(data.photos || []);
      } else {
        setPhotos(prev => [...prev, ...(data.photos || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setCurrentPage(page);
      setTotalCount(data.totalCount || 0);
      setCurrentPath(directoryPath);
      setMode('photos');
    } catch (err) {
      setError('Unable to load photos from directory');
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/stats`);
      if (response.ok) {
        const info = await response.json();
        setDirectoryInfo({
          directory: info.directory,
          totalFiles: info.estimatedMediaFiles,
          imageFiles: info.estimatedMediaFiles,
          lastModified: info.lastModified
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleDirectoryClick = (directoryPath: string) => {
    // Check if directory has media files
    const directory = directories.find(d => d.path === directoryPath);
    
    if (directory && directory.mediaCount > 0) {
      // Show choice: view photos or browse subdirectories
      const choice = window.confirm(
        `This directory contains ${directory.mediaCount} photos and ${directory.subdirectoryCount} subdirectories.\n\nClick OK to view photos, or Cancel to browse subdirectories.`
      );
      
      if (choice) {
        // Add current path to history
        setPathHistory(prev => [...prev, currentPath]);
        loadPhotos(directoryPath);
      } else if (directory.subdirectoryCount > 0) {
        setPathHistory(prev => [...prev, currentPath]);
        loadDirectories(directoryPath);
      }
    } else if (directory && directory.subdirectoryCount > 0) {
      // Only subdirectories, navigate there
      setPathHistory(prev => [...prev, currentPath]);
      loadDirectories(directoryPath);
    } else {
      // No media or subdirectories
      alert('This directory appears to be empty or inaccessible.');
    }
  };

  const handleBackClick = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, -1));
      
      if (mode === 'photos') {
        // Go back to directory view
        loadDirectories(previousPath);
      } else {
        // Go back to parent directory
        loadDirectories(previousPath);
      }
    } else {
      // Go to root
      loadDirectories('');
    }
  };

  const loadMorePhotos = () => {
    if (hasMore && !loading) {
      loadPhotos(currentPath, currentPage + 1);
    }
  };

  // Filter photos based on search
  const filteredPhotos = photos.filter(photo =>
    photo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScreenCast = async () => {
    try {
      if ('presentation' in navigator && 'PresentationRequest' in window) {
        const presentationRequest = new (window as any).PresentationRequest([window.location.origin]);
        const connection = await presentationRequest.start();
        console.log('Started presentation:', connection);
      } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
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

  const handleRefresh = () => {
    if (mode === 'directories') {
      loadDirectories(currentPath);
    } else {
      setPhotos([]);
      setCurrentPage(1);
      loadPhotos(currentPath);
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
        onRefresh={handleRefresh}
        showViewToggle={mode === 'photos'}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          directoryInfo={directoryInfo}
          photosCount={mode === 'photos' ? filteredPhotos.length : 0}
          directoriesCount={mode === 'directories' ? directories.length : 0}
          currentMode={mode}
          currentPath={currentPath}
          onClose={() => setSidebarOpen(false)}
          isDemo={isGitHubPages}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {isGitHubPages && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-blue-800 font-medium">Demo Mode</h3>
                </div>
                <p className="text-blue-700 mt-2">
                  This is a demo version with sample data. To use your local photos, 
                  download the project and run it locally with your Node.js server.
                </p>
              </div>
            )}

            {error && !isGitHubPages && (
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

            {/* Mode indicator and navigation */}
            {!loading && !error && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {mode === 'photos' && (
                      <button
                        onClick={handleBackClick}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Directories</span>
                      </button>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Folder className="h-4 w-4" />
                      <span>
                        {currentPath || 'Root'} 
                        {mode === 'photos' && ` • ${totalCount} photos`}
                        {mode === 'directories' && ` • ${directories.length} directories`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === 'directories' && (
              <DirectoryBrowser
                directories={directories}
                currentPath={currentPath}
                onDirectoryClick={handleDirectoryClick}
                onBackClick={handleBackClick}
                loading={loading}
              />
            )}

            {mode === 'photos' && (
              <>
                {filteredPhotos.length === 0 && !loading ? (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms' : 'This directory appears to be empty'}
                    </p>
                  </div>
                ) : (
                  <>
                    <PhotoGrid
                      photos={filteredPhotos}
                      viewMode={viewMode}
                      onPhotoClick={setSelectedPhoto}
                      serverUrl={SERVER_URL}
                    />
                    
                    {hasMore && (
                      <div className="mt-8 text-center">
                        <button
                          onClick={loadMorePhotos}
                          disabled={loading}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading ? 'Loading...' : `Load More Photos (${photos.length} of ${totalCount})`}
                        </button>
                      </div>
                    )}
                  </>
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
          serverUrl={SERVER_URL}
        />
      )}
    </div>
  );
}

export default App;