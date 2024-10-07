import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import Edit from './pages/Edit';
import Otp from './pages/Otp';
import UserPayments from './pages/UserPayments';
import Payment from './pages/Payment';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  const [otpComplete, setOtpComplete] = useState<boolean>(() => {
    return sessionStorage.getItem('otpComplete') === 'true';
  });

  const [notifications, setNotifications] = useState<{ message: string; timestamp: string }[]>(() => {
    const storedNotifications = sessionStorage.getItem('notifications');
    return storedNotifications ? JSON.parse(storedNotifications) : [];
  });

  const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);
  const [cloudinaryImageUrl, setCloudinaryImageUrl] = useState<string>("");

  const handleRegister = (message: string) => {
    const timestamp = new Date().toLocaleString();
    setNotifications((prev) => {
      const newNotifications = [...prev, { message, timestamp }];
      sessionStorage.setItem('notifications', JSON.stringify(newNotifications));
      return newNotifications;
    });
  };

  const handleOtp = (message: string) => {
    const timestamp = new Date().toLocaleString();
    setNotifications((prev) => {
      const newNotifications = [...prev, { message, timestamp }];
      sessionStorage.setItem('notifications', JSON.stringify(newNotifications));
      return newNotifications;
    });
    setOtpComplete(true);
    sessionStorage.setItem('otpComplete', 'true');
  };

  const handleUserEdit = (message: string) => {
    const timestamp = new Date().toLocaleString();
    setNotifications((prev) => {
      const newNotifications = [...prev, { message, timestamp }];
      sessionStorage.setItem('notifications', JSON.stringify(newNotifications));
      return newNotifications;
    });
  };

  const handlePayment = (message: string) => {
    const timestamp = new Date().toLocaleString();
    setNotifications((prev) => {
      const newNotifications = [...prev, { message, timestamp }];
      sessionStorage.setItem('notifications', JSON.stringify(newNotifications));
      return newNotifications;
    });
  };

  const handleLogout = async () => {
    const sessionToken = sessionStorage.getItem('sessionToken')
    const response = await fetch('http://localhost:8888/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    });

    await response.json();
    if (response.ok) {
      setIsAuthenticated(false);
      sessionStorage.removeItem('isAuthenticated');
      setNotifications([]);
      sessionStorage.removeItem('notifications');
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('otpComplete');
    } else {
    }


  };

  useEffect(() => {
    sessionStorage.setItem('isAuthenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    sessionStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Handle screen resize and set Cloudinary URL
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateScreenWidth);
    updateScreenWidth(); // Set the initial width

    // Cleanup the event listener
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  useEffect(() => {
    // Update Cloudinary URL based on screen width
    setCloudinaryImageUrl(`https://res.cloudinary.com/dbvvqq2p7/image/upload/w_${screenWidth}/q_auto:best/f_auto/backgroud_cloud_desktop_ybebmh.png`);
  }, [screenWidth]);
  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Image element with object-fit: fill */}
        <img
          src={cloudinaryImageUrl}
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            zIndex: -1, // Ensures image is behind content
          }}
        />
        <Navbar
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          notifications={notifications}
          setNotifications={setNotifications}
        />
        <div className="App">
          <Routes>
            <Route
              path="/register"
              element={!isAuthenticated ? <Register onRegister={handleRegister} /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/login"
              element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/otp"
              element={isAuthenticated && !otpComplete ? <Otp onLogin={handleOtp} /> : <Navigate to="/login" />}
            />
            <Route
              path="/dashboard"
              element={isAuthenticated && otpComplete ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/edit"
              element={isAuthenticated && otpComplete ? <Edit onEdit={handleUserEdit} /> : <Navigate to="/login" />}
            />
            <Route
              path="/payment"
              element={isAuthenticated && otpComplete ? <Payment onPayment={handlePayment} /> : <Navigate to="/login" />}
            />
            <Route
              path="/mypayments"
              element={isAuthenticated && otpComplete ? <UserPayments /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
            />
            <Route
              path="*"
              element={<Navigate to="/login" />}
            />
          </Routes>
        </div>
        <div style={chatContainerStyle}>
          <Chat />
        </div>
      </div>
    </Router>
  );
}

const chatContainerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '300px',
  zIndex: 1000,
};

export default App;
