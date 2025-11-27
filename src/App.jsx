import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage';
import UserPage from './UserPage';
import WorkoutPage from './WorkoutPage';
import WorkoutPlanPage from './WorkoutPlanPage';
import { AuthProvider } from './context/AuthProvider';
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
                <Link to="/workout">WorkoutSession</Link>
              </li>
              <li>
                <Link to="/workout-plan">WorkoutPlan</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/workout-plan" element={<WorkoutPlanPage />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
