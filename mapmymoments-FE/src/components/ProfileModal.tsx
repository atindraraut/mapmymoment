import React from 'react';
import { cn } from "@/lib/utils";
import SharedRoutesSection from './SharedRoutesSection';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstName?: string;
  lastName?: string;
  email?: string;
  onLogout?: () => void;
  // Future props for profile editing
  onEditProfile?: () => void;
  onUpdateSettings?: (setting: string) => void;
  // Google account linking
  isGoogleLinked?: boolean;
  onLinkGoogle?: () => void;
  onUnlinkGoogle?: () => void;
}

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  firstName = '', 
  lastName = '', 
  email = '', 
  onLogout,
  onEditProfile,
  onUpdateSettings,
  isGoogleLinked = false,
  onLinkGoogle,
  onUnlinkGoogle
}: ProfileModalProps) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  if (!isOpen) return null;

  const handleSettingClick = (setting: string) => {
    if (onUpdateSettings) {
      onUpdateSettings(setting);
    }
    // For now, just log the setting that was clicked
    console.log(`Navigate to ${setting} settings`);
  };

  const handleEditProfile = () => {
    if (onEditProfile) {
      onEditProfile();
    }
    // For now, just log that edit profile was clicked
    console.log('Navigate to edit profile');
  };

  // Handle click outside to close the modal
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only close if clicking on the background, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div className="lg:hidden">
      {/* Full Screen Modal with backdrop - Positioned above sidebar but below other modals */}
      <div 
        className="fixed top-0 left-0 right-0 bottom-16 z-40 bg-white flex flex-col"
        onClick={handleBackgroundClick}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent px-4 py-6 text-white relative">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 space-y-6">
            {/* Profile Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-medium">
                  {initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {firstName} {lastName}
                  </h3>
                  <p className="text-gray-600">{email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active Member
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Edit Profile Button */}
              <button 
                onClick={handleEditProfile}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
            </div>

            {/* Account Settings Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => handleSettingClick('personal-information')}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700">Personal Information</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => handleSettingClick('privacy-security')}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-gray-700">Privacy & Security</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Google Account Linking */}
                <button 
                  onClick={isGoogleLinked ? onUnlinkGoogle : onLinkGoogle}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <div>
                      <span className="text-gray-700">
                        {isGoogleLinked ? 'Unlink Google Account' : 'Link Google Account'}
                      </span>
                      {isGoogleLinked && (
                        <div className="text-xs text-green-600 flex items-center mt-1">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Connected
                        </div>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => handleSettingClick('preferences')}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">Preferences</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button 
                  onClick={() => handleSettingClick('notifications')}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v4m6 2l-3 3M3 9l3 3v4l5-5H7l4-4z" />
                    </svg>
                    <span className="text-gray-700">Notifications</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Shared Routes Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <SharedRoutesSection />
            </div>

            {/* Journey Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Journey Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Routes Created</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Places Visited</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Photos Shared</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">Miles Traveled</div>
                </div>
              </div>
            </div>

            {/* Help & Support Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Help & Support</h4>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">FAQ & Help Center</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">Contact Support</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sign Out Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  onLogout?.();
                }}
                className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>

            {/* Small bottom padding for scroll comfort */}
            <div className="h-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;