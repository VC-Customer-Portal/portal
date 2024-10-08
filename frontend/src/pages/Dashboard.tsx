import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRightIcon, ExclamationTriangleIcon, Pencil2Icon } from "@radix-ui/react-icons";
import User from "@/models/User";
import { useNavigate } from "react-router-dom";


const Dashboard: React.FC = () => {
  // variables to hold states for values
  const sessionToken = sessionStorage.getItem('sessionToken');
  const [user, setUser] = useState<User | null>(null);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSending, setIsSending] = useState(false)
  const navigate = useNavigate();
  const PaymentLogos = [
    "https://download.logo.wine/logo/Stripe_(company)/Stripe_(company)-Logo.wine.png",
    "https://download.logo.wine/logo/Apple_Pay/Apple_Pay-Logo.wine.png",
    "https://www.transparentpng.com/thumb/credit-card/8p4jX1-blank-credit-card-pic.png",
    "https://upload.wikimedia.org/wikipedia/commons/a/a4/Paypal_2014_logo.png",
  ]

  // Clear the Contact form after submitting
  const clearContactFields = () => {
    setFullname("");
    setEmail("");
    setContactMessage("");
  };

  // Function used to submit the Contact Form
  const handleContactSend = async (e: React.FormEvent) => {
    setIsSending(true)
    e.preventDefault();

    const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/customerform`, {
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



  /*
      UseEffects used to:
      - Fetch the user on page load
      - Set the Fullname and Email in Contact Form
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
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchUser();
  }, [sessionToken]);

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % PaymentLogos.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user) {
      setFullname(user.fullname);
      setEmail(user.email);
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
      <div className="space-y-8 m-10">
        <Card className="w-full bg-gradient-to-br from-purple-900 to-blue-900 text-white overflow-hidden">
          <CardContent className="p-12 flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-1/2 space-y-6">
              <h2 className="text-5xl font-bold leading-tight">TRUST IN EVERY TRANSACTION</h2>
              <p className="text-3xl">
                Welcome to PayView, your safe haven for online transactions! We help you make secure payments to simplify your life.
              </p>
              <Button variant="outline" size="lg" className="bg-white text-purple-900 hover:bg-purple-100"
                onClick={() => navigate("/mypayments")}>
                View Payment <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="w-full md:w-1/2 mt-8 md:mt-0">
              <img
                src="https://res.cloudinary.com/dbvvqq2p7/image/upload/v1728404463/home.jpg"
                alt="Secure Transaction Cube"
                className="w-full max-w-lg mx-auto"
              />
            </div>
          </CardContent>
        </Card>

        <div className="overflow-hidden w-full py-8 bg-gray-100">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 20}%)` }}
          >
            {PaymentLogos.concat(PaymentLogos).map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt={`Payment Option ${index + 1}`}
                className="w-1/5 flex-shrink-0 px-4"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 m-10"> {/* Changed items-start to items-center */}
          <div className="text-white w-full md:w-1/2 flex flex-col justify-center"> {/* Added flex and justify-center */}
            <h2 className="text-3xl font-bold mb-2">CONTACT US</h2>
            <h3 className="text-6xl font-bold text-yellow-300 mb-4">LET US HANDLE YOUR QUERIES</h3>
            <p className="text-gray-300 text-2xl">
              Contact us for questions, technical assistance, or collaboration opportunities via the contact information provided.
            </p>
          </div>

          <Card className="w-full md:w-1/2" id="contact">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Get in Touch</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleContactSend}>
                <div>
                  <Input placeholder="Name" className="w-full"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    disabled={true} />
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
                    disabled={true} />
                </div>
                <div>
                  <Textarea placeholder="Message" className="w-full h-32"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    disabled={isSending} />
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
    </div>
  );
};

export default Dashboard;
