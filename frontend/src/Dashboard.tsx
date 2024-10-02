import React from 'react';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard!</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
