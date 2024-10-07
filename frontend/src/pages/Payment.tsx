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

interface Address {
    id: string; // or number, depending on your data type
    line_1: string;
    line_2?: string; // Optional if it may not exist
    province: string;
    city: string;
    postal_code: string;
}

interface PaymentProps {
    onPayment: (message: string, time: string) => void;
}

const Payment: React.FC<PaymentProps> = ({ onPayment }) => {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const [isLoading, setIsLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("credit_card");
    const [cardEmail, setCardEmail] = useState("");
    const [cardFullName, setCardFullName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [amount, setAmount] = useState("");

    const [paypalEmail, setPaypalEmail] = useState("");
    const [paypalFullName, setPaypalFullName] = useState("");
    const [paypalAmount, setPaypalAmount] = useState("");

    const [stripeEmail, setStripeEmail] = useState("");
    const [stripeFullName, setStripeFullName] = useState("");
    const [stripeCardNumber, setStripeCardNumber] = useState("");
    const [stripeExpirationDate, setStripeExpirationDate] = useState("");
    const [stripeCvv, setStripeCvv] = useState("");
    const [stripeAmount, setStripeAmount] = useState("");

    const [applePayEmail, setApplePayEmail] = useState("");
    const [applePayName, setApplePayName] = useState("");
    const [appleAmount, setAppleAmount] = useState("");

    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    // Address fields
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

    const handleAddressSave = () => {
        if (!isAddressFromDropdown && (streetAddress === "" || province === "" || city === "" || postalCode === "")) {
            setIsError(true)
            setMessage("Complete all required Fields for address!")
            return
        }
        setIsAddressEditable(false);
    };

    const handleAddressEdit = () => {
        // Make address fields read-only and enable payment card
        setIsAddressEditable(true);
    };

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

    const handleAddressSelect = (selectedAddress: Address | null) => {
        if (selectedAddress) {
            console.log('Selected Address:', selectedAddress);
            setStreetAddress(selectedAddress.line_1);
            setStreetAddress2(selectedAddress.line_2 || '');
            setProvince(selectedAddress.province);
            setCity(selectedAddress.city);
            setPostalCode(selectedAddress.postal_code);
            setSelectedAddressId(selectedAddress.id); // Set selected address ID for dropdown value
            setIsAddressFromDropdown(true);
        } else {
            console.log('No address selected or address not found.');
            // Clear the fields if no address is selected
            setStreetAddress('');
            setStreetAddress2('');
            setProvince('');
            setCity('');
            setPostalCode('');
            setSelectedAddressId(''); // Clear selected ID
            setIsAddressFromDropdown(false);
        }
    };

    const handleAddress = async () => {
        
        if (isAddressFromDropdown) {
            return true; // Skip saving if address is selected from dropdown
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

            const response = await fetch("http://localhost:8888/api/address", {
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

            const response = await fetch("http://localhost:8888/api/payment", {
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

            const response = await fetch("http://localhost:8888/api/payment", {
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
            const response = await fetch("http://localhost:8888/api/payment", {
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

            const response = await fetch("http://localhost:8888/api/payment", {
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

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await fetch("http://localhost:8888/api/myaddresses", {
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
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const clearPaymentFields = () => {
        setCardEmail("");
        setCardFullName("");
        setCardNumber("");
        setExpirationDate("");
        setCvv("");
        setAmount("");

        setStripeEmail("");
        setStripeFullName("");
        setStripeCardNumber("");
        setStripeExpirationDate("");
        setStripeCvv("");
        setStripeAmount("");

        setPaypalEmail("");
        setPaypalFullName("");
        setPaypalAmount("");

        setApplePayEmail("");
        setApplePayName("");
        setAppleAmount("");
    };

    useEffect(() => {
        clearPaymentFields();
    }, [activeTab]);


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
                                <Input
                                    id="streetAddress"
                                    type="text"
                                    placeholder="123 Main St"
                                    value={streetAddress}
                                    onChange={(e) => setStreetAddress(e.target.value)}
                                    required
                                    disabled={!isAddressEditable || isSelectEnabled}
                                />
                            </div>
                            <div>
                                <Label htmlFor="streetAddress2">Street Address 2:</Label>
                                <Input
                                    id="streetAddress2"
                                    type="text"
                                    placeholder="Unit 1"
                                    value={streetAddress2}
                                    onChange={(e) => setStreetAddress2(e.target.value)}
                                    disabled={!isAddressEditable || isSelectEnabled}
                                />
                            </div>
                            <div>
                                <Label htmlFor="province">Province:</Label>
                                <Input
                                    id="province"
                                    type="text"
                                    placeholder="Province"
                                    value={province}
                                    onChange={(e) => setProvince(e.target.value)}
                                    required
                                    disabled={!isAddressEditable || isSelectEnabled}
                                />
                            </div>
                            <div>
                                <Label htmlFor="city">City:</Label>
                                <Input
                                    id="city"
                                    type="text"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    disabled={!isAddressEditable || isSelectEnabled}
                                />
                            </div>
                            <div>
                                <Label htmlFor="postalCode">Postal Code:</Label>
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
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleAddressSave} disabled={!isAddressEditable}>
                                Save Address
                            </Button>
                            <Button onClick={handleAddressEdit} disabled={isAddressEditable}>
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
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cardFullName">Name on Card:</Label>
                                        <Input
                                            id="cardFullName"
                                            type="text"
                                            value={cardFullName}
                                            onChange={(e) => setCardFullName(e.target.value)}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cardNumber">Card Number:</Label>
                                        <Input
                                            id="cardNumber"
                                            type="text"
                                            value={cardNumber.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim()}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\s+/g, ''); // Remove spaces from the input value
                                                if (/^\d*$/.test(value) && value.length <= 16) {  // Ensure the input is numeric and at most 16 digits
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
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="expirationDate">Expiration Date (MM/YY):</Label>
                                        <Input
                                            id="expirationDate"
                                            type="text"
                                            value={expirationDate}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ""); // Remove any non-numeric characters
                                                if (value.length > 2) {
                                                    value = value.slice(0, 2) + "/" + value.slice(2, 4); // Insert '/' after the second digit
                                                }
                                                if (value.length <= 5) { // Limit the length to 5 characters (MM/YY)
                                                    setExpirationDate(value);
                                                }
                                            }}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cvv">CVV:</Label>
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
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="amount">Amount:</Label>
                                        <Input
                                            id="amount"
                                            type="text"
                                            value={`R ${amount}`} // Display "R " in front of the amount
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/R\s?/, ''); // Remove "R " from the input value
                                                if (/^\d*$/.test(value)) {  // Only allow numeric values
                                                    setAmount(value); // Set the actual value without "R"
                                                }
                                            }}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleCreditCard} disabled={isAddressEditable}>Pay</Button>
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
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeFullName">Name on Card:</Label>
                                        <Input
                                            id="stripeFullName"
                                            type="text"
                                            value={stripeFullName}
                                            onChange={(e) => setStripeFullName(e.target.value)}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeCardNumber">Card Number:</Label>
                                        <Input
                                            id="stripeCardNumber"
                                            type="text"
                                            value={stripeCardNumber.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim()}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\s+/g, ''); // Remove spaces from the input value
                                                if (/^\d*$/.test(value) && value.length <= 16) {  // Ensure the input is numeric and at most 16 digits
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
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeExpirationDate">Expiration Date (MM/YY):</Label>
                                        <Input
                                            id="stripeExpirationDate"
                                            type="text"
                                            value={stripeExpirationDate}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ""); // Remove any non-numeric characters
                                                if (value.length > 2) {
                                                    value = value.slice(0, 2) + "/" + value.slice(2, 4); // Insert '/' after the second digit
                                                }
                                                if (value.length <= 5) { // Limit the length to 5 characters (MM/YY)
                                                    setStripeExpirationDate(value);
                                                }
                                            }}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeCvv">CVV:</Label>
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
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stripeAmount">Amount:</Label>
                                        <Input
                                            id="stripeAmount"
                                            type="text"
                                            value={`R ${stripeAmount}`} // Display "R " in front of the amount
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/R\s?/, ''); // Remove "R " from the input value
                                                if (/^\d*$/.test(value)) {  // Only allow numeric values
                                                    setStripeAmount(value); // Set the actual value without "R"
                                                }
                                            }}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleStripe} disabled={isAddressEditable}>Pay with Stripe</Button>
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
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="paypalFullName">Full Name:</Label>
                                        <Input
                                            id="paypalFullName"
                                            type="text"
                                            value={paypalFullName}
                                            onChange={(e) => setPaypalFullName(e.target.value)}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="paypalAmount">Amount:</Label>
                                        <Input
                                            id="paypalAmount"
                                            type="text"
                                            value={`R ${paypalAmount}`} // Display "R " in front of the amount
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/R\s?/, ''); // Remove "R " from the input value
                                                if (/^\d*$/.test(value)) {  // Only allow numeric values
                                                    setPaypalAmount(value); // Set the actual value without "R"
                                                }
                                            }}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handlePaypal} disabled={isAddressEditable}>Pay with PayPal</Button>
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
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="applePayName">Full Name:</Label>
                                        <Input
                                            id="applePayName"
                                            type="text"
                                            value={applePayName}
                                            onChange={(e) => setApplePayName(e.target.value)}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="appleAmount">Amount:</Label>
                                        <Input
                                            id="appleAamount"
                                            type="text"
                                            value={`R ${appleAmount}`} // Display "R " in front of the amount
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/R\s?/, ''); // Remove "R " from the input value
                                                if (/^\d*$/.test(value)) {  // Only allow numeric values
                                                    setAppleAmount(value); // Set the actual value without "R"
                                                }
                                            }}
                                            required
                                            disabled={isAddressEditable}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleApplePay} disabled={isAddressEditable}>Pay with Apple Pay</Button>
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