import React, { useState } from 'react';
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  onLogout: () => void;
}

const UserAvatar = ({ firstName = '', lastName = '', email = '', onLogout }: UserAvatarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {initials}
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          "absolute right-0 top-12 w-72 bg-white rounded-lg shadow-lg py-2 z-50",
          "transform transition-all duration-200 origin-top-right",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* User Info Section */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-2 py-2">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserAvatar;
