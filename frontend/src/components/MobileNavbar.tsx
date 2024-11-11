// MobileNavbar.tsx
import { Link } from "react-router-dom";
import { CSSProperties, useState } from 'react';
import { Menu } from "lucide-react";

interface MobileNavbarProps {
    isAuthenticated: boolean;
    onLogout: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ isAuthenticated, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen((prev) => !prev);

    return (
        <nav style={mobileNavbarStyles.navbar}>
            <Link to="/dashboard" style={mobileNavbarStyles.logoLink}>
                <img
                    src="https://res.cloudinary.com/dbvvqq2p7/image/upload/w_100/q_auto:best/f_auto/payview-high-resolution-logo-transparent_x0iaii.png"
                    alt="logo"
                    style={mobileNavbarStyles.logoImage}
                />
                <span className="ml-3 font-bold text-white text-lg">PayView Payment Portal</span>
            </Link>
            <button onClick={toggleMenu} style={mobileNavbarStyles.burgerButton}>
                <Menu />
            </button>
            {isOpen && (
                <div style={mobileNavbarStyles.menu}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/payment" style={mobileNavbarStyles.menuItem}>Make Payment</Link>
                            <Link to="/dashboard" style={mobileNavbarStyles.menuItem}>Dashboard</Link>
                            <Link to="/mypayments" style={mobileNavbarStyles.menuItem}>View Payments</Link>
                            <button onClick={onLogout} style={mobileNavbarStyles.menuItem}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={mobileNavbarStyles.menuItem}>Login</Link>
                            <Link to="/register" style={mobileNavbarStyles.menuItem}>Register</Link>
                            
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

// Styles
const mobileNavbarStyles: { [key: string]: CSSProperties } = {
    navbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '50px',
        padding: '0 20px',
        backgroundColor: '#664ce7',
    },
    logoLink: {
        display: 'flex',
        alignItems: 'center',
    },
    logoImage: {
        height: '40px',
        objectFit: 'contain',
    },
    burgerButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'white',
    },
    menu: {
        position: 'absolute',
        top: '50px',
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        padding: '10px',
        zIndex: 1000,
    },
    menuItem: {
        display: 'block',
        padding: '10px',
        color: '#664ce7',
        textDecoration: 'none',
    },
};

export default MobileNavbar;
