import { useNavigate } from 'react-router-dom';
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
import { RocketIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await fetch('https://curious-jelly-e94532.netlify.app/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      onLogin();
      setMessage('Login successful! Redirecting to dashboard...');
      setIsError(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      const data = await response.json();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Login</h2>
      {message && (
        <Alert
          variant={isError ? "destructive" : "default"} // Conditional variant
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md"
        >
          {isError ? (
            <ExclamationTriangleIcon className="h-8 w-8 mr-2" />
          ) : (
            <RocketIcon className="h-8 w-8 mr-2 text-green-400" />
          )}
          <AlertTitle className='text-lg'>Heads up!</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Login to use the Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className='mt-4'>
            <a href="/register" className='text-blue-300 hover:text-blue-600 font-bold'>Register Here</a>
            </div>
            <CardFooter className="flex justify-center mt-4">
              <Button className='bg-green-600 hover:bg-green-950' type="submit">Submit</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
