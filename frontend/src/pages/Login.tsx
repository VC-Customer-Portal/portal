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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RocketIcon, ExclamationTriangleIcon, EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { Hash, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

const Login: React.FC = () => {
  // variables to hold states for values
  const [capVal, setCapVal] = useState<string | null>(null)
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function used to login the User
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountNumber, password, capVal }),
    });
    
    const data = await response.json();
    if (response.ok) {
      sessionStorage.setItem('sessionToken', data.sessionToken);
      setMessage('OTP sent! Please check your email to continue.');
      setIsError(false);
      sessionStorage.setItem('isAuthenticated', 'true');
      setTimeout(() => {
        window.location.replace('/otp');
        setIsLoading(false);
      }, 5000);
    } else {
      setMessage(data.message || 'Login failed. Please check your credentials.');
      setIsError(true);
      setIsLoading(false);
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
            <CardTitle>Login</CardTitle>
            <CardDescription>Login to use the Portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid w-full items-center gap-4">
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
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5 relative">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                      disabled={isLoading}
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
              </div>
              <CardFooter className="flex flex-col items-center justify-center mt-4 space-y-3">
                <Link to="/forgotpassword" className="text-blue-700 hover:underline">
                  Forgot Password?
                </Link>
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_SITE_KEY}
                  onChange={(val) => setCapVal(val)}
                />
                <Button className="bg-green-600 hover:bg-green-950 w-full" type="submit" disabled={!capVal || isLoading}>
                  Submit
                </Button>
              </CardFooter>

            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Login;
