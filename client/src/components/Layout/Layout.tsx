import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient">Studify</h1>
            <nav className="space-x-4">
              <a href="/" className="text-secondary-600 hover:text-primary-600">Home</a>
              <a href="/courses" className="text-secondary-600 hover:text-primary-600">Courses</a>
              <a href="/login" className="btn-primary">Login</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
      
      <footer className="bg-secondary-800 text-white py-8 mt-16">
        <div className="container-custom text-center">
          <p>&copy; 2024 Studify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};