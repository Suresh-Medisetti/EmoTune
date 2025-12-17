import React, { useState } from 'react';
import axios from 'axios';

const ResetPassword = () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) return setMessage("Passwords don't match.");

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/forgot-password`, {
        email,
        new_password: newPass
      });
      setMessage(res.data.message || 'Password reset successful!');
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Error resetting password.');
    }
  };

  return (
    <div className="login-backdrop">
      <div className="login-card">
        <h2>Reset Password</h2>
        <form onSubmit={handleReset}>
          <input type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
          <input type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button type="submit" className="login-button">Submit</button>
        </form>
        {message && <p style={{ color: '#fdbb2d' }}>{message}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
