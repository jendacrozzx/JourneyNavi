import React, { useState } from 'react';
import './App.css';

/* Inline icons */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c1.6-3.6 4.6-5.5 7.5-5.5s5.9 1.9 7.5 5.5" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a15.6 15.6 0 0 1-3.4 4.2M6.5 6.7C4 8.3 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 3.4-.6" />
      <path d="M9.5 9.6a3 3 0 0 0 4.2 4.2" />
    </svg>
  );

export default function LandingPage({ onEnterApp, onOpenAdminModal }) {
  const [currentView, setCurrentView] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (currentView === 'signup' && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    onEnterApp('user');
  };

  const handleGuestEntry = () => {
    onEnterApp('guest');
  };

  const navigateToHome = () => {
    setCurrentView('home');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
  };

  // ==========================================
  // UNIFIED AUTH VIEW (Centered Card)
  // ==========================================
  if (currentView === 'signin' || currentView === 'signup') {
    const isSignIn = currentView === 'signin';

    return (
      <div className="auth-fullscreen-wrapper">
        <nav className="auth-nav-simple">
          <button type="button" className="brand-logo-btn" onClick={navigateToHome}>
            <span className="brand-dot"></span>
            <span className="brand-title">JourneyNavi</span>
          </button>
        </nav>

        <div className="auth-card-container">
          <div className="auth-card">
            <div className="auth-form-header">
              <h2>{isSignIn ? 'Welcome back' : 'Create an account'}</h2>
              <p>
                {isSignIn
                  ? 'Enter your credentials to access your workspace.'
                  : 'Start routing, tracking, and budgeting today.'}
              </p>
            </div>

            {error && (
              <div className="auth-error-alert" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="auth-actual-form" noValidate>
              {!isSignIn && (
                <div className="popping-input-group">
                  <label htmlFor="name">Full name</label>
                  <div className="input-shell">
                    <span className="input-icon"><UserIcon /></span>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="popping-input-group">
                <label htmlFor="email">Email address</label>
                <div className="input-shell">
                  <span className="input-icon"><MailIcon /></span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="popping-input-group">
                <label htmlFor="password">Password</label>
                <div className="input-shell">
                  <span className="input-icon"><LockIcon /></span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignIn ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="has-toggle"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {isSignIn && (
                <div className="form-helper-row">
                  <button type="button" className="forgot-link">Forgot password?</button>
                </div>
              )}

              <button type="submit" className="popping-submit-btn">
                {isSignIn ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="guest-divider">
              <span>OR</span>
            </div>

            <button type="button" className="guest-action-btn" onClick={handleGuestEntry}>
              Continue as Guest
            </button>

            <div className="auth-switch-footer">
              {isSignIn ? (
                <p>Don't have an account? <button type="button" onClick={() => setCurrentView('signup')}>Sign up</button></p>
              ) : (
                <p>Already have an account? <button type="button" onClick={() => setCurrentView('signin')}>Sign in</button></p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN LANDING PAGE VIEW
  // ==========================================
  return (
    <div className="landing-page-wrapper">
      <nav className="landing-top-nav">
        <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="brand-dot"></span>
          <span className="brand-title">JourneyNavi</span>
        </div>

        <div className="landing-nav-right">
          <button className="nav-ghost-btn" onClick={() => setCurrentView('signin')}>Sign in</button>
          <button className="nav-solid-btn" onClick={() => setCurrentView('signup')}>Sign up</button>
          <div className="nav-divider"></div>
          <button className="admin-access-btn" onClick={onOpenAdminModal}>
            <span>🛡️</span> Admin Console
          </button>
        </div>
      </nav>

      <main className="landing-hero-container">
        <span className="metadata-tag">BCA 4TH SEMESTER PROJECT</span>
        <h1 className="hero-main-title">
          Smart geospatial routing <br />
          <span className="hero-highlight">made simple &amp; fast.</span>
        </h1>
        <p className="hero-subtitle">
          An intuitive routing and spatial discovery platform built on OpenStreetMap networks
          and OSRM matrices. Plan trips, calculate expenses, and explore locations effortlessly.
        </p>
        <div className="hero-cta-group">
          <button className="hero-primary-btn" onClick={() => setCurrentView('signup')}>
            Launch application
          </button>
          <button className="hero-secondary-btn" onClick={handleGuestEntry}>
            Try as Guest
          </button>
        </div>

        <div className="architectural-grid">
          <div className="grid-item">
            <h3>🌍 Live OSM nodes</h3>
            <p>Instantly search hotels, gas stations, hospitals, and cafes within your target radius.</p>
          </div>
          <div className="grid-item">
            <h3>🗺️ OSRM routing</h3>
            <p>Get precise turn-by-turn driving polylines, exact travel distances, and durations.</p>
          </div>
          <div className="grid-item">
            <h3>💰 Trip budgeting</h3>
            <p>Calculate estimated fuel consumption and expenses dynamically against your budget.</p>
          </div>
        </div>
      </main>
    </div>
  );
}