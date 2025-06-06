import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRouteById } from '@/lib/api';
import MapLoader from '@/components/MapLoader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
}

interface RouteData {
  _id: string;
  name: string;
  description?: string;
  origin: Waypoint;
  destination: Waypoint;
  intermediateWaypoints: Waypoint[];
  photos?: any[];
  createdAt?: number;
  updatedAt?: number;
}

const MiniMap: React.FC<{ route: RouteData }> = ({ route }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const center = route.origin ? { lat: route.origin.lat, lng: route.origin.lng } : { lat: 0, lng: 0 };
  const waypoints = route.intermediateWaypoints || [];
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [maximized, setMaximized] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places']
  });

  useEffect(() => {
    if (!isLoaded) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: route.origin.lat, lng: route.origin.lng },
        destination: { lat: route.destination.lat, lng: route.destination.lng },
        waypoints: waypoints.map(wp => ({ location: { lat: wp.lat, lng: wp.lng }, stopover: true })),
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [isLoaded, route]);

  if (!isLoaded) return <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded mb-4">Loading map...</div>;

  return (
    <div className={maximized ? "fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center" : "w-full h-64 rounded-lg mb-4 overflow-hidden relative shadow-md border border-gray-200"}>
      <div className={maximized ? "w-screen h-screen bg-white relative" : "w-full h-64"}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: maximized ? '100vh' : '16rem', borderRadius: maximized ? '0' : '0.75rem' }}
          center={center}
          zoom={maximized ? 15 : 12}
          options={{
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            zoomControl: true,
            fullscreenControl: false,
            mapTypeControl: maximized,
            streetViewControl: maximized,
            clickableIcons: false,
          }}
        >
          <Marker position={{ lat: route.origin.lat, lng: route.origin.lng }}
            icon={{
              url: 'data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="%2322c55e" stroke="white" stroke-width="4"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold">O</text></svg>'
            }}
            title={`Origin: ${route.origin.name}`} />
          {waypoints.map((wp, idx) => (
            <Marker key={wp.id} position={{ lat: wp.lat, lng: wp.lng }}
              icon={{
                url: `data:image/svg+xml;utf8,<svg width='36' height='36' viewBox='0 0 36 36' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='18' cy='18' r='16' fill='%23f59e0b' stroke='white' stroke-width='4'/><text x='18' y='24' text-anchor='middle' fill='white' font-size='14' font-family='Arial' font-weight='bold'>${idx + 1}</text></svg>`
              }}
              title={`Stop ${idx + 1}: ${wp.name}`} />
          ))}
          <Marker position={{ lat: route.destination.lat, lng: route.destination.lng }}
            icon={{
              url: 'data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="%23dc2626" stroke="white" stroke-width="4"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold">D</text></svg>'
            }}
            title={`Destination: ${route.destination.name}`} />
          {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#2563eb', strokeWeight: 4 } }} />}
        </GoogleMap>
        <button
          className="absolute top-4 right-4 z-10 bg-white rounded-full shadow p-2 hover:bg-gray-100"
          onClick={() => setMaximized(m => !m)}
          aria-label={maximized ? "Minimize map" : "Maximize map"}
        >
          {maximized ? (
            // Minimize (close/collapse) icon: X
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            // Maximize (expand) icon: four arrows out
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg>
          )}
        </button>
      </div>
    </div>
  );
};

const RouteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use React Router's useNavigate
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getRouteById(id).then(res => {
      if (res.success && res.data) {
        setRoute(res.data as RouteData);
        setError(null);
      } else {
        setError(res.error || 'Failed to fetch route');
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <MapLoader />;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (!route) return null;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-0">
      {/* Header row with back arrow and title */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-2">
        <button
          className="bg-white rounded-full shadow p-2 hover:bg-gray-100 border border-gray-200 transition"
          onClick={() => navigate('/app', { state: { tab: 'route' } })}
          aria-label="Back to routes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-3xl font-extrabold text-gray-900">{route.name}</h1>
      </div>
      {route.description && <p className="text-gray-600 mb-4 px-6">{route.description}</p>}
      <div className="px-6">
        <div className="rounded-xl overflow-hidden shadow mb-6 bg-white border border-gray-200">
          <MiniMap route={route} />
        </div>
        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="rounded-lg bg-gray-50 shadow border border-gray-200">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div className="text-gray-800 p-4 rounded-xl bg-gray-50 border border-gray-100 shadow-sm mt-2">
              <h2 className="text-xl font-semibold mb-2">Route Details</h2>
              <p className="mb-2"><span className="font-medium">Origin:</span> {route.origin.name}, {route.origin.address}</p>
              <p className="mb-2"><span className="font-medium">Destination:</span> {route.destination.name}, {route.destination.address}</p>
              {route.intermediateWaypoints.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium">Waypoints:</span>
                  <ul className="list-disc list-inside">
                    {route.intermediateWaypoints.map(wp => (
                      <li key={wp.id}>{wp.name}, {wp.address}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-gray-500">Route created on: {new Date(route.createdAt || 0).toLocaleDateString()}</p>
            </div>
          </TabsContent>
          <TabsContent value="photos">
            <div className="grid grid-cols-2 gap-4 mt-2">
              {route.photos && route.photos.length > 0 ? (
                route.photos.map((photo, idx) => (
                  <div key={idx} className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden shadow">
                    <img src={photo.url} alt={`Route photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-gray-500">No photos available for this route.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RouteDetails;
