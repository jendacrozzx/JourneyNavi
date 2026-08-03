import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, onGuestLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess({ email, name: isSignUp ? name : 'User' });
  };

  const styles = {
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
      backgroundColor: '#ffffff',
      width: '100%',
      maxWidth: '420px',
      borderRadius: '20px',
      padding: '2.5rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      boxSizing: 'border-box',
      position: 'relative',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1.5rem',
    },
    pill: {
      display: 'inline-block',
      fontSize: '0.7rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      marginBottom: '0.5rem',
    },
    title: {
      fontSize: '1.45rem',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0,
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.75rem',
      color: '#64748b',
      cursor: 'pointer',
      padding: 0,
      lineHeight: 1,
    },
    tabs: {
      display: 'flex',
      backgroundColor: '#f1f5f9',
      padding: '4px',
      borderRadius: '12px',
      marginBottom: '1.5rem',
    },
    tab: (active) => ({
      flex: 1,
      backgroundColor: active ? '#ffffff' : 'transparent',
      border: 'none',
      padding: '0.625rem',
      fontWeight: '600',
      fontSize: '0.9rem',
      color: active ? '#0f172a' : '#64748b',
      borderRadius: '9px',
      cursor: 'pointer',
      boxShadow: active ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
      transition: 'all 0.2s ease',
    }),
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.125rem',
    },
    group: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
      textAlign: 'left',
    },
    label: {
      fontSize: '0.8rem',
      fontWeight: '600',
      color: '#475569',
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1px solid #cbd5e1',
      borderRadius: '10px',
      fontSize: '0.95rem',
      color: '#0f172a',
      outline: 'none',
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc',
    },
    submitBtn: {
      width: '100%',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
      padding: '0.875rem',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '0.95rem',
      cursor: 'pointer',
      marginTop: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'center',
      margin: '1.5rem 0',
      color: '#94a3b8',
      fontSize: '0.8rem',
      fontWeight: '500',
    },
    dividerLine: {
      flex: 1,
      borderBottom: '1px solid #e2e8f0',
    },
    dividerText: {
      padding: '0 0.75rem',
    },
    guestBtn: {
      width: '100%',
      backgroundColor: '#f8fafc',
      color: '#334155',
      border: '1px solid #cbd5e1',
      padding: '0.875rem',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '0.95rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        
        <div style={styles.header}>
          <div>
            <span style={styles.pill}>{isSignUp ? 'Create Account' : 'Welcome Back'}</span>
            <h3 style={styles.title}>{isSignUp ? 'Join JourneyNavi' : 'Sign In to Workspace'}</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div style={styles.tabs}>
          <button type="button" style={styles.tab(!isSignUp)} onClick={() => setIsSignUp(false)}>
            Sign In
          </button>
          <button type="button" style={styles.tab(isSignUp)} onClick={() => setIsSignUp(true)}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.group}>
              <label style={styles.label}>Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={styles.input}
                required 
              />
            </div>
          )}
          <div style={styles.group}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={styles.input}
              required 
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={styles.input}
              required 
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            {isSignUp ? 'Create Account ➔' : 'Sign In ➔'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or explore freely</span>
          <div style={styles.dividerLine} />
        </div>

        <button type="button" style={styles.guestBtn} onClick={onGuestLogin}>
          🧭 Continue as Guest Mode
        </button>

      </div>
    </div>
  );
}