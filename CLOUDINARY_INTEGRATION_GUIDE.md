# Cloudinary Integration for Persistent File Storage

## 🎯 Quick Setup Guide

### Step 1: Install Dependencies
```bash
npm install cloudinary multer-storage-cloudinary
```

### Step 2: Environment Variables
Add to your Render environment variables:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3: Update Upload Configuration

Replace the multer diskStorage with Cloudinary storage:

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration
const storage_config = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'audio') {
      return {
        folder: 'beatbazaar/audio',
        resource_type: 'video', // Cloudinary uses 'video' for audio files
        format: 'mp3',
      };
    } else if (file.fieldname === 'image') {
      return {
        folder: 'beatbazaar/images',
        resource_type: 'image',
        format: 'jpg',
      };
    }
    return {
      folder: 'beatbazaar/uploads',
      resource_type: 'auto',
    };
  },
});
```

### Step 4: Benefits
- ✅ Files persist across deployments
- ✅ Automatic CDN delivery (faster loading)
- ✅ Image optimization
- ✅ Audio streaming support
- ✅ Free tier: 25GB storage, 25GB bandwidth/month

### Step 5: Migration Strategy
1. Set up Cloudinary account
2. Update upload code
3. Re-upload existing beats through admin panel
4. Old local files will be ignored

## 🚀 Want me to implement this now?

I can implement the Cloudinary integration right now. Just:
1. Create a free Cloudinary account at cloudinary.com
2. Get your credentials (cloud_name, api_key, api_secret)
3. Let me know and I'll update the code

This will solve the file persistence issue permanently!