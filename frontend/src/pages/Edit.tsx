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
import User from "@/models/User";
import { AtSign, Hash, Lock, UserPen } from "lucide-react";

// Props Used to send message to be displayed in Notification Panel
interface EditProps {
    onEdit: (message: string, time: string) => void;
}

const Edit: React.FC<EditProps> = ({ onEdit }) => {
    // variables to hold states for values
    const sessionToken = sessionStorage.getItem('sessionToken');
    const [user, setUser] = useState<User | null>(null);
    const [originalUser, setOriginalUser] = useState<User | null>(null);
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

    // Values for Password requirement
    /*
        1 Uppercase
        1 Lowercase
        1 Number
        1 Special Character
        is atleast 8 characters long

        IsPasswordValid uses the requirements to return a bool
    */
    const passwordRequirements = {
        hasUpperCase: /[A-Z]/.test(changedPassword),
        hasLowerCase: /[a-z]/.test(changedPassword),
        hasNumber: /\d/.test(changedPassword),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(changedPassword),
        isValidLength: changedPassword.length >= 8,
    };
    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);


    // Function used to submit the Users Update to Edit
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

    // Function used to submit the Users Update to their password
    const handlePasswordSaveChanges = async () => {

        try {
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

    // Function used to Logout after the user changes their password
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

    // Function used to check if the User has made Updates to Edit if not cant submit
    const hasChanges = () => {
        return (
            originalUser &&
            (fullname !== originalUser.fullname || email !== originalUser.email)
        );
    };

    /*
        UseEffects used to:
        - Fetch the user details
        - Set the Fullname and Email and Account Number in Edit Form
        - Display Messages Recieved
    */
    useEffect(() => {
        const fetchUser = async () => {
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
                    setOriginalUser(data.user);
                } else {
                    console.error(data.message);
                }
            } catch (error) {
                console.error("Error fetching payments:", error);
            }
        };

        fetchUser();
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
                                    <div className="relative">
                                        <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                        <Input
                                            id="name"
                                            value={accountNumber}
                                            disabled={true}
                                            className="pl-10 pr-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fullname">Full Name:</Label>
                                    <div className="relative">
                                        <UserPen className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                        <Input
                                            id="fullname"
                                            value={fullname}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const regex = /^[A-Za-z\s]*$/;
                                                if (regex.test(value)) {
                                                    setFullname(value);
                                                }
                                            }}
                                            className="pl-10 pr-10"
                                        />

                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="email">Email:</Label>
                                    <div className='relative'>
                                        <AtSign className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                        <Input
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 pr-10"
                                            onBlur={() => {
                                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                if (!emailRegex.test(email)) {
                                                    setEmail('');
                                                    setIsError(true);
                                                    setMessage('Please Enter Valid Email Address');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleUserSaveChanges} disabled={!hasChanges()} className="w-full">
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
                                        <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="pr-10 pl-10"
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
                                        <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            value={changedPassword}
                                            onChange={(e) => setChangedPassword(e.target.value)}
                                            required
                                            className="pr-10 pl-10"
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
                                <Button onClick={handlePasswordSaveChanges} className="w-full">Save password</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

export default Edit;
