import React, { useState } from 'react';
import { GoogleOAuthButton } from './GoogleOAuthButton';

interface LinkGoogleAccountProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const LinkGoogleAccount: React.FC<LinkGoogleAccountProps> = ({
  onSuccess,
  onError,
  onCancel,
  isOpen
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleOAuthSuccess = (tokens: {
    access_token: string;
    refresh_token: string;
    email: string;
    first_name: string;
    last_name: string;
  }) => {
    console.log('Google account linked successfully:', tokens);
    onSuccess();
  };

  const handleOAuthError = (error: string) => {
    console.error('Google account linking failed:', error);
    onError(error);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackgroundClick}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Link Google Account
          </h3>
          <p className="text-gray-600 text-sm">
            Connect your Google account to enable easy sign-in and sync your data across devices.
          </p>
        </div>

        <div className="space-y-4">
          <GoogleOAuthButton
            onSuccess={handleOAuthSuccess}
            onError={handleOAuthError}
            disabled={isLoading}
          />

          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium">What happens when you link?</p>
              <ul className="mt-1 list-disc list-inside text-xs">
                <li>You can sign in with either email/password or Google</li>
                <li>Your account data remains the same</li>
                <li>You can unlink anytime in settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};