import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { RocketIcon, ExclamationTriangleIcon, EyeClosedIcon, EyeOpenIcon, PersonIcon } from "@radix-ui/react-icons";
import { Skeleton } from '@/components/ui/skeleton';
import { AtSign, Lock } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

// Props Used to send message to be displayed in Notification Panel
interface RegisterProps {
  onRegister: (message: string, time: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  // Variables to hold states for values
  const [capVal, setCapVal] = useState<string | null>(null)
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isValidLength: password.length >= 8,
  };
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  // Function used to submit the Register Form
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    if (!capVal) {
      setMessage("Please complete the CAPTCHA.");
      setIsError(true);
      return;
    }

    setIsLoading(true);

    const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullname, email, password, capVal }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage('Registration successful! Redirecting to login...');
      setIsError(false);
      setTimeout(() => {
        navigate('/login');
        onRegister('Registration Successful', Date().toLocaleString());
        setIsLoading(false);
      }, 5000);
    } else {
      setMessage(data.message);
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
        <Card className="w-[350px] mt-20 mb-20">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Create an account to use the Portal. Make sure email is real to recieve Confirmation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5 relative">
                  <Label htmlFor="fullname">Fullname</Label>
                  <div className="relative">
                    <PersonIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                    <Input
                      id="fullname"
                      type="text"
                      placeholder="Fullname"
                      value={fullname}
                      onChange={(e) => {
                        const value = e.target.value;
                        const regex = /^[A-Za-z\s]*$/;
                        if (regex.test(value)) {
                          setFullname(value);
                        }
                      }}
                      required
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5 relative">
                  <Label htmlFor="email">Email</Label>
                  <div className='relative'>
                    <AtSign className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(email)) {
                          setEmail('');
                          setIsError(true);
                          setMessage('Please Enter Valid Email Address');
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
                <div className="flex flex-col space-y-1.5 relative">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                      disabled={!isPasswordValid || isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
              </div>
              <CardFooter className="flex flex-col items-center mt-4 space-y-4">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_SITE_KEY}
                  onChange={(val) => setCapVal(val)}
                />
                <Button
                  type="submit"
                  disabled={!capVal || !isPasswordValid || isLoading}
                  className="w-full bg-green-600 hover:bg-green-950"
                >
                  Register
                </Button>
              </CardFooter>

            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default Register;
