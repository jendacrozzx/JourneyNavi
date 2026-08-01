// src/AdminLoginModal.jsx
import React, { useState } from 'react';
import './App.css';

export default function AdminLoginModal({ onClose, onAdminSuccess }) {
  const [adminKey, setAdminKey] = useState('');
  const [errorState, setErrorState] = useState(false);

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminKey === 'admin123') {
      onAdminSuccess();
    } else {
      setErrorState(true);
      setTimeout(() => setErrorState(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-console-card" onClick={e => e.stopPropagation()}>
        <div className="admin-card-inner">
          <div className="admin-badge-head">
            <span>ADMINISTRATOR LOGIN</span>
            <button className="close-x-btn" onClick={onClose}>×</button>
          </div>
          
          <h2>Enter Admin Passkey</h2>
          <p className="admin-desc">
            Please enter your administrator passkey to access backend database controls.
          </p>

          <form onSubmit={handleAdminAuth} className="admin-form">
            <div className={`form-field ${errorState ? 'shake-error' : ''}`}>
              <label>Passkey (admin123)</label>
              <input 
                type="password" 
                placeholder="••••••••••••" 
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                autoFocus
                required 
              />
              {errorState && <span className="error-text">Incorrect passkey. Please try again.</span>}
            </div>

            <div className="admin-modal-buttons">
              <button type="button" className="nav-ghost-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="admin-submit-btn">
                Access Admin Mode
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}