
import React, { useState } from 'react';
import './App.css';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
 
    const userData = {
      name: isSignUp ? name : email.split('@')[0],
      email: email,
      role: 'user'
    };
    onAuthSuccess(userData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-console-card" onClick={e => e.stopPropagation()}>
        <div className="admin-card-inner">
          <div className="admin-badge-head">
            <span>{isSignUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</span>
            <button className="close-x-btn" onClick={onClose}>&times;</button>
          </div>
          <h2>{isSignUp ? 'Join JourneyNavi' : 'Sign In to Continue'}</h2>
          <p className="admin-desc">
            {isSignUp ? 'Create your profile to save custom routes and track trip expenses.' : 'Access your saved itineraries and budget preferences.'}
          </p>

          <form onSubmit={handleSubmit} className="admin-form">
            {isSignUp && (
              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="Narith Sehgal" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            )}
            
            <div className="form-field" style={{ marginBottom: '1rem' }}>
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            {error && <div className="error-text">{error}</div>}

            <div className="admin-modal-buttons">
              <button 
                type="button" 
                className="nav-ghost-btn" 
                onClick={() => setIsSignUp(!isSignUp)}
                style={{ fontSize: '0.8rem' }}
              >
                {isSignUp ? 'Existing user? Sign In' : 'New here? Create Account'}
              </button>
              <button type="submit" className="admin-submit-btn">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}