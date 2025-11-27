import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import { registerUser, loginUser } from './services/auth';

const UserPage = () => {
  const { user, loading, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRegisterClick = async () => {
    setError('');
    setMessage('');
    try {
      const registeredUser = await registerUser(username, password);
      setMessage(`User ${registeredUser.username} registered successfully! Please log in.`);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoginClick = async () => {
    setError('');
    setMessage('');
    try {
      const data = await loginUser(username, password);
      const token = data.access_token;
      login(token, { username: username });
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading user data...</p>;
  }

  return (
    <div>
      <h1>User Page</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {user ? (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <p>This is your profile page.</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <h2>Login / Register</h2>
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button onClick={handleLoginClick} style={{ marginRight: '10px' }}>Login</button>
          <button onClick={handleRegisterClick}>Register</button>
        </div>
      )}
    </div>
  );
};

export default UserPage;
