import React, { useEffect, useState } from 'react';
import { getRoutes } from '@/lib/api';
import type { RouteData } from '@/lib/api';
import MapLoader from '@/components/MapLoader';
import { useNavigate } from 'react-router-dom';

interface RouteGridProps {
  onSelectRoute?: (route: RouteData) => void;
}

const RouteGrid: React.FC<RouteGridProps> = ({ onSelectRoute }) => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getRoutes().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setRoutes(res.data);
        setError(null);
      } else {
        setError(res.error || 'Failed to fetch routes');
      }
      setLoading(false);
    });
  }, []);

  const handleRouteClick = (routeId: string) => {
    navigate(`/route/${routeId}`);
  };

  if (loading) return <MapLoader />;
  if (!routes.length) return (
    <div className="min-h-[50vh] p-4 sm:p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-primary/5 via-white to-accent/5 rounded-xl">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow p-6 border border-white/40 max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2 text-primary">No routes available</h2>
        <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">You haven't created or saved any routes yet. Start by planning a new journey!</p>
        <button 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-all shadow hover:shadow-md flex items-center justify-center gap-1.5 mx-auto text-sm"
          onClick={() => navigate('/app', { state: { tab: 'plan' } })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Route
        </button>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-[50vh] p-4 sm:p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-primary/5 via-white to-accent/5 rounded-xl">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow p-6 border border-white/40 max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-yellow-100 text-yellow-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2 text-yellow-600">Unable to load routes</h2>
        <p className="text-sm text-gray-600 mb-4">We couldn't load your routes at the moment. This could be a network issue or a temporary glitch.</p>
        <button 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-all shadow hover:shadow-md flex items-center justify-center gap-1.5 mx-auto text-sm"
          onClick={() => window.location.reload()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
        <p className="text-xs text-gray-400 mt-4">If the problem persists, please check your internet connection or try again later.</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-5 w-full mx-auto">
      <div className="bg-gradient-to-br from-primary/5 via-white to-accent/5 rounded-xl p-4 sm:p-6 min-h-[calc(100vh-180px)] animate-fade-in">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </span>
            Routes
          </h1>
          {/* <button 
            className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-all shadow hover:shadow-md flex items-center gap-1.5 text-xs"
            onClick={() => navigate('/app', { state: { tab: 'plan' } })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Route
          </button> */}
        </div>
        
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 w-full mx-auto">
          {routes.map(route => {
            const stopsCount = Array.isArray(route.intermediateWaypoints) ? route.intermediateWaypoints.length : 0;
            return (
              <div
                key={route._id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-white/40 flex flex-col group focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 outline-none overflow-hidden h-full"
                tabIndex={0}
                onClick={() => handleRouteClick(route._id)}
                onKeyDown={e => { if (e.key === 'Enter') handleRouteClick(route._id); }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl -z-10"></div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-base font-bold mb-1.5 text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{route.name || 'Untitled Route'}</h3>
                  
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                      <span className="text-xs text-gray-700 line-clamp-1">{route.origin?.name || '-'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-700 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </span>
                      <span className="text-xs text-gray-700 line-clamp-1">{route.destination?.name || '-'}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 text-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-2xs font-medium flex items-center gap-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        {stopsCount} {stopsCount === 1 ? 'stop' : 'stops'}
                      </span>
                      
                      {route.createdAt && (
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-2xs font-medium flex items-center gap-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(route.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      className="text-primary hover:text-primary/80 transition-colors p-1 rounded-full hover:bg-white/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRouteClick(route._id);
                      }}
                      aria-label="View route details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RouteGrid;

/*** Splash Screen Implementation ***/
// You can use this in App.tsx or a similar entry point
// Example usage:
// const [showSplash, setShowSplash] = useState(true);
// useEffect(() => {
//   const timer = setTimeout(() => setShowSplash(false), 1800);
//   return () => clearTimeout(timer);
// }, []);
// if (showSplash) return <MapLoader />;
// ...rest of your app...
