// src/App.jsx
import React, { useState } from 'react';
import LandingPage from './LandingPage';
import MainPage from './MainPage';
import AdminLoginModal from './AdminLoginModal';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [initialRole, setInitialRole] = useState('user');
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleEnterApp = (role = 'user') => {
    setInitialRole(role);
    setCurrentView('app');
    setShowAdminModal(false);
  };

  const handleAdminSuccess = () => {
    setInitialRole('admin');
    setCurrentView('app');
    setShowAdminModal(false);
  };

  if (currentView === 'landing') {
    return (
      <div className="app-viewport-root">
        <LandingPage 
          onEnterApp={handleEnterApp} 
          onOpenAdminModal={() => setShowAdminModal(true)} 
        />
        {showAdminModal && (
          <AdminLoginModal 
            onClose={() => setShowAdminModal(false)} 
            onAdminSuccess={handleAdminSuccess} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-viewport-root app-root">
      <MainPage 
        initialRole={initialRole} 
        onBackToLanding={() => setCurrentView('landing')} 
        onOpenAdminModal={() => setShowAdminModal(true)}
      />
      {showAdminModal && (
        <AdminLoginModal 
          onClose={() => setShowAdminModal(false)} 
          onAdminSuccess={handleAdminSuccess} 
        />
      )}
    </div>
  );
}