import React, { useState } from 'react';

export default function Signup({ onSwitchToSignin, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Use the correct localhost HTTP URL instead of local file path
      const res = await fetch('http://localhost/backend/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', name, email, password })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        alert('Account created! Please sign in.');
        onSwitchToSignin();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to connect to the server. Check if XAMPP Apache is running.');
    }
  };

  return (
    <div className="auth-card">
      <h2>Create Account</h2>
      <form onSubmit={handleSignup}>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="editorial-input" />
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="editorial-input" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="editorial-input" />
        <button type="submit" className="admin-submit-btn">Sign Up</button>
      </form>
      <p>Already have an account? <button type="button" onClick={onSwitchToSignin} className="link-btn">Sign In</button></p>
    </div>
  );
}