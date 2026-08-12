import React, { useState } from 'react';
import LandingPage from './LandingPage.jsx';
import MainPage from './MainPage.jsx';
import Signin from './Signin.jsx';
import Signup from './Signup.jsx';
import AdminLoginModal from './AdminLoginModal.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); 
  const [userRole, setUserRole] = useState('user');
  const [authMode, setAuthMode] = useState(null); 
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setUserRole('user');
    setAuthMode(null);
    setCurrentView('main');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole('user');
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage 
          onEnterApp={() => setCurrentView('main')} 
          onOpenAdminModal={() => setShowAdminModal(true)}
          onOpenAuthModal={() => setAuthMode('signin')}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      ) : (
        <MainPage 
          initialRole={userRole} 
          onBackToLanding={() => setCurrentView('landing')} 
          onOpenAdminModal={() => setShowAdminModal(true)}
          onOpenAuthModal={() => setAuthMode('signin')}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {authMode && (
        <div className="modal-backdrop" onClick={() => setAuthMode(null)}>
          <div className="clean-modal-card" onClick={e => e.stopPropagation()}>
            <button 
              className="close-x-btn" 
              onClick={() => setAuthMode(null)}
              aria-label="Close modal"
            >
              &times;
            </button>

            {authMode === 'signin' ? (
              <Signin 
                onSwitchToSignup={() => setAuthMode('signup')} 
                onLoginSuccess={handleLoginSuccess}
                onClose={() => setAuthMode(null)}
              />
            ) : (
              <Signup 
                onSwitchToSignin={() => setAuthMode('signin')} 
                onClose={() => setAuthMode(null)}
              />
            )}
          </div>
        </div>
      )}

      {showAdminModal && (
        <AdminLoginModal 
          onClose={() => setShowAdminModal(false)} 
          onAdminSuccess={() => {
            setUserRole('admin');
            setShowAdminModal(false);
            setCurrentView('main');
          }} 
        />
      )}
    </>
  );
}