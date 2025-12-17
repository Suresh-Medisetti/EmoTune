// src/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password UI state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
 // const [forgotNewPassword, setForgotNewPassword] = useState('');
 // const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (isRegistering) {
        await axios.post(`${process.env.REACT_APP_API_URL}/register`, {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('email', formData.email);
        alert('Registered successfully! Please log in.');
        setIsRegistering(false);
      } else {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('email', formData.email);
        if (res.data && res.data.username) {
          onLoginSuccess(res.data.username);
        } else {
          setErrorMessage('Login successful but user info missing.');
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Something went wrong.');
    }
  };

  const handleForgotSubmit = async (e) => {
  e.preventDefault();
  setForgotError('');
  setForgotMessage('');

  if (!forgotEmail) return setForgotError('Please enter your registered email.');

  try {
    const res = await axios.post( `${process.env.REACT_APP_API_URL}/send-reset-link`, new FormData(Object.entries({ email: forgotEmail })));
    setForgotMessage(res.data?.message || 'Reset link sent successfully.');
    setForgotError('');
    setTimeout(() => setShowForgot(false), 1500);
  } catch (err) {
    setForgotError(err.response?.data?.detail || 'Failed to send reset link.');
  }
};



  return (
    <div className="login-backdrop">
      <div className="login-page-header">
        <h1 className="app-title">🎵 EmoTune 🎵</h1>
        <p className="app-subtitle">Feel your emotions through music 🎧</p>
      </div>

      <div className="login-card">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <div className="input-group">
                <input
                  type="text"
                  name="firstname"
                  placeholder="First Name"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="lastname"
                  placeholder="Last Name"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" className="login-button">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="login-options" style={{ justifyContent: 'center', marginTop: '6px' }}>
          {!isRegistering && (
            <button
              type="button"
              className="link-button"
              onClick={() => setShowForgot(true)}
            >
              Forgot Password?
            </button>
          )}
        </div>

        <div className="switch-mode">
          {isRegistering ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setIsRegistering(false)}
              >
                Login
              </button>
            </p>
          ) : (
            <p>
              Don’t have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setIsRegistering(true)}
              >
                Register
              </button>
            </p>
          )}
        </div>
      </div>

      {showForgot && (
  <div className="forgot-modal-backdrop" onClick={() => setShowForgot(false)}>
    <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
      <h3>Forgot Password</h3>

      {/* STEP 1: Ask for email */}
      {!forgotMessage && (
        <form onSubmit={handleForgotSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </div>

          {forgotError && <p className="error-message">{forgotError}</p>}
          {forgotMessage && <p className="success-message">{forgotMessage}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="login-button" style={{ flex: 1 }}>
              Send Reset Link
            </button>
            <button
              type="button"
              className="login-button"
              style={{ flex: 1, background: '#888' }}
              onClick={() => setShowForgot(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: After sending link */}
      {forgotMessage && (
        <div style={{ textAlign: 'center' }}>
          <p className="success-message">{forgotMessage}</p>
          <p style={{ marginTop: '10px', fontSize: '0.95rem' }}>
            Please check your inbox for the reset link.
          </p>
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
};

export default Login;
