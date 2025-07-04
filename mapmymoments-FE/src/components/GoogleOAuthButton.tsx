import React, { useState } from 'react';
import { Button } from './ui/button';
import { apiFetch } from '../lib/api';

interface GoogleOAuthButtonProps {
  onSuccess: (tokens: {
    access_token: string;
    refresh_token: string;
    email: string;
    first_name: string;
    last_name: string;
  }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Get Google OAuth URL from backend
      const response = await apiFetch('/user/oauth/google/url', {
        method: 'GET',
      });
      const urlResponse = await response.json();
      
      const { auth_url, state } = urlResponse;
      
      // Store state in sessionStorage for verification
      sessionStorage.setItem('oauth_state', state);
      
      // Open popup window for Google OAuth
      const popup = window.open(
        auth_url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Listen for popup messages
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          const { code, state: returnedState } = event.data;
          
          // Verify state matches
          const storedState = sessionStorage.getItem('oauth_state');
          if (storedState !== returnedState) {
            onError('OAuth state mismatch');
            return;
          }
          
          try {
            // Exchange code for tokens
            const response = await apiFetch('/user/oauth/google/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code, state: returnedState }),
            });
            const tokenResponse = await response.json();
            
            // Store tokens in localStorage
            localStorage.setItem('access_token', tokenResponse.access_token);
            localStorage.setItem('refresh_token', tokenResponse.refresh_token);
            localStorage.setItem('email', tokenResponse.email);
            localStorage.setItem('first_name', tokenResponse.first_name);
            localStorage.setItem('last_name', tokenResponse.last_name);
            
            onSuccess(tokenResponse);
          } catch (error) {
            onError('Failed to exchange OAuth code');
          } finally {
            popup?.close();
            window.removeEventListener('message', handleMessage);
            sessionStorage.removeItem('oauth_state');
          }
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          onError(event.data.error || 'OAuth authentication failed');
          popup?.close();
          window.removeEventListener('message', handleMessage);
          sessionStorage.removeItem('oauth_state');
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          sessionStorage.removeItem('oauth_state');
          setIsLoading(false);
        }
      }, 1000);
      
    } catch (error) {
      onError('Failed to initiate Google OAuth');
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {isLoading ? 'Connecting...' : 'Continue with Google'}
    </Button>
  );
};