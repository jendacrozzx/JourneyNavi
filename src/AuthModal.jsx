import React, { useState } from 'react';

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [status, setStatus] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ text: '', isError: false });
    setLoading(true);

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
          localStorage.setItem('user', JSON.stringify(data.user));
          if (onLoginSuccess) onLoginSuccess(data.user);
          if (onClose) onClose();
        } else {
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`admin-console-card ${status.isError ? 'shake-error' : ''}`}>
        <div className="admin-card-inner">
          
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