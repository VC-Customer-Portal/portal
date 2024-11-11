import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { CSSProperties } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { BellRing, CircleUserRound, LogOut } from "lucide-react";

interface NavbarProps {
    isAuthenticated: boolean;
    isEmployee: boolean;
    onLogout: () => void;
    notifications: { message: string; timestamp: string }[];
    setNotifications: React.Dispatch<React.SetStateAction<{ message: string; timestamp: string }[]>>;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, isEmployee, onLogout, notifications, setNotifications }) => {
    const handleRemoveNotification = (index: number) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <nav style={navbarStyles.navbar}>
            <Link to="/dashboard" style={navbarStyles.logoLink}>
                <img
                    src="https://res.cloudinary.com/dbvvqq2p7/image/upload/w_100/q_auto:best/f_auto/payview-high-resolution-logo-transparent_x0iaii.png"
                    alt="logo"
                    style={navbarStyles.logoImage}
                />
                <span style={navbarStyles.logoText}>PayView Payment Portal</span>
            </Link>

            <div style={navbarStyles.centerContainer}>
                <NavigationMenu>
                    <NavigationMenuList style={navbarStyles.menuList}>
                        {isAuthenticated && !isEmployee && (
                            <>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/payment" style={navbarStyles.centerLink}>
                                            Make Payment
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/dashboard" style={navbarStyles.centerLink}>
                                            Dashboard
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/mypayments" style={navbarStyles.centerLink}>
                                            View Payments
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </>
                        )}
                        {isEmployee && (
                            <>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/transactionhistory" style={navbarStyles.centerLink}>
                                            Transaction History
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/users" style={navbarStyles.centerLink}>
                                            Users
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </>
                        )}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            <div style={navbarStyles.rightContainer}>
                <NavigationMenu>
                    <NavigationMenuList style={navbarStyles.menuList}>
                        {isAuthenticated || isEmployee ? (
                            <>
                                <NavigationMenuItem className="-mr-5 -mb-1">
                                    <NavigationMenuLink style={navbarStyles.rightLink} asChild>
                                        <button onClick={onLogout}>
                                            <LogOut className="text-red-800 font-bold" />
                                        </button>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>

                                <Sheet>
                                    <SheetTrigger asChild>
                                        <button style={navbarStyles.rightLink}>
                                            <BellRing className="text-yel" />
                                        </button>
                                    </SheetTrigger>
                                    <SheetContent side={"right"}>
                                        <SheetHeader>
                                            <SheetTitle>Notifications</SheetTitle>
                                            <SheetDescription>
                                                {notifications.length > 0 ? (
                                                    <ul style={notificationListStyle}>
                                                        {notifications.map((notification, index) => (
                                                            <li key={index} style={notificationCardStyle}>
                                                                <div style={notificationHeaderStyle}>
                                                                    <span>{notification.message}</span>
                                                                    <button
                                                                        style={closeButtonStyle}
                                                                        onClick={() => handleRemoveNotification(index)}
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                                <small>{notification.timestamp}</small>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>No new notifications.</p>
                                                )}
                                            </SheetDescription>
                                        </SheetHeader>
                                    </SheetContent>
                                </Sheet>

                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/edit" style={navbarStyles.rightLink}>
                                            <CircleUserRound />
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </>
                        ) : (
                            <>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/login" style={navbarStyles.rightLink}>
                                            Login
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link to="/register" style={navbarStyles.rightLink}>
                                            Register
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </>
                        )}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </nav>
    );
};

// Styles
const navbarStyles: { [key: string]: CSSProperties } = {
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
        height: '40px', // Adjust the height of the logo
        objectFit: 'contain', // Ensure the full logo is contained in the space
    },
    logoText: {
        marginLeft: '10px', // Space between the logo and text
        fontWeight: 'bold', // Make text bold
        fontSize: '18px', // Adjust font size
        color: "white"
    },
    centerContainer: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
    },
    menuList: {
        display: 'flex',
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    centerLink: {
        padding: '0 20px',
        color: "white",
        fontWeight: "bold"
    },
    rightContainer: {
        marginLeft: 'auto',
    },
    rightLink: {
        padding: '0 20px',
        color: "white",
        fontWeight: "bold"
    },
};

// Notification styles
const notificationListStyle: CSSProperties = {
    listStyle: 'none',
    padding: 0,
};

const notificationCardStyle: CSSProperties = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '10px',
    position: 'relative',
};

const notificationHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const closeButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
};

export default Navbar;

