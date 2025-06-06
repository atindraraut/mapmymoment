import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRouteById, deleteRoute, getS3UploadUrls } from '@/lib/api';
import MapLoader from '@/components/MapLoader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle, Dialog } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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
  creatorId: string;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showAddImagesModal, setShowAddImagesModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthGuard();
  const { toast } = useToast();

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

  // Check if the current user is the creator of this route
  useEffect(() => {
    if (route ) {
      // Compare route.creatorId with user.email to determine if the current user is the creator
      const email = localStorage.getItem('email');
      console.log("email from localStorage:", email);
      setIsCreator(route.creatorId === email);
    }
  }, [route, user]);

  const handleDelete = async () => {
    try {
      toast({
        title: "🗑️ Deleting Route",
        description: "Your route is being deleted..."
      });
      
      await deleteRoute(id!);
      
      toast({
        title: "✅ Route Deleted",
        description: "Your route has been successfully deleted"
      });
      
      // Navigate back to routes page
      navigate('/app');
    } catch (err) {
      console.error('Failed to delete route:', err);
      
      toast({
        title: "❌ Delete Failed",
        description: "Failed to delete the route. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Clean up previous preview URLs to avoid memory leaks
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Create preview URLs for all selected files
      const newUrls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(newUrls);
    }
  };
  
  // Clean up preview URLs when component unmounts or modal closes
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);
  
  // Clean up when the add images modal closes
  useEffect(() => {
    if (!showAddImagesModal) {
      // Only clean up URLs if we're not in the middle of an upload
      if (!isUploading) {
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls([]);
      }
    }
  }, [showAddImagesModal, isUploading]);

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFiles.length || !id) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Show toast for starting upload process
      toast({
        title: "📸 Preparing Upload",
        description: `Getting ready to upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'photo' : 'photos'}`,
      });
      
      // Get filenames and content types from selected files
      const filenames = selectedFiles.map(file => file.name);
      const contentTypes = selectedFiles.map(file => file.type || 'application/octet-stream');
      
      // Import the apiFetch function to directly call the API
      const { apiFetch } = await import('@/lib/api');
      
      // Get signed URLs for uploading - using apiFetch directly to send both filenames and contentTypes
      const response = await apiFetch(`/api/routes/${id}/generate-upload-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames, contentTypes })
      }, true);
      
      let uploadUrlsData;
      try {
        uploadUrlsData = await response.json();
      } catch (e) {
        throw new Error('Server returned invalid JSON. Please try again.');
      }
      
      // Accept both { urls: [...] } and { success, data } shapes
      let urls = uploadUrlsData.data || uploadUrlsData.urls;
      
      if (!urls || !Array.isArray(urls)) {
        throw new Error(uploadUrlsData.error || 'Failed to get upload URLs');
      }
      
      toast({
        title: "📤 Uploading Photos",
        description: "Your photos are being uploaded to the route.",
      });
      
      // Upload each file using the signed URLs
      const uploadPromises = selectedFiles.map((file, index) => {
        const urlInfo = urls.find(u => u.filename === file.name);
        if (!urlInfo) {
          throw new Error(`No upload URL found for file: ${file.name}`);
        }
        
        console.log(`Uploading ${file.name} to: ${urlInfo.url}`);
        
        // Upload to S3 using fetch
        return fetch(urlInfo.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'Cache-Control': 'max-age=7200'
          },
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
          // Update progress after each successful upload
          setUploadProgress(prev => prev + (100 / selectedFiles.length));
          return urlInfo;
        });
      });
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Refresh route data to show new images
      const refreshedData = await getRouteById(id);
      if (refreshedData.success && refreshedData.data) {
        setRoute(refreshedData.data as RouteData);
      }
      
      // Clean up preview URLs to avoid memory leaks
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Reset state
      setSelectedFiles([]);
      setPreviewUrls([]);
      setShowAddImagesModal(false);
      setIsUploading(false);
      setUploadProgress(0);
      
      // Show success message
      toast({
        title: "🎉 Upload Complete",
        description: `${selectedFiles.length} ${selectedFiles.length === 1 ? 'photo' : 'photos'} uploaded successfully!`
      });
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setIsUploading(false);
      
      // Clean up any progress and reset the upload state
      setUploadProgress(0);
      
      // Show error message as a toast
      toast({
        title: "❌ Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload images. Please try again.',
        variant: "destructive"
      });
    }
  };

  const handleAddImages = () => {
    // Clean up any existing preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Reset state for the modal
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadProgress(0);
    setIsUploading(false);
    setShowAddImagesModal(true);
  };

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
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-white to-accent/10 flex flex-col items-center p-4 sm:p-6 md:p-8"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))', 
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))', 
        paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))', 
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))',
      }}
      {/* Back button - fixed position for easy access */}
      <button 
        onClick={() => navigate('/app', { state: { tab: 'route' } })}
        className="fixed top-4 left-4 top-safe-4 left-safe-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm text-sm font-medium rounded-full shadow-md hover:bg-white transition-all duration-300 text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Back to Routes</span>
      </button>

      {/* Delete button at the top */}
      {isCreator && (
        <button
          className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
          onClick={() => setShowDeleteConfirm(true)}
          title="Delete this Route"
          style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))', right: 'calc(1rem + env(safe-area-inset-right, 0px))' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Delete Route</span>
        </button>
      )}

      {/* Photo viewer modal */}
      {showPhotoView && route.photos && route.photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in" onClick={() => setShowPhotoView(false)}>
          <div className="relative w-full max-w-4xl max-h-[90vh]">
            <img 
              src={route.photos[currentPhotoIndex].cloudfrontUrl} 
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

      <div className="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-14 sm:pt-16" 
           style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
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
                    className="inline-flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm gap-2 shadow-sm"
                    title="Open this route in Google Maps"
                  >
                    <div className="flex items-center gap-2">
                      <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003z" fill="#34A853"/><path d="M3.05 11.650l.021.034 4.56-5.429a.415.415 0 0 0-.025-.03l-4.56 5.429.004-.004z" fill="#FBBC04"/>
                        <path d="M14.322 13.057c-.225 1.6-1.273 3.043-2.696 3.727-.102.047-.203.094-.305.14l-.018.007a5.25 5.25 0 0 1-1.57.45c-.442.07-.877.108-1.318.108-.602 0-1.204-.087-1.784-.26l.006-.002c-.241-.074-.476-.166-.705-.27l4.882-5.808c.087.075.173.15.26.225a5.13 5.13 0 0 1 1.33 2.121 5.568 5.568 0 0 1 .085.478c.014.077.025.155.035.233.01.075.017.149.023.224z" fill="#4285F4"/>
                        <path d="M5.664 16.506c-1.17-.857-2.176-1.965-2.608-3.35a7.303 7.303 0 0 1-.198-5.37l4.64-5.513c-1.086-.239-2.203-.243-3.299-.007l.004-.005C1.919 3.011.622 5.193.16 7.682l-.015.095a9.64 9.64 0 0 0-.1 1.543c0 2.707 1.146 5.332 3.138 7.18l2.457-3.993h.024z" fill="#EA4335"/>
                      </svg>
                      <span className="font-medium">Google Maps</span>
                    </div>
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
                  <div className="flex items-center gap-2">
                    {route.photos && route.photos.length > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {route.photos.length} {route.photos.length === 1 ? 'photo' : 'photos'}
                      </span>
                    )}
                    {isCreator && (
                      <button
                        onClick={handleAddImages}
                        className="text-xs bg-primary hover:bg-primary/90 text-white px-2 py-1 rounded-full flex items-center gap-1"
                        title="Add Images"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    )}
                  </div>
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
                        <img src={photo.cloudfrontUrl} alt={`Route photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                  <div className="flex items-center gap-2">
                    {route.photos && route.photos.length > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {route.photos.length} {route.photos.length === 1 ? 'photo' : 'photos'}
                      </span>
                    )}
                    {isCreator && (
                      <button
                        onClick={handleAddImages}
                        className="text-xs bg-primary hover:bg-primary/90 text-white px-2 py-1 rounded-full flex items-center gap-1"
                        title="Add Images"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    )}
                  </div>
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
                        <img src={photo.cloudfrontUrl} alt={`Route photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

      {/* No duplicate action buttons needed since they're now in the top bar */}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this route? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              onClick={handleDelete}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Yes, Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add images modal */}
      <Dialog open={showAddImagesModal} onOpenChange={setShowAddImagesModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Photos to Your Route
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Share the beautiful moments from your journey. You can select multiple photos at once.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col gap-5">
              <div className="flex justify-center">
                <button
                  onClick={openFileSelector}
                  className="w-full max-w-sm py-3 px-5 bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-md hover:shadow-lg hover:from-primary/95 hover:to-accent/95 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98] duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Browse Photos
                </button>
              </div>
              
              {selectedFiles.length > 0 ? (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Selected Photos ({selectedFiles.length})
                    </h3>
                    <button 
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {selectedFiles.map((file, index) => {
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
                            <img 
                              src={previewUrl} 
                              alt={`Preview ${index}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              onLoad={() => URL.revokeObjectURL(previewUrl)}
                            />
                          </div>
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mb-1">No photos selected yet</p>
                  <p className="text-sm text-gray-400">Click "Browse Photos" to select images</p>
                </div>
              )}
            </div>
          </div>
          
          {isUploading && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Uploading... {Math.round(uploadProgress)}% complete
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-gray-200"
              onClick={() => setShowAddImagesModal(false)}
            >
              Cancel
            </button>
            <button
              className={`${selectedFiles.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-accent hover:shadow-md'} text-white px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2`}
              onClick={handleImageUpload}
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading Photos
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload {selectedFiles.length > 0 ? `${selectedFiles.length} Photo${selectedFiles.length > 1 ? 's' : ''}` : 'Photos'}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RouteDetails;
