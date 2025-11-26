import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const HomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Home Page</h1>
      {user ? (
        <p>Welcome back, {user.username}! Go to your <Link to="/workout">Workouts</Link> or <Link to="/user">Profile</Link>.</p>
      ) : (
        <p>Welcome to the Gym Journal App! Please <Link to="/user">Login or Register</Link> to get started.</p>
      )}
    </div>
  );
};

export default HomePage;