import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import store, { RootState } from '@/store';
import { cn } from '@/lib/utils';

import MapSidebar, { SidebarTabConfig } from '@/components/MapSidebar';
import UserAvatar from '@/components/UserAvatar';
import NewPlanModal from '@/components/NewPlanModal';
import RouteDisplay from '@/components/RouteDisplay';
import ReduxDebugger from '@/components/ReduxDebugger';
import { useRouteActions } from '@/hooks/useRouteActions';
import RouteGrid from '@/components/RouteGrid';
import { LinkGoogleAccount } from '@/components/LinkGoogleAccount';
import { UnlinkGoogleConfirm } from '@/components/UnlinkGoogleConfirm';
import { getUserAuthInfo, unlinkGoogleAccount, UserAuthInfo } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  const location = useLocation();
  const { toast } = useToast();
  useAuthGuard();
  const [activeTab, setActiveTab] = useState<'plan' | 'route'>(
    location.state?.tab === 'route' ? 'route' : 'plan'
  );
  const [routePreview, setRoutePreview] = useState<RoutePoint | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLinkGoogleOpen, setIsLinkGoogleOpen] = useState(false);
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [authInfo, setAuthInfo] = useState<UserAuthInfo | null>(null);
  
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

  // Fetch user auth info on component mount
  useEffect(() => {
    const fetchAuthInfo = async () => {
      try {
        const info = await getUserAuthInfo();
        setAuthInfo(info);
      } catch (error) {
        console.error('Failed to fetch auth info:', error);
      }
    };
    fetchAuthInfo();
  }, []);

  useEffect(() => {
    if (location.state?.tab === 'route') setActiveTab('route');
  }, [location.state]);

  const handleLinkGoogle = () => {
    setIsLinkGoogleOpen(true);
  };

  const handleUnlinkGoogle = () => {
    setIsUnlinkConfirmOpen(true);
  };

  const handleUnlinkConfirm = async () => {
    setIsUnlinking(true);
    try {
      await unlinkGoogleAccount();
      // Refresh auth info
      const updatedInfo = await getUserAuthInfo();
      setAuthInfo(updatedInfo);
      toast({
        title: "✅ Google Account Unlinked",
        description: "Your Google account has been successfully unlinked from your profile.",
      });
      setIsUnlinkConfirmOpen(false);
    } catch (error) {
      console.error('Failed to unlink Google account:', error);
      toast({
        title: "❌ Failed to Unlink Google Account",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleUnlinkCancel = () => {
    setIsUnlinkConfirmOpen(false);
  };

  const handleLinkSuccess = async () => {
    setIsLinkGoogleOpen(false);
    // Refresh auth info
    try {
      const updatedInfo = await getUserAuthInfo();
      setAuthInfo(updatedInfo);
      toast({
        title: "🔗 Google Account Linked",
        description: "Your Google account has been successfully linked! You can now sign in with either method.",
      });
    } catch (error) {
      console.error('Failed to refresh auth info:', error);
      toast({
        title: "⚠️ Account Linked but Info Not Refreshed",
        description: "Please refresh the page to see updated account status.",
        variant: "destructive",
      });
    }
  };

  const handleLinkError = (error: string) => {
    console.error('Google linking failed:', error);
    toast({
      title: "❌ Failed to Link Google Account",
      description: error || "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  };

  const handleLinkCancel = () => {
    setIsLinkGoogleOpen(false);
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
        authInfo={authInfo}
        onLinkGoogle={handleLinkGoogle}
        onUnlinkGoogle={handleUnlinkGoogle}
      />
      
      <LinkGoogleAccount
        isOpen={isLinkGoogleOpen}
        onSuccess={handleLinkSuccess}
        onError={handleLinkError}
        onCancel={handleLinkCancel}
      />
      
      <UnlinkGoogleConfirm
        isOpen={isUnlinkConfirmOpen}
        onConfirm={handleUnlinkConfirm}
        onCancel={handleUnlinkCancel}
        isLoading={isUnlinking}
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
  authInfo: UserAuthInfo | null;
  onLinkGoogle: () => void;
  onUnlinkGoogle: () => void;
}

const TAB_CONFIG: SidebarTabConfig[] = [
  {
    key: 'plan',
    label: 'Plan',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'route',
    label: 'Route',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  // Add more tabs here as needed
];

const ApplicationContent: React.FC<ApplicationContentProps> = ({
  activeTab,
  setActiveTab,
  routePreview,
  isProfileOpen,
  setIsProfileOpen,
  userData,
  handleLogout,
  handlePreviewRoute,
  authInfo,
  onLinkGoogle,
  onUnlinkGoogle,
}) => {
  const routeData = useSelector((state: RootState) => state.route);

  // Tab content mapping as a function to access latest props
  const renderTabContent = () => {
    switch (activeTab) {
      case 'plan':
        return (
          <NewPlanModal
            isOpen={activeTab === 'plan' && !isProfileOpen}
            onPreviewRoute={handlePreviewRoute}
            onClose={() => setActiveTab('route')}
          />
        );
      case 'route':
        // Full screen grid of all routes
        return (
          <div className="fixed inset-0 z-40 bg-white overflow-auto">
            <RouteGrid />
          </div>
        );
      // Add more cases for new tabs
      default:
        return null;
    }
  };

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
            {activeTab === 'route' && <RouteDisplay />}
            {/* Legacy route preview markers */}
            {routePreview?.stops.map((stop) => (
              <Marker
                key={stop.id}
                position={{ lat: stop.lat, lng: stop.lng }}
              />
            ))}
          </Map>
          <MapSidebar
            tabs={TAB_CONFIG}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            firstName={userData.firstName}
            lastName={userData.lastName}
            email={userData.email}
            onLogout={handleLogout}
            isProfileOpen={isProfileOpen}
            onProfileToggle={setIsProfileOpen}
            isGoogleLinked={authInfo?.has_google || false}
            onLinkGoogle={onLinkGoogle}
            onUnlinkGoogle={onUnlinkGoogle}
          />
          {/* Render tab content outside sidebar for scalability */}
          <div className="absolute left-0 right-0 bottom-16 lg:bottom-auto lg:left-20 lg:top-0 lg:right-auto lg:w-[calc(100%-5rem)]">
            {renderTabContent()}
          </div>
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
