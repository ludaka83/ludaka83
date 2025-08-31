import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { CoursesPage } from './pages/Courses/CoursesPage';
import { CourseDetailPage } from './pages/Courses/CourseDetailPage';
import { LessonPage } from './pages/Lessons/LessonPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminCoursesPage } from './pages/Admin/AdminCoursesPage';
import { AdminUsersPage } from './pages/Admin/AdminUsersPage';
import { AdminAdsPage } from './pages/Admin/AdminAdsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-secondary-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/courses" element={<Layout><CoursesPage /></Layout>} />
            <Route path="/courses/:id" element={<Layout><CourseDetailPage /></Layout>} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><DashboardPage /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout><ProfilePage /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/courses/:courseId/lessons/:lessonId" element={
              <ProtectedRoute>
                <Layout><LessonPage /></Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/courses" element={
              <ProtectedRoute requireAdmin>
                <Layout><AdminCoursesPage /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <Layout><AdminUsersPage /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/ads" element={
              <ProtectedRoute requireAdmin>
                <Layout><AdminAdsPage /></Layout>
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
