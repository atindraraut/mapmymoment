import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import store from '@/store';

import MapSidebar from '@/components/MapSidebar';
import UserAvatar from '@/components/UserAvatar';
import PlanModal from '@/components/NewPlanModal';

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

  return (
    <Provider store={store}>
      <div className="min-h-screen w-full">
        <APIProvider apiKey={"AIzaSyDPRWyEVasy7zo_MvEU67Ijwrv4af1R-7E"}>
          <div className="relative">
            <Map
              defaultCenter={{ lat: 12.9716, lng: 77.5946 }}
              defaultZoom={12}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              className="w-full h-screen lg:pl-20 pb-16 lg:pb-0"
            >
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
            />
            <PlanModal 
              isOpen={activeTab === 'plan'} 
              onPreviewRoute={handlePreviewRoute}
              onClose={() => setActiveTab('route')}
            />
            <div className="absolute top-4 right-4 z-50">
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
    </Provider>
  );
};

export default Application;
