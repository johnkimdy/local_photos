import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Your photos directory with subdirectories
const PHOTOS_DIR = 'D:\\USR\\사진';

// Function to check if file is a supported media type
function isMediaFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
  return imageExts.includes(ext) || videoExts.includes(ext);
}

// Function to get media type
function getMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
  return videoExts.includes(ext) ? 'video' : 'image';
}

// Fast directory scan - only get immediate subdirectories and their counts
function getDirectoriesWithCounts(dir, maxDepth = 1, currentDepth = 0) {
  const directories = [];
  
  try {
    if (currentDepth >= maxDepth) return directories;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Count media files in this directory (non-recursive for speed)
          let mediaCount = 0;
          let subdirCount = 0;
          
          try {
            const dirItems = fs.readdirSync(fullPath);
            for (const dirItem of dirItems) {
              const itemPath = path.join(fullPath, dirItem);
              const itemStat = fs.statSync(itemPath);
              
              if (itemStat.isFile() && isMediaFile(dirItem)) {
                mediaCount++;
              } else if (itemStat.isDirectory()) {
                subdirCount++;
              }
            }
          } catch (error) {
            console.warn(`Warning: Could not read directory ${fullPath}:`, error.message);
          }
          
          directories.push({
            name: item,
            path: path.relative(PHOTOS_DIR, fullPath),
            fullPath: fullPath,
            mediaCount: mediaCount,
            subdirectoryCount: subdirCount,
            lastModified: stat.mtime,
            size: stat.size
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not stat ${fullPath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return directories.sort((a, b) => a.name.localeCompare(b.name));
}

// Get media files from a specific directory (non-recursive)
function getMediaFilesInDirectory(dir, recursive = false, limit = 100) {
  let mediaFiles = [];
  
  try {
    const items = fs.readdirSync(dir);
    let count = 0;
    
    for (const item of items) {
      if (count >= limit && !recursive) break;
      
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && recursive) {
          // If recursive, scan subdirectories but still respect overall limit
          const subFiles = getMediaFilesInDirectory(fullPath, false, limit - count);
          mediaFiles = mediaFiles.concat(subFiles);
          count += subFiles.length;
        } else if (stat.isFile() && isMediaFile(item)) {
          const relativePath = path.relative(PHOTOS_DIR, fullPath);
          const dirName = path.dirname(relativePath);
          
          mediaFiles.push({
            name: item,
            fullPath: fullPath,
            relativePath: relativePath,
            directory: dirName === '.' ? 'Root' : dirName,
            size: stat.size,
            modified: stat.mtime,
            type: getMediaType(item)
          });
          count++;
        }
      } catch (error) {
        console.warn(`Warning: Could not process ${fullPath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return mediaFiles;
}



// Root route - server status page
app.get('/', (req, res) => {
  res.json({
    status: 'Photo Gallery Server Running',
    message: 'Local Photo Gallery API Server',
    timestamp: new Date().toISOString(),
    endpoints: {
      directories: '/api/directories',
      photos: '/api/photos',
      stats: '/api/stats',
      info: '/api/info'
    },
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Photo Gallery API',
    version: '1.0.0',
    endpoints: [
      'GET /api/directories - Get root directories',
      'GET /api/directories/:path - Get subdirectories', 
      'GET /api/photos/:directory - Get photos from directory',
      'GET /api/stats - Get directory statistics',
      'GET /api/photo/:filepath - Get individual photo',
      'GET /api/thumbnail/:filepath - Get photo thumbnail'
    ]
  });
});

// Get root directory structure (fast)
app.get('/api/directories', (req, res) => {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) {
      return res.status(404).json({ error: 'Photos directory not found' });
    }

    const directories = getDirectoriesWithCounts(PHOTOS_DIR, 1);
    
    res.json({
      rootPath: PHOTOS_DIR,
      directories: directories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting directory structure:', error);
    res.status(500).json({ error: 'Unable to get directory structure' });
  }
});

// Get subdirectories of a specific directory
app.get('/api/directories/:path(*)', (req, res) => {
  try {
    const requestedPath = decodeURIComponent(req.params.path);
    const targetDir = path.join(PHOTOS_DIR, requestedPath);
    
    // Security check
    if (!targetDir.startsWith(PHOTOS_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const directories = getDirectoriesWithCounts(targetDir, 1);
    
    res.json({
      currentPath: requestedPath,
      fullPath: targetDir,
      directories: directories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting subdirectories:', error);
    res.status(500).json({ error: 'Unable to get subdirectories' });
  }
});

// Get media files from specific directory (with pagination)
app.get('/api/photos/:directory(*)', (req, res) => {
  try {
    const directory = decodeURIComponent(req.params.directory);
    const targetDir = path.join(PHOTOS_DIR, directory);
    const recursive = req.query.recursive === 'true';
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Security check
    if (!targetDir.startsWith(PHOTOS_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const mediaFiles = getMediaFilesInDirectory(targetDir, recursive, limit + offset);
    
    // Apply pagination
    const paginatedFiles = mediaFiles.slice(offset, offset + limit);
    
    const media = paginatedFiles.map((file, index) => ({
      id: offset + index + 1,
      name: file.name,
      directory: file.directory,
      url: `/api/photo/${encodeURIComponent(file.relativePath)}`,
      thumbnail: `/api/thumbnail/${encodeURIComponent(file.relativePath)}`,
      size: file.size,
      modified: file.modified,
      type: file.type,
      relativePath: file.relativePath
    }));

    res.json({
      photos: media,
      totalCount: mediaFiles.length,
      hasMore: mediaFiles.length > offset + limit,
      currentPage: Math.floor(offset / limit) + 1,
      directory: directory
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Unable to read directory' });
  }
});

// Get quick stats for root directory
app.get('/api/stats', (req, res) => {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) {
      return res.status(404).json({ error: 'Photos directory not found' });
    }

    const stats = fs.statSync(PHOTOS_DIR);
    const directories = getDirectoriesWithCounts(PHOTOS_DIR, 1);
    
    const totalDirectories = directories.length;
    const totalMediaFiles = directories.reduce((sum, dir) => sum + dir.mediaCount, 0);
    
    res.json({
      directory: PHOTOS_DIR,
      totalDirectories: totalDirectories,
      estimatedMediaFiles: totalMediaFiles,
      lastModified: stats.mtime,
      directories: directories.slice(0, 10) // Return first 10 directories as preview
    });
  } catch (error) {
    console.error('Error getting directory stats:', error);
    res.status(500).json({ error: 'Unable to get directory stats' });
  }
});

// Original endpoints (keep for backward compatibility but with limits)
app.get('/api/photos', (req, res) => {
  try {
    // For root photos endpoint, limit to first 50 files to prevent timeout
    const mediaFiles = getMediaFilesInDirectory(PHOTOS_DIR, false, 50);
    
    const media = mediaFiles.map((file, index) => ({
      id: index + 1,
      name: file.name,
      directory: file.directory,
      url: `/api/photo/${encodeURIComponent(file.relativePath)}`,
      thumbnail: `/api/thumbnail/${encodeURIComponent(file.relativePath)}`,
      size: file.size,
      modified: file.modified,
      type: file.type,
      relativePath: file.relativePath
    }));

    res.json(media);
  } catch (error) {
    console.error('Error reading photos directory:', error);
    res.status(500).json({ error: 'Unable to read photos directory' });
  }
});

app.get('/api/info', (req, res) => {
  // Redirect to the faster stats endpoint
  res.redirect('/api/stats');
});

// Serve individual photo/video
app.get('/api/photo/:filepath(*)', (req, res) => {
  try {
    const filepath = decodeURIComponent(req.params.filepath);
    const fullPath = path.join(PHOTOS_DIR, filepath);
    
    // Security check to prevent directory traversal
    if (!fullPath.startsWith(PHOTOS_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Unable to serve file' });
  }
});

// Serve thumbnail (simplified - serves original for now)
app.get('/api/thumbnail/:filepath(*)', (req, res) => {
  try {
    const filepath = decodeURIComponent(req.params.filepath);
    const fullPath = path.join(PHOTOS_DIR, filepath);
    
    // Security check to prevent directory traversal
    if (!fullPath.startsWith(PHOTOS_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // For demo purposes, serve the original file as thumbnail
    // In production, you'd generate and cache actual thumbnails
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    res.status(500).json({ error: 'Unable to serve thumbnail' });
  }
});

app.listen(PORT, () => {
  console.log(`Optimized Photo server running on http://localhost:${PORT}`);
  console.log(`Serving media from: ${PHOTOS_DIR}`);
  console.log(`\nOptimized API Endpoints:`);
  console.log(`- GET /api/directories - Root directory structure (fast)`);
  console.log(`- GET /api/directories/:path - Subdirectory structure`);
  console.log(`- GET /api/photos/:directory?limit=100&offset=0 - Paginated photos`);
  console.log(`- GET /api/stats - Quick directory statistics`);
  console.log(`\nPerformance Features:`);
  console.log(`- Pagination support for large directories`);
  console.log(`- Non-recursive scanning by default`);
  console.log(`- Directory preview with media counts`);
  console.log(`- Limited initial load for better performance`);
});

const HOST = '0.0.0.0'; // This allows external connections

// Update your app.listen() call:
app.listen(PORT, HOST, () => {
  console.log(`\n=== Photo Server Started ===`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://172.30.1.55:${PORT}`);
  console.log(`🌐 Global access: http://local-photos.ddns.net:${PORT}`);
  console.log(`📱 Mobile access: http://local-photos.ddns.net:${PORT}`);
  console.log(`\nServer is now accessible from anywhere!`);
  console.log(`Keep this terminal open to maintain access.`);
  console.log(`=====================================\n`);
});