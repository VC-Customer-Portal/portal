import React from 'react';
import { Card } from "@/components/ui/card"; // Import the Card from Shadcn
import { Button } from "@/components/ui/button"; // Import Button

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedData: any; // Change 'any' to your specific type if needed
}

// Function to format the account number
const formatAccountNumber = (accountNumber: number | string) => {
    const accountStr = accountNumber.toString(); // Convert to string
    if (!accountStr || accountStr.length < 8) {
        return accountStr; // Return as is if not enough characters
    }
    const firstFour = accountStr.slice(0, 4); // Get the first 4 characters
    const lastFour = accountStr.slice(-4); // Get the last 4 characters
    const maskedPart = '*'.repeat(accountStr.length - 8); // Mask the middle part
    return `${firstFour}${maskedPart}${lastFour}`; // Return the formatted string
};

const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, selectedData }) => {
    if (!isOpen) return null; // Don't render the dialog if it's not open

    return (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/30 z-50">
            <Card className="p-6 w-full max-w-lg bg-white shadow-lg rounded-lg">
                <h2 className="text-lg font-bold">Details</h2>
                <div>
                    <strong>Payment Method: </strong>
                    {selectedData.method_id === 1
                        ? "Credit Card"
                        : selectedData.method_id === 2
                            ? "PayPal"
                            : selectedData.method_id === 3
                                ? "Stripe"
                                : selectedData.method_id === 4
                                    ? "Apple Pay"
                                    : "Unknown"}
                </div>
                <div><strong>Full Name:</strong> {selectedData.fullname}</div>
                <div><strong>Email:</strong> {selectedData.email}</div>
                <div><strong>Amount: </strong>R {selectedData.amount}</div>
                {selectedData?.method_id === 1 || selectedData?.method_id === 3 ? (
                    <div className="mt-4">
                        <div><strong>Card Number:</strong> {formatAccountNumber(selectedData.card_number)}</div>
                        <div><strong>Expire Date:</strong> {selectedData.expire_date}</div>
                        <div><strong>CVV:</strong> ***</div>
                    </div>
                ) : null}
                <Button variant="outline" onClick={onClose}>Close</Button>
            </Card>
        </div>
    );
};

export default PaymentDialog;
