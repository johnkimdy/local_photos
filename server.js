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

// Recursive function to get all media files from subdirectories
function getAllMediaFiles(dir, baseDir = dir) {
  let mediaFiles = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        mediaFiles = mediaFiles.concat(getAllMediaFiles(fullPath, baseDir));
      } else if (stat.isFile() && isMediaFile(item)) {
        // Get relative path from base directory
        const relativePath = path.relative(baseDir, fullPath);
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
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return mediaFiles;
}

// Get list of all media files from all subdirectories
app.get('/api/photos', (req, res) => {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) {
      return res.status(404).json({ error: 'Photos directory not found' });
    }

    const mediaFiles = getAllMediaFiles(PHOTOS_DIR);
    
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

// Get directory structure
app.get('/api/directories', (req, res) => {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) {
      return res.status(404).json({ error: 'Photos directory not found' });
    }

    function getDirectoryTree(dir, baseDir = dir) {
      const tree = {};
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            const relativePath = path.relative(baseDir, fullPath);
            tree[relativePath] = {
              name: item,
              path: relativePath,
              mediaCount: getAllMediaFiles(fullPath).length,
              subdirectories: getDirectoryTree(fullPath, baseDir)
            };
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
      
      return tree;
    }

    const directoryTree = getDirectoryTree(PHOTOS_DIR);
    res.json(directoryTree);
  } catch (error) {
    console.error('Error getting directory structure:', error);
    res.status(500).json({ error: 'Unable to get directory structure' });
  }
});

// Get media files from specific directory
app.get('/api/photos/:directory(*)', (req, res) => {
  try {
    const directory = decodeURIComponent(req.params.directory);
    const targetDir = path.join(PHOTOS_DIR, directory);
    
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const mediaFiles = getAllMediaFiles(targetDir, PHOTOS_DIR);
    
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
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Unable to read directory' });
  }
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

// Get photos info with subdirectory statistics
app.get('/api/info', (req, res) => {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) {
      return res.status(404).json({ error: 'Photos directory not found' });
    }

    const stats = fs.statSync(PHOTOS_DIR);
    const allMediaFiles = getAllMediaFiles(PHOTOS_DIR);
    
    const imageFiles = allMediaFiles.filter(file => file.type === 'image');
    const videoFiles = allMediaFiles.filter(file => file.type === 'video');
    
    // Group by directory
    const byDirectory = {};
    allMediaFiles.forEach(file => {
      if (!byDirectory[file.directory]) {
        byDirectory[file.directory] = { images: 0, videos: 0, total: 0 };
      }
      byDirectory[file.directory][file.type === 'image' ? 'images' : 'videos']++;
      byDirectory[file.directory].total++;
    });

    res.json({
      directory: PHOTOS_DIR,
      totalFiles: allMediaFiles.length,
      imageFiles: imageFiles.length,
      videoFiles: videoFiles.length,
      directories: Object.keys(byDirectory).length,
      byDirectory: byDirectory,
      lastModified: stats.mtime
    });
  } catch (error) {
    console.error('Error getting directory info:', error);
    res.status(500).json({ error: 'Unable to get directory info' });
  }
});

app.listen(PORT, () => {
  console.log(`Photo server running on http://localhost:${PORT}`);
  console.log(`Serving media from: ${PHOTOS_DIR}`);
  console.log(`\nSupported formats:`);
  console.log(`Images: JPG, JPEG, PNG, GIF, WebP, BMP, TIFF, SVG`);
  console.log(`Videos: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V`);
  console.log(`\nAPI Endpoints:`);
  console.log(`- GET /api/photos - All media files`);
  console.log(`- GET /api/directories - Directory structure`);
  console.log(`- GET /api/photos/:directory - Media from specific directory`);
  console.log(`- GET /api/info - Directory statistics`);
});