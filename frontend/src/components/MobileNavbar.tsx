import { Link } from "react-router-dom";
import { CSSProperties, useState } from 'react';
import { Menu } from "lucide-react";

interface MobileNavbarProps {
    isAuthenticated: boolean;
    isEmployee: boolean;
    onLogout: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ isAuthenticated, isEmployee, onLogout }) => {
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
            <button onClick={toggleMenu} style={mobileNavbarStyles.burgerButton} aria-label="Toggle menu">
                <Menu />
            </button>
            {isOpen && (
                <div style={mobileNavbarStyles.menu} role="menu">
                    {isAuthenticated ? (
                        <>
                            <Link to="/payment" style={mobileNavbarStyles.menuItem} role="menuitem">Make Payment</Link>
                            <Link to="/dashboard" style={mobileNavbarStyles.menuItem} role="menuitem">Dashboard</Link>
                            <Link to="/mypayments" style={mobileNavbarStyles.menuItem} role="menuitem">View Payments</Link>
                            <Link to="/edit" style={mobileNavbarStyles.menuItem} role="menuitem">Edit Profile</Link>
                            <button onClick={onLogout} style={mobileNavbarStyles.menuItem} role="menuitem">Logout</button>
                        </>
                    ) : 
                    isEmployee ? (
                        <>
                            <Link to="/transactionhistory" style={mobileNavbarStyles.menuItem} role="menuitem">Transaction History</Link>
                            <Link to="/users" style={mobileNavbarStyles.menuItem} role="menuitem">Users</Link>
                            <Link to="/edit" style={mobileNavbarStyles.menuItem} role="menuitem">Edit Profile</Link>
                            <button onClick={onLogout} style={mobileNavbarStyles.menuItem} role="menuitem">Logout</button>
                        </>
                    ) : (
                    <>
                        <Link to="/login" style={mobileNavbarStyles.menuItem} role="menuitem">Login</Link>
                        <Link to="/register" style={mobileNavbarStyles.menuItem} role="menuitem">Register</Link>
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
        cursor: 'pointer',
        border: 'none',
        background: 'none',
        width: '100%',
        textAlign: 'left',
        fontSize: '16px',
    },
};

export default MobileNavbar;