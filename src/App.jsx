import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage';
import UserPage from './UserPage';
import WorkoutPage from './WorkoutPage';
import { AuthProvider } from './context/AuthContext';
import './App.css'; 

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <div className="left-panel">
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/user">User Profile</Link>
              </li>
              <li>
                <Link to="/workout">Workouts</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
