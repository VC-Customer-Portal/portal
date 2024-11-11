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
        const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/api/users`, {
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>Details of all registered and logged-in users</CardDescription>
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
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <UserCircle className="text-blue-500" size={32} />
                      <div>
                        <p className="font-semibold text-gray-700">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Registered: {new Date(user.registrationDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last Login: {new Date(user.lastLoginDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No users found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users