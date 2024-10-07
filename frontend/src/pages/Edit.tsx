import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useEffect, useState } from 'react';
import { Pencil2Icon, ExclamationTriangleIcon, EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { Skeleton } from "@/components/ui/skeleton";

interface EditProps {
    onEdit: (message: string, time: string) => void;
}

interface User {
    fullname: string;
    email: string;
    account_number: string;
}

const Edit: React.FC<EditProps> = ({ onEdit }) => {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const [user, setUser] = useState<User | null>(null);
    const [originalUser, setOriginalUser] = useState<User | null>(null); // New state for original user
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [changedPassword, setChangedPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [accountNumber, setAccountNumber] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const passwordRequirements = {
        hasUpperCase: /[A-Z]/.test(changedPassword),
        hasLowerCase: /[a-z]/.test(changedPassword),
        hasNumber: /\d/.test(changedPassword),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(changedPassword),
        isValidLength: changedPassword.length >= 8,
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/userdetails`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token: sessionToken })
                });
                const data = await response.json();

                if (response.ok) {
                    setUser(data.user);
                    setOriginalUser(data.user); // Set original user data
                } else {
                    console.error(data.message);
                }
            } catch (error) {
                console.error("Error fetching payments:", error);
            }
        };

        fetchPayments();
    }, [sessionToken]);

    useEffect(() => {
        if (user) {
            setFullname(user.fullname);
            setEmail(user.email);
            setAccountNumber(user.account_number);
        }
    }, [user]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleUserSaveChanges = async () => {
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/edituser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: sessionToken, fullname: fullname, email: email }),
        });

        const result = await response.json();
        if (response.ok) {
            onEdit('Edited User successful!', Date().toLocaleString());
            setMessage('Changes saved successfully!');
            setIsError(false);
        } else {
            setMessage(result.message);
            setIsError(true);
        }
    };

    const handlePasswordSaveChanges = async () => {

        try{
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/changepassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: sessionToken, password: currentPassword, newpassword: changedPassword }),
        });

        const result = await response.json();
        if (response.ok) {
            setMessage('Changed Password successfully!');
            setIsError(false);
            setIsLoading(true);
            handleLogout();
            setTimeout(() => {
                onEdit('Changed User Password!', Date().toLocaleString());
                setIsLoading(false);
                window.location.replace('/login');
            }, 5000);
        } else {
            setMessage(result.message);
            setIsError(true);
        }
    } catch (error) {
        setIsError(true)
        setMessage("Error Sending Contact payment.");
    }
    };

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
          sessionStorage.removeItem('isAuthenticated');
          sessionStorage.removeItem('notifications');
          sessionStorage.removeItem('sessionToken');
          sessionStorage.removeItem('otpComplete');
        } else {
        }
    
    
      };

    // Check if changes have been made
    const hasChanges = () => {
        return (
            originalUser &&
            (fullname !== originalUser.fullname || email !== originalUser.email)
        );
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {message && (
                <Alert
                    variant="default"
                    className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md"
                >
                    {isError ? (
                        <ExclamationTriangleIcon className="h-8 w-8 mr-2 " />
                    ) : (
                        <Pencil2Icon className="h-8 w-8 mr-2 text-green-400" />
                    )}
                    <AlertTitle className={`text-lg ${isError ? "text-red-600" : "text-green-500"}`}>
                        {isError ? "Error Occurred!" : "Lets Go!"}
                    </AlertTitle>
                    <AlertDescription className={`text-lg ${isError ? "text-red-600" : "text-black"}`}>
                        {message}
                    </AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <div className="flex flex-col space-y-3">
                    <Skeleton className="h-[200px] w-[400px] rounded-xl" style={{ backgroundColor: '#cde74c' }} />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[400px]" style={{ backgroundColor: '#cde74c' }} />
                        <Skeleton className="h-4 w-[400px]" style={{ backgroundColor: '#cde74c' }} />
                    </div>
                </div>
            ) : (
                <Tabs defaultValue="account" className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account</CardTitle>
                                <CardDescription>
                                    Make changes to your account here. Click save when you're done.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Account Number:</Label>
                                    <Input
                                        id="name"
                                        value={accountNumber}
                                        disabled={true}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fullname">Full Name:</Label>
                                    <Input
                                        id="fullname"
                                        value={fullname}
                                        onChange={(e) => setFullname(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="email">Email:</Label>
                                    <Input
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleUserSaveChanges} disabled={!hasChanges()}>
                                    Save changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    <TabsContent value="password">
                        <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>
                                    Change your password here. After saving, you'll be logged out.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex flex-col space-y-1.5 relative">
                                    <Label htmlFor="password">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                        >
                                            {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1.5 relative">
                                    <Label htmlFor="confirmPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            value={changedPassword}
                                            onChange={(e) => setChangedPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                        >
                                            {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                        </button>
                                    </div>
                                    {/* Show password requirements only if not valid */}
                                    {!isPasswordValid && (
                                        <div className="mt-2 text-sm">
                                            <div className={`flex items-center ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                                                {passwordRequirements.hasUpperCase ? '✔️' : '❌'} One uppercase letter
                                            </div>
                                            <div className={`flex items-center ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                                                {passwordRequirements.hasLowerCase ? '✔️' : '❌'} One lowercase letter
                                            </div>
                                            <div className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                                                {passwordRequirements.hasNumber ? '✔️' : '❌'} One number
                                            </div>
                                            <div className={`flex items-center ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                                                {passwordRequirements.hasSpecialChar ? '✔️' : '❌'} One special character
                                            </div>
                                            <div className={`flex items-center ${passwordRequirements.isValidLength ? 'text-green-600' : 'text-red-600'}`}>
                                                {passwordRequirements.isValidLength ? '✔️' : '❌'} At least 8 characters
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handlePasswordSaveChanges}>Save password</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

export default Edit;
