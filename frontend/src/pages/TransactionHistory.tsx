import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from 'lucide-react';

// Types for transaction data
interface Transaction {
  id: string;
  userID: string;
  method_id: number;
  amount: number;
  created_at: string;
}

// Define Methods object with an explicit index signature for payment method numbers
const Methods: { [key: number]: string } = {
  1: "Credit Card",
  2: "Paypal",
  3: "Stripe",
  4: "Apple Pay",
};

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/transactions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('sessionToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions);
        } else {
          console.error('Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Transaction History</CardTitle>
          <CardDescription className="text-sm sm:text-base">View recent transactions made by users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                      <div className="p-2 rounded-full bg-black">
                        <User className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm sm:text-base">User ID: {transaction.userID}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {transaction.method_id ? Methods[transaction.method_id] : 'Unknown Method'} on {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <span
                        className="px-2 py-1 rounded-full text-white text-xs sm:text-sm font-medium bg-green-600"
                      >
                        {transaction.method_id ? Methods[transaction.method_id] : 'Unknown'}
                      </span>
                      <p className="font-bold text-base sm:text-lg text-gray-800">
                        R {transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center text-sm sm:text-base">No transactions found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
