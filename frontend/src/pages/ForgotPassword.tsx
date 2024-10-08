import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Hash } from 'lucide-react';

const ForgotPassword: React.FC = () => {
    // variables to hold states for values
    const sessionToken = sessionStorage.getItem('sessionToken');
    const [accountNumber, setAccountNumber] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Function used to submit the Users account Number to reset password
    const handleForgot = async () => {
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/forgotpassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountNumber: accountNumber, token: sessionToken }),
        });

        const data = await response.json();
        if (response.ok) {
            setMessage('Reset Password Email Sent');
            setIsError(false);
            setIsLoading(true);
            handleLogout();
            setTimeout(() => {
                setIsLoading(false);
                window.location.replace('/login');
            }, 5000);
        } else {
            setMessage(data.message);
            setIsError(true);
        }
    };

    // Function used to Logout the User for them to login with new password
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

    // Use Effect to Set Messages
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
                        <RocketIcon className="h-8 w-8 mr-2 text-green-400" />
                    )}
                    <AlertTitle className={`text-lg ${isError ? "text-red-600" : "text-green-500"}`}>
                        {isError ? "Error Occurred!" : "Heads-Up!"}
                    </AlertTitle>
                    <AlertDescription className={`text-lg ${isError ? "text-red-600" : "text-black"}`}>{message}</AlertDescription>
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
                <Card className="w-[350px] -mt-40">
                    <CardHeader>
                        <CardTitle>Forgot Password</CardTitle>
                        <CardDescription>Use your Account Number to Reset Password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleForgot}>
                            <div className="flex flex-col space-y-1.5 relative">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <div className="relative">
                                    <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        id="accountNumber"
                                        type="text"
                                        placeholder="Account Number"
                                        value={accountNumber}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value) && value.length <= 8) {
                                                setAccountNumber(value);
                                            }
                                        }}
                                        required
                                        className="pl-10 pr-10"
                                    />
                                </div>
                            </div>
                            <CardFooter className="flex justify-center mt-4">
                                <Button className='bg-green-600 hover:bg-green-950 w-full' type="submit">Submit</Button>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default ForgotPassword;
