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

// Smart server URL detection
const getServerUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development - use local server
    return 'http://localhost:3001';
  } else if (hostname.includes('github.io') || hostname.includes('netlify.app')) {
    // Deployed version - use your DDNS address
    return 'http://local-photos.ddns.net:3001';
  } else {
    // Fallback for other cases
    return 'http://local-photos.ddns.net:3001';
  }
};

const SERVER_URL = getServerUrl();

// Check if we're using the local or remote server
const isLocalServer = SERVER_URL.includes('localhost');
const isRemoteServer = SERVER_URL.includes('ddns.net');

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
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    console.log('App starting with SERVER_URL:', SERVER_URL);
    checkServerStatus();
    loadDirectories('');
    loadStats();
  }, []);

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      const response = await fetch(`${SERVER_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        setServerStatus('online');
        console.log('Server is online');
      } else {
        setServerStatus('offline');
      }
    } catch (err) {
      console.error('Server check failed:', err);
      setServerStatus('offline');
    }
  };

  const loadDirectories = async (path: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const url = path 
        ? `${SERVER_URL}/api/directories/${encodeURIComponent(path)}`
        : `${SERVER_URL}/api/directories`;
      
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setDirectories(data.directories || []);
      setCurrentPath(path);
      setMode('directories');
    } catch (err) {
      console.error('Error loading directories:', err);
      setError(`Unable to connect to your photo server: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        `${SERVER_URL}/api/photos/${encodeURIComponent(directoryPath)}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
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
      const response = await fetch(`${SERVER_URL}/api/stats`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const info = await response.json();
        setDirectoryInfo({
          directory: info.directory,
          totalFiles: info.estimatedMediaFiles || 0,
          imageFiles: info.estimatedMediaFiles || 0,
          lastModified: info.lastModified
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleDirectoryClick = (directoryPath: string) => {
    const directory = directories.find(d => d.path === directoryPath);
    
    if (directory && directory.mediaCount > 0) {
      const choice = window.confirm(
        `This directory contains ${directory.mediaCount} photos and ${directory.subdirectoryCount} subdirectories.\n\nClick OK to view photos, or Cancel to browse subdirectories.`
      );
      
      if (choice) {
        setPathHistory(prev => [...prev, currentPath]);
        loadPhotos(directoryPath);
      } else if (directory.subdirectoryCount > 0) {
        setPathHistory(prev => [...prev, currentPath]);
        loadDirectories(directoryPath);
      }
    } else if (directory && directory.subdirectoryCount > 0) {
      setPathHistory(prev => [...prev, currentPath]);
      loadDirectories(directoryPath);
    } else {
      alert('This directory appears to be empty or inaccessible.');
    }
  };

  const handleBackClick = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, -1));
      
      if (mode === 'photos') {
        loadDirectories(previousPath);
      } else {
        loadDirectories(previousPath);
      }
    } else {
      loadDirectories('');
    }
  };

  const loadMorePhotos = () => {
    if (hasMore && !loading) {
      loadPhotos(currentPath, currentPage + 1);
    }
  };

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
    checkServerStatus();
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
          isDemo={false}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {/* Server Status Banner */}
            <div className={`rounded-lg p-4 mb-6 ${
              serverStatus === 'online' 
                ? 'bg-green-50 border border-green-200' 
                : serverStatus === 'offline'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  serverStatus === 'online' ? 'bg-green-500' :
                  serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <h3 className={`font-medium ${
                    serverStatus === 'online' ? 'text-green-800' :
                    serverStatus === 'offline' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {serverStatus === 'online' && 'Connected to your photo server'}
                    {serverStatus === 'offline' && 'Cannot connect to your photo server'}
                    {serverStatus === 'checking' && 'Checking server connection...'}
                  </h3>
                  <p className={`text-sm ${
                    serverStatus === 'online' ? 'text-green-700' :
                    serverStatus === 'offline' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {isLocalServer && 'Using local server'}
                    {isRemoteServer && `Connected to: ${SERVER_URL}`}
                    {serverStatus === 'offline' && ' - Make sure your computer is on and server is running'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="text-red-800 font-medium">Connection Error</h3>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
                
                <div className="mt-4 p-4 bg-red-100 rounded border text-sm text-red-800">
                  <p className="font-medium">Troubleshooting:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Make sure your computer is on and connected to the internet</li>
                    <li>Ensure the photo server is running: <code className="bg-red-200 px-1 rounded">node server.js</code></li>
                    <li>Check your router's port forwarding for port 3001</li>
                    <li>Verify your DDNS is updating correctly</li>
                    <li>Server URL: <code className="bg-red-200 px-1 rounded">{SERVER_URL}</code></li>
                  </ol>
                </div>
              </div>
            )}

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

            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
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