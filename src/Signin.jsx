import React, { useState } from 'react';

export default function Signin({ onSwitchToSignup, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost/journeynavi-backend/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', email, password })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onLoginSuccess(data.user); // Passes user profile data (name, email) up
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to connect to the server.');
    }
  };

  return (
    <div className="auth-card">
      <h2>Welcome Back</h2>
      <form onSubmit={handleSignin}>
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="editorial-input" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="editorial-input" />
        <button type="submit" className="admin-submit-btn">Sign In</button>
      </form>
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
        Don't have an account? <button type="button" onClick={onSwitchToSignup} className="link-btn">Sign Up</button>
      </p>
    </div>
  );
}