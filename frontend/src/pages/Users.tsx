import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle } from 'lucide-react';

// Types for user data
interface User {
  id: string;
  fullName: string;
  email: string;
  registrationDate: string;
  lastLoginDate: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('sessionToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Registered Users</CardTitle>
          <CardDescription className="text-sm sm:text-base">Details of all registered and logged-in users</CardDescription>
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
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                      <UserCircle className="text-blue-500 w-8 h-8 sm:w-10 sm:h-10" />
                      <div>
                        <p className="font-semibold text-gray-700 text-sm sm:text-base">{user.fullName}</p>
                        <p className="font-semibold text-gray-700 text-xs sm:text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-500">
                        Registered: {new Date(user.registrationDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Last Login: {new Date(user.lastLoginDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center text-sm sm:text-base">No users found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users