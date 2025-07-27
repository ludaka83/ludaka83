const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File filter function for security
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    document: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.rtf'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a']
  };

  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // Check file type based on field name
  let isAllowed = false;
  
  if (file.fieldname.includes('video')) {
    isAllowed = allowedTypes.video.includes(fileExtension);
  } else if (file.fieldname.includes('image') || file.fieldname.includes('thumbnail') || file.fieldname.includes('avatar')) {
    isAllowed = allowedTypes.image.includes(fileExtension);
  } else if (file.fieldname.includes('document') || file.fieldname.includes('presentation')) {
    isAllowed = allowedTypes.document.includes(fileExtension);
  } else if (file.fieldname.includes('audio')) {
    isAllowed = allowedTypes.audio.includes(fileExtension);
  } else {
    // Default to document types for unknown fields
    isAllowed = [...allowedTypes.document, ...allowedTypes.image].includes(fileExtension);
  }

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${fileExtension} is not allowed for field ${file.fieldname}`), false);
  }
};

// Cloudinary storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studify/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    transformation: [
      { quality: 'auto' },
      { format: 'mp4' }
    ]
  },
});

// Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studify/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
});

// Cloudinary storage for documents/presentations
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studify/documents',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'rtf']
  },
});

// Cloudinary storage for thumbnails
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studify/thumbnails',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1280, height: 720, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
});

// Upload middleware for videos
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  }
}).single('video');

// Upload middleware for images
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  }
}).single('image');

// Upload middleware for documents
const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  }
}).single('document');

// Upload middleware for course thumbnails
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for thumbnails
  }
}).single('thumbnail');

// Upload middleware for user avatars
const uploadAvatar = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'studify/avatars',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  }
}).single('avatar');

// Multiple file upload for lesson resources
const uploadResources = multer({
  storage: documentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10 // Maximum 10 files
  }
}).array('resources', 10);

// Mixed upload for lesson creation (video + thumbnail + resources)
const uploadLessonFiles = multer({
  storage: multer.memoryStorage(), // We'll handle storage manually
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max per file
    files: 12 // 1 video + 1 thumbnail + 10 resources
  }
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'resources', maxCount: 10 }
]);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Please check the file size limits.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum file count exceeded.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  }

  if (error.message && error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// Helper function to upload file to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to get video duration and generate thumbnail
const getVideoInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video'
    });
    
    return {
      duration: result.duration,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};

module.exports = {
  uploadVideo,
  uploadImage,
  uploadDocument,
  uploadThumbnail,
  uploadAvatar,
  uploadResources,
  uploadLessonFiles,
  handleUploadError,
  uploadToCloudinary,
  deleteFromCloudinary,
  getVideoInfo,
  cloudinary
};