# Studify - Online Learning Platform

Studify is a comprehensive online learning platform that allows administrators to upload video lessons, lesson notes, and presentations, with built-in monetization through ads. The platform features a user-friendly interface with robust security measures.

## 🚀 Features

### Core Features
- **Video Lessons**: Upload and stream high-quality video content
- **Lesson Notes**: Rich text notes and study materials
- **Presentations**: Upload and display presentation slides
- **User Management**: Secure user registration and authentication
- **Course Management**: Organize content into structured courses
- **Progress Tracking**: Monitor student progress and completion rates

### Admin Features
- **Content Upload**: Secure file upload for videos, notes, and presentations
- **User Management**: Admin dashboard for managing users and roles
- **Analytics**: Detailed metrics and reporting
- **Ad Management**: Create and manage advertising campaigns
- **Course Management**: Create, edit, and publish courses

### Monetization
- **Ad Integration**: Multiple ad placement options (banner, video, native)
- **Ad Targeting**: Geographic and demographic targeting
- **Revenue Tracking**: Detailed revenue analytics and reporting
- **Ad Formats**: Support for various ad types and formats

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data validation
- **File Security**: Secure file upload with type validation
- **Password Security**: Strong password requirements and hashing
- **Account Lockout**: Protection against multiple failed login attempts

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for file storage and CDN
- **Helmet** for security headers
- **Express Rate Limit** for rate limiting
- **Multer** for file uploads
- **Bcrypt** for password hashing

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Headless UI** for accessible components

### Development Tools
- **Nodemon** for development server
- **Concurrently** for running multiple processes
- **TypeScript** for type safety

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studify-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server && npm install

   # Install client dependencies
   cd ../client && npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the server directory:
   ```bash
   cp server/.env.example server/.env
   ```
   
   Update the environment variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/studify
   
   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
   JWT_EXPIRE=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Cloudinary Configuration (for file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Admin Account
   ADMIN_EMAIL=admin@studify.com
   ADMIN_PASSWORD=SecureAdminPassword123!
   ```

4. **Database Setup**
   
   Make sure MongoDB is running locally or provide a connection string to a cloud database (MongoDB Atlas).

### Running the Application

1. **Development Mode**
   ```bash
   # Run both client and server concurrently
   npm run dev
   
   # Or run them separately:
   # Server only
   npm run server
   
   # Client only
   npm run client
   ```

2. **Production Build**
   ```bash
   # Build the client
   npm run build
   
   # Start production server
   npm start
   ```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:3000/admin

### Default Admin Account

After running the server for the first time, a default admin account will be created:
- **Email**: admin@studify.com
- **Password**: SecureAdminPassword123! (or as configured in .env)

## 🏗️ Project Structure

```
studify-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── server.js           # Server entry point
├── package.json            # Root package.json
└── README.md
```

## 🔧 Configuration

### Cloudinary Setup (Required for file uploads)

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret
3. Update the environment variables in your `.env` file

### MongoDB Configuration

- **Local MongoDB**: Use `mongodb://localhost:27017/studify`
- **MongoDB Atlas**: Get connection string from your Atlas dashboard
- **Docker MongoDB**: Use appropriate container connection string

## 🚦 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/meta/featured` - Get featured courses

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `POST /api/admin/courses` - Create course
- `POST /api/admin/courses/:id/lessons` - Add lesson to course
- `GET /api/admin/users` - Get all users
- `POST /api/admin/ads` - Create advertisement

### Ads
- `GET /api/ads/:placement` - Get ads for placement
- `POST /api/ads/:id/click` - Track ad click
- `GET /api/ads/metrics/summary` - Get ad metrics

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with secure token handling
- Role-based access control (User, Admin)
- Account lockout after failed login attempts
- Password strength requirements

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- File upload restrictions and validation

### Data Protection
- Password hashing with bcrypt
- Secure cookie handling
- Environment variable protection
- MongoDB injection prevention

## 📈 Monitoring & Analytics

### Built-in Analytics
- User registration and activity tracking
- Course completion rates
- Ad performance metrics (impressions, clicks, revenue)
- User engagement analytics

### Ad Monetization Tracking
- Real-time impression and click tracking
- Revenue calculation (CPM, CPC models)
- Geographic and demographic analytics
- Campaign performance reporting

## 🎨 Customization

### Theming
The frontend uses Tailwind CSS with a custom configuration. You can modify colors, fonts, and spacing in `client/tailwind.config.js`.

### Branding
Update logos, colors, and branding elements in the components and configuration files.

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production` in your production environment
2. Configure production database connection
3. Set up Cloudinary for production file storage
4. Configure domain-specific CORS settings

### Recommended Deployment Platforms
- **Heroku**: Easy deployment with MongoDB Atlas
- **DigitalOcean**: App Platform or Droplets
- **AWS**: EC2 with RDS/DocumentDB
- **Vercel**: Frontend deployment (configure API routes)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the code comments for implementation details

## 🔄 Updates & Maintenance

- Regular security updates for dependencies
- MongoDB schema migrations as needed
- Feature enhancements based on user feedback
- Performance optimizations and monitoring

---

**Studify** - Making online learning accessible, secure, and profitable. 🎓
