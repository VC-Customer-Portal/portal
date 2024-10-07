import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon, Pencil2Icon } from "@radix-ui/react-icons";


const Dashboard: React.FC = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSending, setIsSending] = useState(false)

  const clearContactFields = () => {
    setFullname("");
    setEmail("");
    setContactMessage("");
  };

  const handleContactSend = async (e: React.FormEvent) => {
    setIsSending(true)
    e.preventDefault();

    const response = await fetch('http://localhost:8888/api/customerform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullname: fullname, email: email, message: contactMessage }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(data.message);
      setIsError(false);
      clearContactFields();
      setIsSending(false)
    } else {
      setMessage(data.message);
      setIsError(true);
      setIsSending(false)
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
    <div>
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 m-10"> {/* Changed items-start to items-center */}
        <div className="text-white w-full md:w-1/2 flex flex-col justify-center"> {/* Added flex and justify-center */}
          <h2 className="text-3xl font-bold mb-2">CONTACT US</h2>
          <h3 className="text-6xl font-bold text-yellow-300 mb-4">LET US HANDLE YOUR QUERIES</h3>
          <p className="text-gray-300 text-2xl">
            Contact us for questions, technical assistance, or collaboration opportunities via the contact information provided.
          </p>
        </div>

        <Card className="w-full md:w-1/2"> {/* Set width to half for md and above */}
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleContactSend}>
              <div>
                <Input placeholder="Name" className="w-full"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)} 
                  disabled={isSending}/>
              </div>
              <div className="flex gap-4">
                <Input placeholder="Email" className="w-full"
                  type="email"
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
                  disabled={isSending}/>
              </div>
              <div>
                <Textarea placeholder="Message" className="w-full h-32"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)} 
                  disabled={isSending}/>
              </div>
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded"
                type="submit"
                disabled={isSending}>
                SUBMIT NOW
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
