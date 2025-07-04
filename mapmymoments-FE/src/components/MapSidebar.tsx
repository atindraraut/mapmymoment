import React from 'react';
import { cn } from "@/lib/utils";
import ProfileModal from './ProfileModal';

export interface SidebarTabConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface MapSidebarProps {
  tabs: SidebarTabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  // User data for mobile profile
  firstName?: string;
  lastName?: string;
  email?: string;
  onLogout?: () => void;
  // Profile state management
  isProfileOpen: boolean;
  onProfileToggle: (isOpen: boolean) => void;
  // Google account linking
  isGoogleLinked?: boolean;
  onLinkGoogle?: () => void;
  onUnlinkGoogle?: () => void;
}

const MapSidebar = ({ tabs, activeTab, onTabChange, firstName = '', lastName = '', email = '', onLogout, isProfileOpen, onProfileToggle, isGoogleLinked = false, onLinkGoogle, onUnlinkGoogle }: MapSidebarProps) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  // Function to handle tab changes and ensure profile is closed
  const handleTabWithProfileClose = (tab: string) => {
    if (isProfileOpen) {
      onProfileToggle(false);
    }
    onTabChange(tab);
  };

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
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabWithProfileClose(tab.key)}
            className={cn(
              "flex flex-col items-center justify-center w-20 py-1",
              "transition-all duration-200",
              !isProfileOpen && activeTab === tab.key
                ? "text-primary font-medium relative bg-primary/10 rounded-lg"
                : "text-gray-600 hover:text-primary hover:bg-gray-100 hover:rounded-lg"
            )}
          >
            <div className={cn(
              "relative flex items-center justify-center",
              !isProfileOpen && activeTab === tab.key && "after:absolute after:bottom-[-8px] after:w-10 after:h-1 after:bg-primary after:rounded-full"
            )}>
              {tab.icon}
            </div>
            <span className={cn(
              "text-xs mt-2",
              !isProfileOpen && activeTab === tab.key ? "font-medium" : ""
            )}>{tab.label}</span>
          </button>
        ))}

        {/* Profile Button - Only visible on mobile */}
        <button
          onClick={() => onProfileToggle(!isProfileOpen)}
          className={cn(
            "flex flex-col items-center justify-center w-20 py-1",
            "transition-all duration-200",
            isProfileOpen
              ? "text-primary font-medium relative bg-primary/10 rounded-lg"
              : "text-gray-600 hover:text-primary hover:bg-gray-100 hover:rounded-lg",
            "lg:hidden" // Hide on desktop
          )}
        >
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
            {initials}
          </div>
          <span className={cn(
            "text-xs mt-2",
            isProfileOpen ? "font-medium" : ""
          )}>Profile</span>
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
        isGoogleLinked={isGoogleLinked}
        onLinkGoogle={onLinkGoogle}
        onUnlinkGoogle={onUnlinkGoogle}
      />
    </nav>
  );
};

export default MapSidebar;