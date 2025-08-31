import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section py-20">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-secondary-900 mb-6">
              Welcome to <span className="text-gradient">Studify</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
              Your premier destination for online learning. Access high-quality video lessons, 
              comprehensive notes, and interactive presentations from expert instructors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn-primary px-8 py-3 text-lg">
                    Get Started Free
                  </Link>
                  <Link to="/courses" className="btn-outline px-8 py-3 text-lg">
                    Browse Courses
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="btn-primary px-8 py-3 text-lg">
                    Go to Dashboard
                  </Link>
                  <Link to="/courses" className="btn-outline px-8 py-3 text-lg">
                    Explore Courses
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Why Choose Studify?
            </h2>
            <p className="text-lg text-secondary-600">
              Everything you need for effective online learning
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Video Lessons</h3>
              <p className="text-secondary-600">High-quality video content with interactive features and progress tracking.</p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Study Materials</h3>
              <p className="text-secondary-600">Comprehensive notes, presentations, and downloadable resources.</p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Progress Tracking</h3>
              <p className="text-secondary-600">Monitor your learning progress with detailed analytics and achievements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Features Section */}
      {user?.role === 'admin' && (
        <section className="py-16 bg-secondary-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                Admin Features
              </h2>
              <p className="text-lg text-secondary-600">
                Powerful tools for content management and monetization
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">Content Management</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>• Upload and manage video lessons</li>
                  <li>• Create and organize course content</li>
                  <li>• Add presentations and study materials</li>
                  <li>• User management and analytics</li>
                </ul>
                <Link to="/admin" className="btn-primary mt-4 inline-flex">
                  Access Admin Dashboard
                </Link>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">Monetization</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>• Ad management and placement</li>
                  <li>• Revenue tracking and analytics</li>
                  <li>• Targeted advertising campaigns</li>
                  <li>• Multiple ad formats support</li>
                </ul>
                <Link to="/admin/ads" className="btn-outline mt-4 inline-flex">
                  Manage Ads
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students already learning on Studify
          </p>
          {!isAuthenticated ? (
            <Link to="/register" className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center">
              Create Free Account
            </Link>
          ) : (
            <Link to="/courses" className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center">
              Start Learning Now
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};