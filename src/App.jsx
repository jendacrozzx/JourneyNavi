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
  const [currentUser, setCurrentUser] = useState(null); // Stores logged in user data

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData); // Saves user object (contains email/name)
    setUserRole('user');
    setAuthMode(null);
    setCurrentView('main');
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage 
          onEnterApp={() => setCurrentView('main')} 
          onOpenAdminModal={() => setShowAdminModal(true)}
          onOpenAuthModal={() => setAuthMode('signin')}
          currentUser={currentUser}
        />
      ) : (
        <MainPage 
          initialRole={userRole} 
          onBackToLanding={() => setCurrentView('landing')} 
          onOpenAdminModal={() => setShowAdminModal(true)}
          onOpenAuthModal={() => setAuthMode('signin')}
          currentUser={currentUser}
        />
      )}

      {/* Auth Modal Backdrop */}
      {authMode && (
        <div className="modal-backdrop" onClick={() => setAuthMode(null)}>
          <div className="clean-modal-card" onClick={e => e.stopPropagation()}>
            <button className="close-x-btn" onClick={() => setAuthMode(null)}>&times;</button>
            {authMode === 'signin' ? (
              <Signin 
                onSwitchToSignup={() => setAuthMode('signup')} 
                onLoginSuccess={handleLoginSuccess} 
              />
            ) : (
              <Signup 
                onSwitchToSignin={() => setAuthMode('signin')} 
              />
            )}
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <AdminLoginModal 
          onClose={() => setShowAdminModal(false)} 
          onLoginSuccess={() => {
            setUserRole('admin');
            setShowAdminModal(false);
            setCurrentView('main');
          }} 
        />
      )}
    </>
  );
}