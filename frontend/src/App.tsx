import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if there's a session stored
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  // Function to log in the user
  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true'); // Store authentication state
  };

  // Function to log out the user
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated'); // Remove authentication state
  };

  useEffect(() => {
    // Sync the state with session storage whenever it changes
    sessionStorage.setItem('isAuthenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  return (
    <Router>
      <div className="App">
        <h1>Welcome to the Customer Portal</h1>
        <Routes>
          {/* Redirect registered or logged-in users from Login and Register pages */}
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
          
          {/* Protect the Dashboard route */}
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          
          {/* Redirect root path to dashboard if authenticated */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          {/* Redirect undefined paths to dashboard */}
          <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
