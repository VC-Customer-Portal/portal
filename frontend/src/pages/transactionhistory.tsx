import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp } from 'lucide-react';

// Types for transaction data
interface Transaction {
  id: string;
  userID: string;
  type: 'Credit' | 'Debit';
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Cash';
  amount: number;
  date: string; // Adding a date field to mirror UserPayments layout
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/api/transactions`, {
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View recent transactions made by users</CardDescription>
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
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${transaction.type === 'Credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.type === 'Credit' ? (
                          <ArrowUp className="text-green-500" />
                        ) : (
                          <ArrowDown className="text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">User ID: {transaction.userID}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.type} via {transaction.paymentMethod} on {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-white text-sm font-medium ${
                          transaction.type === 'Credit' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        {transaction.type}
                      </span>
                      <p className="font-bold text-lg text-gray-800">
                        ${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No transactions found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
