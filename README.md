# Local Photo Gallery

A beautiful, production-ready photo gallery application that serves photos from your local directory with Google Photos-like functionality.

## Features

- **Beautiful Interface**: Clean, modern design with grid and list view modes
- **Local Photo Server**: Serves photos directly from your local directory
- **Search Functionality**: Search through your photos by filename
- **Photo Viewer**: Full-screen photo viewer with zoom, rotate, and navigation
- **Screen Casting**: Built-in support for casting to external displays
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Updates**: Refresh button to reload photos from directory

## Setup Instructions

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Photo Directory
Edit `server.js` and change the `PHOTOS_DIR` constant to point to your photo directory:

\`\`\`javascript
// For your Korean photo directory:
const PHOTOS_DIR = 'D:\\USR\\사진';

// Or for any other directory:
const PHOTOS_DIR = '/path/to/your/photos';
\`\`\`

### 3. Start the Photo Server
\`\`\`bash
node server.js
\`\`\`

The server will start on `http://localhost:3001` and serve photos from your directory.

### 4. Start the Web Application
In a new terminal:
\`\`\`bash
npm run dev
\`\`\`

The web app will be available at `http://localhost:5173`

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

## Screen Casting

The app includes screen casting functionality that works with:
- **Presentation API**: For Chromecast and similar devices
- **Screen Share API**: As a fallback for screen mirroring
- Modern browsers with casting support

## Production Deployment

For production use:

1. **Security**: Add authentication if needed
2. **Performance**: Implement proper thumbnail generation
3. **Caching**: Add image caching for better performance
4. **HTTPS**: Use HTTPS for secure connections
5. **Port Configuration**: Configure custom ports as needed

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Icons**: Lucide React
- **Build Tool**: Vite

## Browser Support

- Chrome/Chromium (recommended for casting features)
- Firefox
- Safari
- Edge

## Troubleshooting

### Photos Not Loading
- Ensure the server is running (`node server.js`)
- Check that the `PHOTOS_DIR` path is correct
- Verify photos are in supported formats

### Casting Not Working
- Use Chrome/Chromium for best casting support
- Ensure you're on the same network as casting devices
- Check browser permissions for media access

### Performance Issues
- Consider generating thumbnails for large photo collections
- Implement pagination for directories with many photos
- Use image optimization for web delivery
\`\`\`