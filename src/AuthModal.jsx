import React, { useState } from 'react';

const AuthModal = () => {
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
          // Save user data (e.g., to localStorage or React state context)
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('Logged in user:', data.user);
        } else {
          // --- SIGN UP SUCCESS ---
          // Reset input form
          setFormData({ name: '', email: '', password: '' });
        }
      } else {
        // Backend returned a validation or database error
        setStatus({ text: data.message, isError: true });
      }
    } catch (error) {
      // Network or Apache server connection error
      setStatus({ 
        text: 'Unable to reach the server. Make sure Apache is running in XAMPP.', 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-container" style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>

      {/* Response Message Banner */}
      {status.text && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          color: status.isError ? '#721c24' : '#155724',
          backgroundColor: status.isError ? '#f8d7da' : '#d4edda',
          borderRadius: '4px'
        }}>
          {status.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name input only shows during Sign Up */}
        {isSignUp && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block' }}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block' }}>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      {/* Mode Switcher */}
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
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
            color: '#007bff', 
            cursor: 'pointer', 
            textDecoration: 'underline' 
          }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default AuthModal;