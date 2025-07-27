# 🌥️ Cloudinary Setup Guide for Studify

## Why Cloudinary?
Cloudinary provides secure, scalable cloud storage for all video files, images, and documents in the Studify platform. It handles file transformations, optimizations, and global CDN delivery.

## 🚀 **Quick Setup (5 minutes)**

### Step 1: Create a Free Cloudinary Account
1. Visit [https://cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"**
3. Fill in your details and verify your email
4. Choose the **free plan** (includes 25GB storage and 25GB bandwidth/month)

### Step 2: Get Your Credentials
1. Log into your Cloudinary dashboard
2. In the **"Dashboard"** section, you'll see:
   - **Cloud Name**: This is your unique identifier
   - **API Key**: Your public key 
   - **API Secret**: Your private key (click the eye icon to reveal)

### Step 3: Update Your Environment File
Replace the demo values in `server/.env`:

```env
# Replace these with your actual Cloudinary credentials:
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

## 📁 **File Organization**
Studify automatically organizes uploads in these folders:
- `/studify/videos/` - Course video lessons
- `/studify/images/` - Course thumbnails and user avatars
- `/studify/documents/` - PDF presentations and notes
- `/studify/thumbnails/` - Auto-generated video thumbnails

## 🔐 **Security Features**
- **File Type Validation**: Only allowed formats accepted
- **Size Limits**: Videos (500MB), Images (10MB), Documents (50MB)
- **Automatic Optimization**: Images compressed for faster loading
- **URL Security**: Signed URLs for sensitive content

## 💰 **Pricing (Free Tier Limits)**
- **Storage**: 25GB free
- **Bandwidth**: 25GB/month free
- **Transformations**: 25 credits/month free
- **Perfect for**: Testing and small to medium learning platforms

## 🛠️ **Advanced Configuration (Optional)**

### Custom Upload Presets
For production, create upload presets in Cloudinary dashboard:
1. Go to **Settings > Upload**
2. Create presets for different content types
3. Add transformation rules for optimization

### Video Processing
Cloudinary can automatically:
- Generate video thumbnails
- Convert to web-optimized formats (MP4, WebM)
- Create different quality versions (720p, 1080p)
- Add watermarks to videos

## 🔄 **Testing Your Setup**

After updating your credentials, test the setup:

```bash
# Start your Studify server
cd server && npm run dev

# The server should connect to Cloudinary successfully
# Check the logs for any connection errors
```

## 🆘 **Troubleshooting**

### Common Issues:
1. **"Invalid API Key"**: Double-check your API key and secret
2. **"Cloud not found"**: Verify your cloud name is correct
3. **"Upload failed"**: Check file size limits and allowed formats

### Test Upload:
You can test uploads via the admin panel once the server is running.

## 📞 **Support**
- **Cloudinary Docs**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Studify Issues**: Check the server logs for detailed error messages

---

**🎯 Next Step**: After setting up Cloudinary, your Studify platform will have full file upload capabilities for admin video lessons, course thumbnails, and student profile pictures!