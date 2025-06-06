import React, { useEffect, useState } from 'react';
import { getRoutes } from '@/lib/api';
import type { RouteData } from '@/lib/api';
import MapLoader from '@/components/MapLoader';

interface RouteGridProps {
  onSelectRoute?: (route: RouteData) => void;
}

const RouteGrid: React.FC<RouteGridProps> = ({ onSelectRoute }) => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <MapLoader />;
  if (!routes.length) return (
    <div className="p-8 flex flex-col items-center justify-center text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 018 0v2M12 7a4 4 0 110 8 4 4 0 010-8z" /></svg>
      <h2 className="text-xl font-semibold mb-2 text-blue-600">No routes available</h2>
      <p className="text-gray-500 mb-2">You haven't created or saved any routes yet. Start by planning a new journey!</p>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" onClick={() => window.location.reload()}>Refresh</button>
    </div>
  );
  if (error) return (
    <div className="p-8 flex flex-col items-center justify-center text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
      <h2 className="text-xl font-semibold mb-2 text-yellow-600">Unable to load routes</h2>
      <p className="text-gray-500 mb-2">We couldn't load your routes at the moment. This could be a network issue or a temporary glitch.</p>
      <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" onClick={() => window.location.reload()}>Try Again</button>
      <p className="text-xs text-gray-400 mt-4">If the problem persists, please check your internet connection or try again later.</p>
    </div>
  );

  return (
    <div className="p-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {routes.map(route => {
        const stopsCount = Array.isArray(route.intermediateWaypoints) ? route.intermediateWaypoints.length : 0;
        return (
          <div
            key={route._id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer border border-gray-100 flex flex-col"
            onClick={() => window.location.href = `/route/${route._id}`}
          >
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1 truncate">{route.name || 'Untitled Route'}</h3>
                <div className="text-xs text-gray-500 mb-2">{route.id}</div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Origin:</span> {route.origin?.name || '-'}<br />
                  <span className="font-medium">Destination:</span> {route.destination?.name || '-'}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{stopsCount} stops</span>
                  {route.createdAt && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{new Date(route.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
