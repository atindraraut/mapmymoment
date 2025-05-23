import React from 'react';
import { cn } from "@/lib/utils";

interface MapSidebarProps {
  activeTab: 'plan' | 'route';
  onTabChange: (tab: 'plan' | 'route') => void;
}

const MapSidebar = ({ activeTab, onTabChange }: MapSidebarProps) => {
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
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
      </div>
    </nav>
  );
};

export default MapSidebar;