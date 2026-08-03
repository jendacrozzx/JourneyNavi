// src/App.jsx
import React, { useState } from 'react';
import LandingPage from './LandingPage';
import MainPage from './MainPage';
import AdminLoginModal from './AdminLoginModal';
import AuthModal from './AuthModal';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [initialRole, setInitialRole] = useState('user');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleEnterApp = (role = 'user') => {
    setInitialRole(role);
    setCurrentView('app');
    setShowAdminModal(false);
    setShowAuthModal(false);
  };

  const handleAdminSuccess = () => {
    setInitialRole('admin');
    setCurrentView('app');
    setShowAdminModal(false);
    setShowAuthModal(false);
  };

  const handleLoginSuccess = (user) => {
    handleEnterApp('user');
  };

  const handleGuestLogin = () => {
    handleEnterApp('guest');
  };

  if (currentView === 'landing') {
    return (
      <div className="app-viewport-root">
        <LandingPage 
          onEnterApp={handleEnterApp} 
          onOpenAdminModal={() => setShowAdminModal(true)} 
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
        {showAdminModal && (
          <AdminLoginModal 
            onClose={() => setShowAdminModal(false)} 
            onAdminSuccess={handleAdminSuccess} 
          />
        )}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={handleLoginSuccess}
          onGuestLogin={handleGuestLogin}
        />
      </div>
    );
  }

  return (
    <div className="app-viewport-root app-root">
      <MainPage 
        initialRole={initialRole} 
        onBackToLanding={() => setCurrentView('landing')} 
        onOpenAdminModal={() => setShowAdminModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />
      {showAdminModal && (
        <AdminLoginModal 
          onClose={() => setShowAdminModal(false)} 
          onAdminSuccess={handleAdminSuccess} 
        />
      )}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLoginSuccess={handleLoginSuccess}
        onGuestLogin={handleGuestLogin}
      />
    </div>
  );
}