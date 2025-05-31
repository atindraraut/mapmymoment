import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const email = params.get('email');
    const firstName = params.get('first_name');
    const lastName = params.get('last_name');

    if (accessToken && refreshToken) {
      // Store tokens and user info in localStorage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('email', email || '');
      localStorage.setItem('first_name', firstName || '');
      localStorage.setItem('last_name', lastName || '');

      // Redirect to dashboard
      navigate('/app');
    } else {
      // Handle error or redirect to login
      navigate('/login');
    }
  }, [navigate]);

  return <div>Processing OAuth login...</div>;
};

export default OAuthCallback;
