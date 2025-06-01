import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { cn } from '@/lib/utils';

interface RouteSummaryProps {
  className?: string;
}

const RouteSummary: React.FC<RouteSummaryProps> = ({ className }) => {
  const { origin, destination, stops, routeName, routeInfo } = useSelector((state: RootState) => state.route);

  if (!origin || !destination) {
    return null;
  }

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200",
      className
    )}>
      <div className="space-y-3">
        {/* Route Title */}
        <div className="flex items-center justify-between border-b pb-2">
          <div className="text-lg font-semibold text-gray-800">
            {routeName || 'Your Route'}
          </div>
          <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            🗺️ Live Route
          </div>
        </div>

        {/* Starting Point */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-white text-xs font-bold">🚩</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800">{origin.name}</div>
            <div className="text-xs text-gray-500 truncate">{origin.address}</div>
            <div className="text-xs text-green-600 font-medium">Starting Point</div>
          </div>
        </div>

        {/* Stops */}
        {stops.map((stop, index) => (
          <div key={stop.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{stop.name}</div>
              <div className="text-xs text-amber-600 font-medium">Stop {index + 1}</div>
            </div>
          </div>
        ))}

        {/* Destination */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-white text-xs font-bold">🏁</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800">{destination.name}</div>
            <div className="text-xs text-gray-500 truncate">{destination.address}</div>
            <div className="text-xs text-red-600 font-medium">Destination</div>
          </div>
        </div>

        {/* Route Stats */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-500">Total Stops</div>
              <div className="text-sm font-semibold text-gray-800">{stops.length}</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-500">Points</div>
              <div className="text-sm font-semibold text-gray-800">{stops.length + 2}</div>
            </div>
          </div>
          
          {/* Route Distance & Duration */}
          {routeInfo && (
            <div className="grid grid-cols-2 gap-2 text-center mt-2">
              <div className="bg-blue-50 rounded p-2">
                <div className="text-xs text-blue-600">Distance</div>
                <div className="text-sm font-semibold text-blue-800">{routeInfo.distance}</div>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <div className="text-xs text-blue-600">Duration</div>
                <div className="text-sm font-semibold text-blue-800">{routeInfo.duration}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteSummary;
