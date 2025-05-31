import React from 'react';
import { cn } from "@/lib/utils";
import ProfileModal from './ProfileModal';

interface MapSidebarProps {
  activeTab: 'plan' | 'route';
  onTabChange: (tab: 'plan' | 'route') => void;
  // User data for mobile profile
  firstName?: string;
  lastName?: string;
  email?: string;
  onLogout?: () => void;
  // Profile state management
  isProfileOpen: boolean;
  onProfileToggle: (isOpen: boolean) => void;
}

const MapSidebar = ({ activeTab, onTabChange, firstName = '', lastName = '', email = '', onLogout, isProfileOpen, onProfileToggle }: MapSidebarProps) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  return (
    <nav className={cn(
      "fixed z-50 bg-white shadow-lg transition-all duration-300",
      // Mobile styles
      "bottom-0 left-0 right-0 h-16",
      // Desktop styles
      "lg:top-0 lg:left-0 lg:h-screen lg:w-20"
    )}>
      <div className={cn(
        "flex items-center h-full",
        "lg:flex-col lg:items-center lg:justify-start lg:pt-4",
        "px-4 justify-around lg:px-0"
      )}>
        <button
          onClick={() => onTabChange('plan')}
          className={cn(
            "flex flex-col items-center justify-center w-20 py-1",
            "transition-colors duration-200",
            activeTab === 'plan'
              ? "text-primary"
              : "text-gray-600 hover:text-primary"
          )}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs mt-1">Plan</span>
        </button>

        <button
          onClick={() => onTabChange('route')}
          className={cn(
            "flex flex-col items-center justify-center w-20 py-1",
            "transition-colors duration-200",
            activeTab === 'route'
              ? "text-primary"
              : "text-gray-600 hover:text-primary"
          )}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="text-xs mt-1">Route</span>
        </button>

        {/* Profile Button - Only visible on mobile */}
        <button
          onClick={() => onProfileToggle(!isProfileOpen)}
          className={cn(
            "flex flex-col items-center justify-center w-20 py-1",
            "transition-colors duration-200",
            "text-gray-600 hover:text-primary",
            "lg:hidden" // Hide on desktop
          )}
        >
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
            {initials}
          </div>
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>

      {/* Mobile Profile Modal - Full Screen */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => onProfileToggle(false)}
        firstName={firstName}
        lastName={lastName}
        email={email}
        onLogout={onLogout}
      />
    </nav>
  );
};

export default MapSidebar;