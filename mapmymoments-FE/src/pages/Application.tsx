import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import store, { RootState } from '@/store';
import { cn } from '@/lib/utils';

import MapSidebar from '@/components/MapSidebar';
import UserAvatar from '@/components/UserAvatar';
import NewPlanModal from '@/components/NewPlanModal';
import RouteDisplay from '@/components/RouteDisplay';
import ReduxDebugger from '@/components/ReduxDebugger';
import { useRouteActions } from '@/hooks/useRouteActions';

interface RoutePoint {
  origin: string;
  destination: string;
  stops: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
}

const Application = () => {
  const navigate = useNavigate();
  useAuthGuard();
  const [activeTab, setActiveTab] = useState<'plan' | 'route'>('plan');
  const [routePreview, setRoutePreview] = useState<RoutePoint | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [userData, setUserData] = useState({
    firstName: localStorage.getItem('first_name') || '',
    lastName: localStorage.getItem('last_name') || '',
    email: localStorage.getItem('email') || ''
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('email');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    navigate('/login');
  };

  const handlePreviewRoute = (points: RoutePoint) => {
    setRoutePreview(points);
    // TODO: Draw route line between points using Google Maps Directions service
  };

  // Update to handle tab changes more consistently with profile state
  const handleTabChange = (tab: 'plan' | 'route') => {
    setActiveTab(tab);
    // If changing to plan tab, ensure the profile is closed
    if (tab === 'plan' && isProfileOpen) {
      setIsProfileOpen(false);
    }
  };

  return (
    <Provider store={store}>
      <ApplicationContent
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        routePreview={routePreview}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        userData={userData}
        handleLogout={handleLogout}
        handlePreviewRoute={handlePreviewRoute}
      />
    </Provider>
  );
};

interface ApplicationContentProps {
  activeTab: 'plan' | 'route';
  setActiveTab: (tab: 'plan' | 'route') => void;
  routePreview: RoutePoint | null;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  userData: { firstName: string; lastName: string; email: string };
  handleLogout: () => void;
  handlePreviewRoute: (points: RoutePoint) => void;
}

const ApplicationContent: React.FC<ApplicationContentProps> = ({
  activeTab,
  setActiveTab,
  routePreview,
  isProfileOpen,
  setIsProfileOpen,
  userData,
  handleLogout,
  handlePreviewRoute,
}) => {
  const routeData = useSelector((state: RootState) => state.route);


  return (
    <div className="min-h-screen w-full">
      <APIProvider apiKey={"AIzaSyDPRWyEVasy7zo_MvEU67Ijwrv4af1R-7E"}>
        <div className="relative" style={{ touchAction: 'auto' }}>
          <Map
            defaultCenter={{ lat: 12.9716, lng: 77.5946 }}
            defaultZoom={12}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            scrollwheel={true}
            draggable={true}
            panControl={true}
            rotateControl={true}
            scaleControl={true}
            streetViewControl={false}
            zoomControl={true}
            keyboardShortcuts={true}
            className="w-full h-screen lg:pl-20 pb-16 lg:pb-0"
            style={{ touchAction: 'auto' }}
          >
            {/* Display route from Redux */}
            <RouteDisplay />
            
            {/* Legacy route preview markers */}
            {routePreview?.stops.map((stop) => (
              <Marker
                key={stop.id}
                position={{ lat: stop.lat, lng: stop.lng }}
              />
            ))}
          </Map>
          <MapSidebar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            firstName={userData.firstName}
            lastName={userData.lastName}
            email={userData.email}
            onLogout={handleLogout}
            isProfileOpen={isProfileOpen}
            onProfileToggle={setIsProfileOpen}
          />
          <NewPlanModal 
            isOpen={activeTab === 'plan' && !isProfileOpen} 
            onPreviewRoute={handlePreviewRoute}
            onClose={() => setActiveTab('route')}
          />
          <div className={cn(
            "absolute z-50",
            // Hide on mobile, show on desktop at top-right
            "hidden lg:block lg:top-4 lg:right-4"
          )}>
            <UserAvatar
              firstName={userData.firstName}
              lastName={userData.lastName}
              email={userData.email}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </APIProvider>
    </div>
  );
};

export default Application;
