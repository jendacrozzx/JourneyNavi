import React, { useState } from 'react';

export default function Signin({ onSwitchToSignup, onLoginSuccess, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handleSignin = async (e) => {
    e.preventDefault();
    setStatus({ text: '', isError: false });
    setLoading(true);

    try {
      const res = await fetch('http://localhost/backend/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', email, password })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStatus({ text: data.message || 'Signed in successfully!', isError: false });
        if (onLoginSuccess) onLoginSuccess(data.user); // Passes user profile data up
      } else {
        setStatus({ text: data.message || 'Invalid email or password.', isError: true });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setStatus({ 
        text: 'Failed to connect to the server. Check if XAMPP Apache is running.', 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className={`admin-console-card ${status.isError ? 'shake-error' : ''}`}>
        <div className="admin-card-inner">
          
          {/* Header & Close Action */}
          <div className="admin-badge-head">
            <span>WELCOME BACK</span>
            {onClose && (
              <button type="button" className="close-x-btn" onClick={onClose}>
                &times;
              </button>
            )}
          </div>

          <h2>Sign In</h2>
          <p className="admin-desc">
            Enter your credentials to access your dashboard workspace.
          </p>

          {/* Response Message Banner */}
          {status.text && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              marginBottom: '1.25rem', 
              color: status.isError ? '#991b1b' : '#166534',
              backgroundColor: status.isError ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${status.isError ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              {status.text}
            </div>
          )}

          <form onSubmit={handleSignin} className="admin-form">
            <div className="form-field">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="admin-modal-buttons">
              <button 
                type="submit" 
                disabled={loading}
                className="admin-submit-btn"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Mode Switcher */}
          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={onSwitchToSignup}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#2563eb', 
                cursor: 'pointer', 
                fontWeight: '700',
                fontSize: '0.85rem',
                marginLeft: '0.25rem'
              }}
            >
              Sign Up
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}