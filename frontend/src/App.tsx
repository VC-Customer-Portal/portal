import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import './App.css';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import Edit from './pages/Edit';
import EmployeeLogin from './pages/EmployeeLogin';
import Otp from './pages/Otp';
import UserPayments from './pages/UserPayments';
import Payment from './pages/Payment';
import ForgotPassword from './pages/ForgotPassword';
import MobileNavbar from './components/MobileNavbar';
import Footer from './components/Footer';
import TransactionHistory from './pages/TransactionHistory';
import Users from './pages/Users';

function App() {
  // Variables to hold states for values
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });
  const [isEmployee, setIsEmployee] = useState<boolean>(() => {
    return sessionStorage.getItem('isEmployee') === 'true';
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
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });


  /*
    Methods used when user triggers:
      OnLogin
      OnRegister
      OnPayment
      OnEdit
  */
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

  // Function used to Logout after the user clicks Logout
  const handleLogout = async () => {
    const sessionToken = sessionStorage.getItem('sessionToken')
    const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    });

    await response.json();
    if (response.ok) {
      setIsAuthenticated(false);
      setIsEmployee(false);
      setOtpComplete(false)
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('isEmployee');
      setNotifications([]);
      sessionStorage.removeItem('notifications');
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('otpComplete');
      sessionStorage.removeItem('chatMessages');
    } else {
    }


  };



  /*
    UseEffects used to:
    - Set isAuthenticated
    - Update notifications
    - Update Screen Size
    - Get background from CDN with device Width
  */

  useEffect(() => {
    sessionStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateScreenWidth);
    updateScreenWidth();

    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  useEffect(() => {
    setCloudinaryImageUrl(`https://res.cloudinary.com/dbvvqq2p7/image/upload/w_${screenWidth}/q_auto:best/f_auto/backgroud_cloud_desktop_ybebmh.png`);
  }, [screenWidth]);

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem('isAuthenticated') === 'true');
    setIsEmployee(sessionStorage.getItem('isEmployee') === 'true');
  }, []);  

  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
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
            zIndex: -1,
          }}
        />
        {isDesktop ? (
          <Navbar
            isAuthenticated={otpComplete}
            isEmployee={isEmployee}
            onLogout={handleLogout}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        ) : (
          <MobileNavbar
            isAuthenticated={otpComplete}
            isEmployee={isEmployee}
            onLogout={handleLogout}
          />
        )}
        <div className="App">
          <Routes>

            <Route
              path="/employeelogin"
              element={<EmployeeLogin />}
            />
            <Route
              path="/transactionhistory"
              element={isAuthenticated && isEmployee ? <TransactionHistory /> : <Navigate to="/login" />}
            />
            <Route
              path="/users"
              element={isAuthenticated && isEmployee ? <Users /> : <Navigate to="/login" />}
            />
            <Route
              path="/register"
              element={!isAuthenticated ? <Register onRegister={handleRegister} /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/login"
              element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/forgotpassword"
              element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/otp"
              element={isAuthenticated && !otpComplete ? <Otp onLogin={handleOtp} /> : <Navigate to="/login" />}
            />
            <Route
              path="/dashboard"
              element={isAuthenticated && otpComplete && !isEmployee ? <Dashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/edit"
              element={(isAuthenticated && otpComplete) || isEmployee ? <Edit onEdit={handleUserEdit} /> : <Navigate to="/login" />}
            />
            <Route
              path="/payment"
              element={isAuthenticated && otpComplete && !isEmployee ? <Payment onPayment={handlePayment} /> : <Navigate to="/login" />}
            />
            <Route
              path="/mypayments"
              element={isAuthenticated && otpComplete && !isEmployee ? <UserPayments /> : <Navigate to="/login" />}
            />
            <Route
              path="*"
              element={<Navigate to="/login" />}
            />
          </Routes>
        </div>
        <Footer />
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




