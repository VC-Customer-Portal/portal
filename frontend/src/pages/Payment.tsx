import React, { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExclamationTriangleIcon, Pencil2Icon } from "@radix-ui/react-icons";
import CustomSelect from "@/components/ui/customselect";
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import Address from "@/models/Address";
import { AtSignIcon, BackpackIcon, Banknote, CalendarClock, CreditCard, GlobeIcon, HomeIcon, LockKeyhole, PersonStanding, PinIcon, TargetIcon } from "lucide-react";
import User from "@/models/User";

// Props Used to send message to be displayed in Notification Panel
interface PaymentProps {
    onPayment: (message: string, time: string) => void;
}

const Payment: React.FC<PaymentProps> = ({ onPayment }) => {
    // Variables to hold states for values
    const sessionToken = sessionStorage.getItem('sessionToken');
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("credit_card");
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    // Credit Card States
    const [cardEmail, setCardEmail] = useState("");
    const [cardFullName, setCardFullName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [amount, setAmount] = useState("");

    // Paypal States
    const [paypalEmail, setPaypalEmail] = useState("");
    const [paypalFullName, setPaypalFullName] = useState("");
    const [paypalAmount, setPaypalAmount] = useState("");

    // Stripe States
    const [stripeEmail, setStripeEmail] = useState("");
    const [stripeFullName, setStripeFullName] = useState("");
    const [stripeCardNumber, setStripeCardNumber] = useState("");
    const [stripeExpirationDate, setStripeExpirationDate] = useState("");
    const [stripeCvv, setStripeCvv] = useState("");
    const [stripeAmount, setStripeAmount] = useState("");

    // ApplePay States
    const [applePayEmail, setApplePayEmail] = useState("");
    const [applePayName, setApplePayName] = useState("");
    const [appleAmount, setAppleAmount] = useState("");

    // Address States
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [isAddressFromDropdown, setIsAddressFromDropdown] = useState(false);
    const [isSelectEnabled, setIsSelectEnabled] = useState(false);
    const [isAddressEditable, setIsAddressEditable] = useState(true);
    const [streetAddress, setStreetAddress] = useState("");
    const [streetAddress2, setStreetAddress2] = useState("");
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");

    // Used to validate fields
    const validateFields = (fields: string[]) => {
        for (const field of fields) {
            if (field === "") {
                setIsError(true);
                setMessage("Complete all required Fields for payment!");
                return false;
            }
        }
        return true;
    };

    // Used to clear the fields when tabs are changed
    const clearPaymentFields = () => {
        setCardFullName("");
        setCardNumber("");
        setExpirationDate("");
        setCvv("");
        setAmount("");

        setStripeFullName("");
        setStripeCardNumber("");
        setStripeExpirationDate("");
        setStripeCvv("");
        setStripeAmount("");

        setPaypalFullName("");
        setPaypalAmount("");

        setApplePayName("");
        setAppleAmount("");
    };

    /*
        Function Used when a address is saved to check if all fields are complete
        Only called if the address is typed not selected from users addresses
    */
    const handleAddressSave = () => {
        if (!isAddressFromDropdown && (streetAddress === "" || province === "" || city === "" || postalCode === "")) {
            setIsError(true)
            setMessage("Complete all required Fields for address!")
            return
        }
        setIsAddressEditable(false);
    };

    // Function used to set the state of the Address and Paymnet cards
    const handleAddressEdit = () => {
        setIsAddressEditable(true);
    };

    // Function used to set the values of the address when user selects a address from dropdown
    const handleAddressSelect = (selectedAddress: Address | null) => {
        if (selectedAddress) {
            console.log('Selected Address:', selectedAddress);
            setStreetAddress(selectedAddress.line_1);
            setStreetAddress2(selectedAddress.line_2 || '');
            setProvince(selectedAddress.province);
            setCity(selectedAddress.city);
            setPostalCode(selectedAddress.postal_code);
            setSelectedAddressId(selectedAddress.id);
            setIsAddressFromDropdown(true);
        } else {
            console.log('No address selected or address not found.');
            setStreetAddress('');
            setStreetAddress2('');
            setProvince('');
            setCity('');
            setPostalCode('');
            setSelectedAddressId('');
            setIsAddressFromDropdown(false);
        }
    };

    // Function used to Save the address only if the address is typed and not selected from dropdown
    const handleAddress = async () => {

        if (isAddressFromDropdown) {
            return true;
        }

        try {
            const body = JSON.stringify({
                line_1: streetAddress,
                line_2: streetAddress2,
                province: province,
                city: city,
                postal_code: postalCode,
                token: sessionToken
            })
            console.log(body)

            const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/address`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            });

            const data = await response.json();
            if (response.ok) {
                return true;
            } else {
                setIsError(true)
                setMessage(data.message);
                return false;
            }
        } catch (error) {
            setIsError(true)
            setMessage("Error Saving Address.");
            return false;
        }
    };



    /* 
        Helper Functions used to validate the 4 payment methods when user saves them and calls the corresponding 
        save function
    */
    const handleCardSave = () => {
        const requiredFields = [cardEmail, cardFullName, cardNumber, expirationDate, cvv, amount];
        return validateFields(requiredFields);
    };

    const handleStripeSave = () => {
        const requiredFields = [stripeEmail, stripeFullName, stripeCardNumber, stripeExpirationDate, stripeCvv, stripeAmount];
        return validateFields(requiredFields);
    };

    const handlePayPalSave = () => {
        const requiredFields = [paypalEmail, paypalFullName, paypalAmount];
        return validateFields(requiredFields);
    };

    const handleApplePaySave = () => {
        const requiredFields = [applePayEmail, applePayName, appleAmount];
        return validateFields(requiredFields);
    };



    /* 
        Function used to save the 4 payment methods when user clicks the save buttons
    */
    const handleCreditCard = async () => {
        if (!handleCardSave()) return;
        const addressSaved = handleAddress();
        if (!addressSaved) return;
        try {
            const body = JSON.stringify({
                paymentMethod: 1,
                email: cardEmail,
                fullName: cardFullName,
                cardNumber: cardNumber,
                expirationDate: expirationDate,
                cvv: cvv,
                amount: amount,
                token: sessionToken
            })
            console.log(body)

            const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            });

            const data = await response.json();
            if (response.ok) {
                setIsError(false)
                setMessage('Payment successful!');
                setIsLoading(true);
                setTimeout(() => {
                    navigate('/dashboard');
                    onPayment('Credit Card Payment Successful', Date().toLocaleString());
                    setIsLoading(false);
                }, 2000);
            } else {
                setIsError(true)
                setMessage(data.message);
            }
        } catch (error) {
            setIsError(true)
            setMessage("Error processing payment.");
        }
    };

    const handlePaypal = async () => {
        if (!handlePayPalSave()) return;
        const addressSaved = handleAddress();
        if (!addressSaved) return;
        try {
            const body = JSON.stringify({
                paymentMethod: 2,
                email: paypalEmail,
                fullName: paypalFullName,
                amount: paypalAmount,
                token: sessionToken
            })
            console.log(body)

            const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            });

            const data = await response.json();
            if (response.ok) {
                setIsError(false)
                setMessage('Payment successful!');
                setIsLoading(true);
                setTimeout(() => {
                    navigate('/dashboard');
                    onPayment('PayPal Payment Successful', Date().toLocaleString());
                    setIsLoading(false);
                }, 2000);
            } else {
                setIsError(true)
                setMessage(data.message);
            }
        } catch (error) {
            setIsError(true)
            setMessage("Error processing payment.");
        }
    };

    const handleStripe = async () => {
        if (!handleStripeSave()) return;
        const addressSaved = handleAddress();
        if (!addressSaved) return;
        try {
            const body = JSON.stringify({
                paymentMethod: 3,
                email: stripeEmail,
                fullName: stripeFullName,
                cardNumber: stripeCardNumber,
                expirationDate: stripeExpirationDate,
                cvv: stripeCvv,
                amount: stripeAmount,
                token: sessionToken
            })

            console.log(body)
            const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            });

            const data = await response.json();
            if (response.ok) {
                setIsError(false)
                setMessage('Payment successful!');
                setIsLoading(true);
                setTimeout(() => {
                    navigate('/dashboard');
                    onPayment('Stripe Payment Successful', Date().toLocaleString());
                    setIsLoading(false);
                }, 2000);
            } else {
                setIsError(true)
                setMessage(data.message);
            }
        } catch (error) {
            setIsError(true)
            setMessage("Error processing payment.");
        }
    };

    const handleApplePay = async () => {
        if (!handleApplePaySave()) return;
        const addressSaved = handleAddress();
        if (!addressSaved) return;
        try {
            const body = JSON.stringify({
                paymentMethod: 4,
                email: applePayEmail,
                fullName: applePayName,
                amount: appleAmount,
                token: sessionToken
            })
            console.log(body)

            const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            });

            const data = await response.json();
            if (response.ok) {
                setIsError(false)
                setMessage('Payment successful!');
                setIsLoading(true);
                setTimeout(() => {
                    navigate('/dashboard');
                    onPayment('Apple Pay Payment Successful', Date().toLocaleString());
                    setIsLoading(false);
                }, 2000);
            } else {
                setIsError(true)
                setMessage(data.message);
            }
        } catch (error) {
            setIsError(true)
            setMessage("Error processing payment.");
        }
    };



    /*
        UseEffects used to:
        - Fetch the users addresses
        - Fetch the users details
        - Clear Payment fields when tab is chnaged
        - Set the Fullname and Email for the Paymnents
        - Display Messages Recieved
    */
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/myaddresses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token: sessionToken })
                });
                const data = await response.json();

                if (response.ok) {
                    setAddresses(data.addresses);
                    console.log('Fetched Addresses:', data.addresses);
                } else {
                    console.error(data.message);
                }
            } catch (error) {
                console.error("Error fetching addresses:", error);
            }
        };

        fetchAddresses();
    }, [sessionToken]);

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

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        clearPaymentFields();
    }, [activeTab]);

    useEffect(() => {
        if (user) {
            setCardEmail(user.email);
            setPaypalEmail(user.email);
            setStripeEmail(user.email);
            setApplePayEmail(user.email);
        }
    }, [user]);



    return (
        <div className="flex flex-row justify-center items-start space-x-8 p-6 min-h-screen">
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
                        {isError ? "Error Occurred!" : "Success!"}
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
                <div>
                    < Card className="w-[600px] mt-20">
                        <CardHeader>
                            <CardTitle>Address Details</CardTitle>
                            <CardDescription>Enter your shipping address below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <CustomSelect
                                    addresses={addresses}
                                    selectedValue={selectedAddressId}
                                    onValueChange={handleAddressSelect}
                                    disabled={!isSelectEnabled}
                                />
                            </div>
                            <div>
                                <Label>
                                    <input
                                        type="checkbox"
                                        checked={isSelectEnabled}
                                        onChange={() => setIsSelectEnabled(prev => !prev)}
                                    />
                                    Enable Address Selection
                                </Label>
                            </div>
                            <div>
                                <Label htmlFor="streetAddress">Street Address:</Label>
                                <div className="relative">
                                    <HomeIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        id="streetAddress"
                                        type="text"
                                        placeholder="123 Main St"
                                        value={streetAddress}
                                        onChange={(e) => setStreetAddress(e.target.value)}
                                        required
                                        disabled={!isAddressEditable || isSelectEnabled}
                                        className="pl-10 pr-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="streetAddress2">Street Address 2:</Label>
                                <div className="relative">
                                    <PinIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        id="streetAddress2"
                                        type="text"
                                        placeholder="Unit 1"
                                        value={streetAddress2}
                                        onChange={(e) => setStreetAddress2(e.target.value)}
                                        disabled={!isAddressEditable || isSelectEnabled}
                                        className="pl-10 pr-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="province">Province:</Label>
                                <div className="relative">
                                    <TargetIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        id="province"
                                        type="text"
                                        placeholder="Province"
                                        value={province}
                                        onChange={(e) => setProvince(e.target.value)}
                                        required
                                        disabled={!isAddressEditable || isSelectEnabled}
                                        className="pl-10 pr-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="city">City:</Label>
                                <div className="relative">
                                    <GlobeIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        id="city"
                                        type="text"
                                        placeholder="City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                        disabled={!isAddressEditable || isSelectEnabled}
                                        className="pl-10 pr-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="postalCode">Postal Code:</Label>
                                <div className="relative">
                                    <BackpackIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        id="postalCode"
                                        type="text"
                                        placeholder="Postal Code"
                                        value={postalCode}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value)) {
                                                setPostalCode(value);
                                            }
                                        }}
                                        required
                                        disabled={!isAddressEditable || isSelectEnabled}
                                        className="pl-10 pr-10"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleAddressSave} disabled={!isAddressEditable} className="w-1/2">
                                Save Address
                            </Button>
                            <Button onClick={handleAddressEdit} disabled={isAddressEditable} className="w-1/2">
                                Edit Address
                            </Button>
                        </CardFooter>
                    </Card>

                    <Tabs defaultValue="credit_card" className="w-[600px] mt-10 mb-20" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="credit_card" disabled={isAddressEditable}>Credit Card</TabsTrigger>
                            <TabsTrigger value="stripe" disabled={isAddressEditable}>Stripe</TabsTrigger>
                            <TabsTrigger value="paypal" disabled={isAddressEditable}>PayPal</TabsTrigger>
                            <TabsTrigger value="apple_pay" disabled={isAddressEditable}>Apple Pay</TabsTrigger>
                        </TabsList>

                        <TabsContent value="credit_card">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Credit/Debit Card</CardTitle>
                                    <CardDescription>Enter your card details below.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <Label htmlFor="cardEmail">Payment Email:</Label>
                                        <div className="relative">
                                            <AtSignIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="cardEmail"
                                                type="email"
                                                value={cardEmail}
                                                onChange={(e) => setCardEmail(e.target.value)}
                                                onBlur={() => {
                                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                    if (!emailRegex.test(cardEmail)) {
                                                        setCardEmail('')
                                                        setIsError(true);
                                                        setMessage('Please Enter Valid Email Address')
                                                    }
                                                }}
                                                required
                                                disabled={true}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="cardFullName">Name on Card:</Label>
                                        <div className="relative">
                                            <PersonStanding className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="cardFullName"
                                                type="text"
                                                value={cardFullName}
                                                onChange={(e) => setCardFullName(e.target.value)}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="cardNumber">Card Number:</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="cardNumber"
                                                type="text"
                                                value={cardNumber.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim()}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\s+/g, '');
                                                    if (/^\d*$/.test(value) && value.length <= 16) {
                                                        setCardNumber(value);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (cardNumber.length !== 16) {
                                                        setCardNumber('')
                                                        setIsError(true);
                                                        setMessage('Please Enter Valid Card Number')
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="expirationDate">Expiration Date (MM/YY):</Label>
                                        <div className="relative">
                                            <CalendarClock className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="expirationDate"
                                                type="text"
                                                value={expirationDate}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, "");
                                                    if (value.length > 2) {
                                                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                                                    }
                                                    if (value.length <= 5) {
                                                        setExpirationDate(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="cvv">CVV:</Label>
                                        <div className="relative">
                                            <LockKeyhole className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="cvv"
                                                type="text"
                                                value={cvv}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (/^\d*$/.test(value) && value.length <= 4) {
                                                        setCvv(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="amount">Amount:</Label>
                                        <div className="relative">
                                            <Banknote className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="amount"
                                                type="text"
                                                value={`R ${amount}`}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/R\s?/, '');
                                                    if (/^\d*$/.test(value)) {
                                                        setAmount(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleCreditCard} disabled={isAddressEditable} className="w-full">Pay</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="stripe">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Stripe</CardTitle>
                                    <CardDescription>Enter your Stripe card details below.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <Label htmlFor="stripeEmail">Payment Email:</Label>
                                        <div className="relative">
                                            <AtSignIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="stripeEmail"
                                                type="email"
                                                value={stripeEmail}
                                                onChange={(e) => setStripeEmail(e.target.value)}
                                                onBlur={() => {
                                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                    if (!emailRegex.test(stripeEmail)) {
                                                        setStripeEmail('')
                                                        setIsError(true);
                                                        setMessage('Please Enter Valid Email Address')
                                                    }
                                                }}
                                                required
                                                disabled={true}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeFullName">Name on Card:</Label>
                                        <div className="relative">
                                            <PersonStanding className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="stripeFullName"
                                                type="text"
                                                value={stripeFullName}
                                                onChange={(e) => setStripeFullName(e.target.value)}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeCardNumber">Card Number:</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="stripeCardNumber"
                                                type="text"
                                                value={stripeCardNumber.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim()}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\s+/g, '');
                                                    if (/^\d*$/.test(value) && value.length <= 16) {
                                                        setStripeCardNumber(value);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (stripeCardNumber.length !== 16) {
                                                        setStripeCardNumber('')
                                                        setIsError(true);
                                                        setMessage('Please Enter Valid Card Number')
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeExpirationDate">Expiration Date (MM/YY):</Label>
                                        <div className="relative">
                                            <CalendarClock className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="stripeExpirationDate"
                                                type="text"
                                                value={stripeExpirationDate}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, "");
                                                    if (value.length > 2) {
                                                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                                                    }
                                                    if (value.length <= 5) {
                                                        setStripeExpirationDate(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeCvv">CVV:</Label>
                                        <div className="relative">
                                            <LockKeyhole className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="stripeCvv"
                                                type="text"
                                                value={stripeCvv}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (/^\d*$/.test(value) && value.length <= 4) {
                                                        setStripeCvv(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeAmount">Amount:</Label>
                                        <div className="relative">
                                            <Banknote className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="stripeAmount"
                                                type="text"
                                                value={`R ${stripeAmount}`}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/R\s?/, '');
                                                    if (/^\d*$/.test(value)) {
                                                        setStripeAmount(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleStripe} disabled={isAddressEditable} className="w-full">Pay with Stripe</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="paypal">
                            <Card>
                                <CardHeader>
                                    <CardTitle>PayPal</CardTitle>
                                    <CardDescription>Enter your PayPal details below.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <Label htmlFor="paypalEmail">PayPal Email:</Label>
                                        <div className="relative">
                                            <AtSignIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="paypalEmail"
                                                type="email"
                                                value={paypalEmail}
                                                onChange={(e) => setPaypalEmail(e.target.value)}
                                                onBlur={() => {
                                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                    if (!emailRegex.test(paypalEmail)) {
                                                        setPaypalEmail('')
                                                        setIsError(true);
                                                        setMessage('Please Enter Valid Email Address')
                                                    }
                                                }}
                                                required
                                                disabled={true}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="paypalFullName">Full Name:</Label>
                                        <div className="relative">
                                            <PersonStanding className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="paypalFullName"
                                                type="text"
                                                value={paypalFullName}
                                                onChange={(e) => setPaypalFullName(e.target.value)}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="paypalAmount">Amount:</Label>
                                        <div className="relative">
                                            <Banknote className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="paypalAmount"
                                                type="text"
                                                value={`R ${paypalAmount}`}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/R\s?/, '');
                                                    if (/^\d*$/.test(value)) {
                                                        setPaypalAmount(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handlePaypal} disabled={isAddressEditable} className="w-full">Pay with PayPal</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="apple_pay">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Apple Pay</CardTitle>
                                    <CardDescription>Enter your Apple Pay details below.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <Label htmlFor="applePayEmail">Apple Pay Email:</Label>
                                        <div className="relative">
                                            <AtSignIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="applePayEmail"
                                                type="email"
                                                value={applePayEmail}
                                                onChange={(e) => setApplePayEmail(e.target.value)}
                                                onBlur={() => {
                                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                    if (!emailRegex.test(applePayEmail)) {
                                                        setApplePayEmail('')
                                                        setIsError(true);
                                                        setMessage('Please Enter Valid Email Address')
                                                    }
                                                }}
                                                required
                                                disabled={true}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="applePayName">Full Name:</Label>
                                        <div className="relative">
                                            <PersonStanding className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="applePayName"
                                                type="text"
                                                value={applePayName}
                                                onChange={(e) => setApplePayName(e.target.value)}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="appleAmount">Amount:</Label>
                                        <div className="relative">
                                            <Banknote className="absolute left-2 top-1/2 transform -translate-y-1/2" />
                                            <Input
                                                id="appleAamount"
                                                type="text"
                                                value={`R ${appleAmount}`}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/R\s?/, '');
                                                    if (/^\d*$/.test(value)) {
                                                        setAppleAmount(value);
                                                    }
                                                }}
                                                required
                                                disabled={isAddressEditable}
                                                className="pl-10 pr-10"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleApplePay} disabled={isAddressEditable} className="w-full">Pay with Apple Pay</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div >
    );
};

export default Payment;