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
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!routes.length) return <div className="p-8 text-center">No routes found.</div>;

  return (
    <div className="p-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {routes.map(route => {
        const stopsCount = Array.isArray(route.intermediateWaypoints) ? route.intermediateWaypoints.length : 0;
        return (
          <div
            key={route.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer border border-gray-100 flex flex-col"
            onClick={() => onSelectRoute?.(route)}
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
