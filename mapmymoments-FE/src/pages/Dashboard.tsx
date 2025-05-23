import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const Dashboard = () => {
  const navigate = useNavigate();
  useAuthGuard();

  useEffect(() => {
    // Optionally, you can fetch user info here if needed
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('email');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Dashboard!</h1>
        <p className="mb-6">You are logged in.</p>
        <button onClick={handleLogout} className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90">Logout</button>
      </div>
    </div>
  );
};

export default Dashboard;
