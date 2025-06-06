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

  if (!isLoaded) return (
    <div className="w-full h-full min-h-[280px] flex items-center justify-center bg-gradient-to-br from-primary/10 to-gray-100 rounded-2xl animate-pulse">
      <div className="flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary/50 mb-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="text-primary/70 font-medium">Loading map...</span>
      </div>
    </div>
  );

  // Check if parent container is likely in desktop layout 
  // by checking the container height (this is a client-side check)
  const containerElement = document.querySelector('.lg\\:h-\\[calc\\(100vh-140px\\)\\]');
  const isFullHeight = containerElement && containerElement.clientHeight > 500;

  return (
    <div className={maximized 
      ? "fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in" 
      : "w-full h-full rounded-2xl overflow-hidden relative shadow-md transition-all duration-300"
    }>
      <div className={maximized ? "w-screen h-screen bg-white relative" : "w-full h-full"}>
        <GoogleMap
          mapContainerStyle={{ 
            width: '100%', 
            height: maximized ? '100vh' : '100%',
            minHeight: isFullHeight ? '600px' : '320px',
            borderRadius: maximized ? '0' : '1rem',
            boxShadow: maximized ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
          center={center}
          zoom={maximized ? 14 : 13}
          options={{
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            zoomControl: true,
            fullscreenControl: false,
            mapTypeControl: maximized,
            streetViewControl: maximized,
            clickableIcons: false,
            styles: [
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
              },
              {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [{ color: "#f5f5f5" }, { lightness: 20 }]
              },
              {
                featureType: "road.highway",
                elementType: "geometry.fill",
                stylers: [{ color: "#ffffff" }, { lightness: 17 }]
              },
              {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }]
              },
              {
                featureType: "road.arterial",
                elementType: "geometry",
                stylers: [{ color: "#ffffff" }, { lightness: 18 }]
              },
              {
                featureType: "road.local",
                elementType: "geometry",
                stylers: [{ color: "#ffffff" }, { lightness: 16 }]
              },
              {
                featureType: "poi",
                elementType: "geometry",
                stylers: [{ color: "#f5f5f5" }, { lightness: 21 }]
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#d5e9c8" }, { lightness: 21 }]
              },
              {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#f2f2f2" }, { lightness: 19 }]
              }
            ]
          }}
        >
          <Marker position={{ lat: route.origin.lat, lng: route.origin.lng }}
            icon={{
              url: 'data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="%231A6B72" stroke="white" stroke-width="4"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold">O</text></svg>'
            }}
            title={`Origin: ${route.origin.name}`} />
          {waypoints.map((wp, idx) => (
            <Marker key={wp.id} position={{ lat: wp.lat, lng: wp.lng }}
              icon={{
                url: `data:image/svg+xml;utf8,<svg width='36' height='36' viewBox='0 0 36 36' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='18' cy='18' r='16' fill='%2388C0D0' stroke='white' stroke-width='4'/><text x='18' y='24' text-anchor='middle' fill='white' font-size='14' font-family='Arial' font-weight='bold'>${idx + 1}</text></svg>`
              }}
              title={`Stop ${idx + 1}: ${wp.name}`} />
          ))}
          <Marker position={{ lat: route.destination.lat, lng: route.destination.lng }}
            icon={{
              url: 'data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="%23FF7D45" stroke="white" stroke-width="4"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold">D</text></svg>'
            }}
            title={`Destination: ${route.destination.name}`} />
          {directions && <DirectionsRenderer 
            directions={directions} 
            options={{ 
              polylineOptions: { 
                strokeColor: '#1A6B72', 
                strokeWeight: 4,
                strokeOpacity: 0.8
              },
              suppressMarkers: true
            }} 
          />}
        </GoogleMap>
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}${route.intermediateWaypoints.length > 0 ? `&waypoints=${route.intermediateWaypoints.map(wp => `${wp.lat},${wp.lng}`).join('|')}` : ''}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-white flex items-center gap-1.5 border border-blue-500 hover:bg-blue-700 transition-colors"
            title="Open in Google Maps"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Navigate
          </a>
          
          <button
            className="bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg p-2.5 transition-all duration-300 text-primary border border-white/40"
            onClick={() => setMaximized(m => !m)}
            aria-label={maximized ? "Minimize map" : "Maximize map"}
          >
            {maximized ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const RouteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [showPhotoView, setShowPhotoView] = useState<boolean>(false);
  const [currentPhotoPage, setCurrentPhotoPage] = useState<number>(1);

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

  const photosPerPage = 6; // Number of photos to show per page
  const totalPhotoPages = route.photos ? Math.ceil(route.photos.length / photosPerPage) : 0;

  // Handler for photo pagination
  const handlePhotoPageChange = (pageNumber: number) => {
    setCurrentPhotoPage(pageNumber);
  };

  // Calculate current photos to display based on pagination
  const currentPhotos = route.photos ? 
    route.photos.slice((currentPhotoPage - 1) * photosPerPage, currentPhotoPage * photosPerPage) : 
    [];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-white to-accent/10 flex flex-col items-center p-4 sm:p-6 md:p-8">
      {/* Back button - fixed position for easy access */}
      <button 
        onClick={() => navigate('/app', { state: { tab: 'route' } })}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm text-sm font-medium rounded-full shadow-md hover:bg-white transition-all duration-300 text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Back to Routes</span>
      </button>

      {/* Photo viewer modal */}
      {showPhotoView && route.photos && route.photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in" onClick={() => setShowPhotoView(false)}>
          <div className="relative w-full max-w-4xl max-h-[90vh]">
            <img 
              src={route.photos[currentPhotoIndex].url} 
              alt={`Route photo ${currentPhotoIndex + 1}`} 
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()} 
            />
            <div className="absolute top-2 right-2">
              <button 
                className="bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhotoView(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {route.photos.length > 1 && (
              <>
                <button 
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) => (prev - 1 + route.photos!.length) % route.photos!.length);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) => (prev + 1) % route.photos!.length);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm">
              {currentPhotoIndex + 1} / {route.photos.length}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto mt-14 sm:mt-16">
        {/* Main content section - two column on large screens */}
        <div className="lg:flex lg:gap-6 xl:gap-8">
          {/* Left column with route details */}
          <div className="lg:w-[40%] xl:w-[35%] lg:flex-shrink-0">
            {/* Main card with route summary */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-8 mb-6 border border-white/40 transition-all duration-300 hover:shadow-2xl animate-fade-in relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl -z-10"></div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">{route.name}</h1>
              
              <div className="mb-4 space-y-2">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-700 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-gray-800">{route.origin.name}</span>
                  </div>
                  
                  <div className="hidden sm:block text-gray-400">→</div>
                  
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-700 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </span>
                    <span className="text-gray-800">{route.destination.name}</span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}${route.intermediateWaypoints.length > 0 ? `&waypoints=${route.intermediateWaypoints.map(wp => `${wp.lat},${wp.lng}`).join('|')}` : ''}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm gap-2 shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Navigate Route
                  </a>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {route.intermediateWaypoints.length} {route.intermediateWaypoints.length === 1 ? 'Stop' : 'Stops'}
                </span>
                
                {route.photos && route.photos.length > 0 && (
                  <button
                    onClick={() => {
                      setCurrentPhotoIndex(0);
                      setShowPhotoView(true);
                    }}
                    className="bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-accent/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {route.photos.length} {route.photos.length === 1 ? 'Photo' : 'Photos'}
                  </button>
                )}
                
                {route.createdAt && (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(route.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Route details */}
            <div className="mb-6 animate-fade-in">
              <div className="text-gray-800 p-5 sm:p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Route Details
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="flex items-start">
                          <span className="font-medium text-green-700 mr-2 mt-0.5">Origin:</span> 
                          <span className="text-gray-700">{route.origin.name}, {route.origin.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="flex items-start">
                          <span className="font-medium text-red-700 mr-2 mt-0.5">Destination:</span> 
                          <span className="text-gray-700">{route.destination.name}, {route.destination.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {route.intermediateWaypoints.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-blue-700 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Stops
                        </h3>
                      </div>
                      <ul className="space-y-1.5">
                        {route.intermediateWaypoints.map((wp, index) => (
                          <li key={wp.id} className="flex items-start">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-200 text-blue-700 text-xs mt-0.5">{index + 1}</span>
                            <span className="text-gray-700 mx-2 flex-1">{wp.name}, {wp.address}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* <div className="mt-4">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}${route.intermediateWaypoints.length > 0 ? `&waypoints=${route.intermediateWaypoints.map(wp => `${wp.lat},${wp.lng}`).join('|')}` : ''}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Open in Google Maps
                    </a>
                  </div> */}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Route created on: {new Date(route.createdAt || 0).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Photos preview - Mobile only */}
            <div className="mb-6 lg:hidden animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/40">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Route Photos
                  </h2>
                  {route.photos && route.photos.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {route.photos.length} {route.photos.length === 1 ? 'photo' : 'photos'}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {route.photos && route.photos.length > 0 ? (
                    currentPhotos.map((photo, idx) => (
                      <div 
                        key={idx} 
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-300 group cursor-pointer"
                        onClick={() => {
                          setCurrentPhotoIndex((currentPhotoPage - 1) * photosPerPage + idx);
                          setShowPhotoView(true);
                        }}
                      >
                        <img src={photo.url} alt={`Route photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      <p className="text-gray-500 mb-2">No photos available for this route.</p>
                      <p className="text-xs text-gray-400">Photos can be added when creating or editing a route.</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination for Photos - Mobile */}
                {totalPhotoPages > 1 && (
                  <div className="flex justify-center mt-4 gap-1">
                    <button
                      onClick={() => handlePhotoPageChange(Math.max(1, currentPhotoPage - 1))}
                      disabled={currentPhotoPage === 1}
                      className={`px-2 py-1 rounded ${
                        currentPhotoPage === 1 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center px-2 text-sm">
                      {currentPhotoPage} / {totalPhotoPages}
                    </div>
                    <button
                      onClick={() => handlePhotoPageChange(Math.min(totalPhotoPages, currentPhotoPage + 1))}
                      disabled={currentPhotoPage === totalPhotoPages}
                      className={`px-2 py-1 rounded ${
                        currentPhotoPage === totalPhotoPages 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column with map and photos (on desktop) */}
          <div className="lg:flex-grow mt-6 lg:mt-0">
            {/* Map container */}
            <div className="rounded-2xl overflow-hidden shadow-lg bg-white border border-white/40 transition-all duration-200 hover:shadow-xl h-full">
              <div className="lg:h-[calc(100vh-300px)] xl:h-[calc(100vh-280px)]">
                <MiniMap route={route} />
              </div>
            </div>
            
            {/* Photos section - Desktop only */}
            <div className="hidden lg:block mt-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/40">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Route Photos
                  </h2>
                  {route.photos && route.photos.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {route.photos.length} {route.photos.length === 1 ? 'photo' : 'photos'}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {route.photos && route.photos.length > 0 ? (
                    currentPhotos.map((photo, idx) => (
                      <div 
                        key={idx} 
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-300 group cursor-pointer"
                        onClick={() => {
                          setCurrentPhotoIndex((currentPhotoPage - 1) * photosPerPage + idx);
                          setShowPhotoView(true);
                        }}
                      >
                        <img src={photo.url} alt={`Route photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      <p className="text-gray-500 mb-2">No photos available for this route.</p>
                      <p className="text-sm text-gray-400">Photos can be added when creating or editing a route.</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination for Photos - Desktop */}
                {totalPhotoPages > 1 && (
                  <div className="flex justify-center mt-4 gap-1">
                    <button
                      onClick={() => handlePhotoPageChange(Math.max(1, currentPhotoPage - 1))}
                      disabled={currentPhotoPage === 1}
                      className={`px-2 py-1 rounded ${
                        currentPhotoPage === 1 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center px-2 text-sm">
                      {currentPhotoPage} / {totalPhotoPages}
                    </div>
                    <button
                      onClick={() => handlePhotoPageChange(Math.min(totalPhotoPages, currentPhotoPage + 1))}
                      disabled={currentPhotoPage === totalPhotoPages}
                      className={`px-2 py-1 rounded ${
                        currentPhotoPage === totalPhotoPages 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetails;
