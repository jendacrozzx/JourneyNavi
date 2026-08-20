import React, { useState } from 'react';

const AuthModal = ({ onClose }) => {
  // Toggle between Sign In and Sign Up view
  const [isSignUp, setIsSignUp] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Feedback message state
  const [status, setStatus] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  // Update input state as user types
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ text: '', isError: false });
    setLoading(true);

    // Target the appropriate PHP script in XAMPP htdocs/Server
    const endpoint = isSignUp 
      ? 'http://localhost/Server/signup.php' 
      : 'http://localhost/Server/signin.php';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ text: data.message, isError: false });

        if (!isSignUp) {
          // --- SIGN IN SUCCESS ---
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('Logged in user:', data.user);
          if (onClose) onClose();
        } else {
          // --- SIGN UP SUCCESS ---
          setFormData({ name: '', email: '', password: '' });
          setTimeout(() => {
            setIsSignUp(false);
            setStatus({ text: 'Account created successfully! Please sign in.', isError: false });
          }, 1500);
        }
      } else {
        setStatus({ text: data.message, isError: true });
      }
    } catch (error) {
      setStatus({ 
        text: 'Unable to reach the server. Make sure Apache is running in XAMPP.', 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  // Close modal when clicking on the dark backdrop area
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`admin-console-card ${status.isError ? 'shake-error' : ''}`}>
        <div className="admin-card-inner">
          
          {/* Header & Top Right Close 'X' */}
          <div className="admin-badge-head">
            <span>{isSignUp ? 'REGISTER' : 'WELCOME BACK'}</span>
            {onClose && (
              <button 
                type="button" 
                className="close-x-btn" 
                onClick={onClose}
                aria-label="Close modal"
              >
                &times;
              </button>
            )}
          </div>

          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p className="admin-desc">
            {isSignUp 
              ? 'Enter your credentials to register a new workspace profile.' 
              : 'Enter your credentials to access your dashboard workspace.'}
          </p>

          {/* Response Message Banner */}
          {status.text && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              marginBottom: '1.25rem', 
              color: status.isError ? '#1b2c99' : '#166534',
              backgroundColor: status.isError ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${status.isError ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              {status.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-form">
            {/* Name input only shows during Sign Up */}
            {isSignUp && (
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Action Buttons: Cancel/Close & Submit */}
            <div className="admin-modal-buttons" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {onClose && (
                <button 
                  type="button" 
                  onClick={onClose}
                  className="admin-cancel-btn"
                  style={{
                    flex: '1',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                disabled={loading}
                className="admin-submit-btn"
                style={{ flex: '1' }}
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Mode Switcher */}
          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStatus({ text: '', isError: false });
              }}
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
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default AuthModal;