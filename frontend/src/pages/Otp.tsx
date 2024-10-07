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

interface OtpProps {
    onLogin: (message: string, time: string) => void;
}

const Otp: React.FC<OtpProps> = ({ onLogin }) => {
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (otp.length !== 6) {
            setMessage('Complete OTP'); // Set error message
            setIsError(true);           // Set error state
            return;                     // Exit the function
        }

        const sessionToken = sessionStorage.getItem('sessionToken');
        console.log('Token: ', sessionToken);
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ otp, sessionToken }),
        });

        const data = await response.json();
        if (response.ok) {
            setMessage('Redirecting to Dashboard');
            setIsError(false);
            setIsLoading(true);
            setTimeout(() => {
                window.location.replace('/dashboard');
                onLogin('Successful Login Using OTP', Date().toLocaleString());
                setIsLoading(false);
            }, 5000);
        } else {
            setMessage(data.message);
            setIsError(true);
        }
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Get the input value and filter out non-numeric characters
        const value = e.target.value.replace(/[^0-9]/g, '');
        // Limit the length to 6 characters
        if (value.length <= 6) {
            setOtp(value);
        }
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
                        <CardTitle>OTP</CardTitle>
                        <CardDescription>Use OTP sent to email</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleOtp}>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="otp">OTP</Label>
                                    <Input
                                        id="otp"
                                        type="text" // Change type to text
                                        placeholder="OTP"
                                        value={otp}
                                        onChange={handleInputChange} // Use custom input handler
                                        required
                                    />
                                </div>
                            </div>
                            <CardFooter className="flex justify-center mt-4">
                                <Button className='bg-green-600 hover:bg-green-950' type="submit">Submit</Button>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default Otp;
