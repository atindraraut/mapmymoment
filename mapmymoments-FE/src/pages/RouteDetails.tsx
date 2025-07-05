import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRouteById, deleteRoute, getS3UploadUrls } from '@/lib/api';
import MapLoader from '@/components/MapLoader';
import LazyImage from '@/components/LazyImage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle, Dialog } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ShareRouteModal from '@/components/ShareRouteModal';

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
  sharedWith?: Array<{
    userId: string;
    email: string;
    permission: string;
    sharedAt: string;
  }>;
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
  const [canUploadPhotos, setCanUploadPhotos] = useState(false);
  const [showAddImagesModal, setShowAddImagesModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [routeDetailsExpanded, setRouteDetailsExpanded] = useState(false);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthGuard();
  const { toast } = useToast();
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
      const userIsCreator = route.creatorId === email;
      setIsCreator(userIsCreator);
      
      // Check if user can upload photos (creator or shared user with upload permission)
      let canUpload = userIsCreator;
      if (!userIsCreator && route.sharedWith) {
        const sharedUser = route.sharedWith.find(user => user.email === email);
        canUpload = sharedUser?.permission === 'upload';
      }
      setCanUploadPhotos(canUpload);
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
  
  // Function to download image reliably from Cloudfront URL
  const downloadImage = async (e: React.MouseEvent, imageUrl: string, fileName: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      toast({
        title: "Downloading image...",
        description: "Your download will start shortly."
      });
      
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to download image");
      
      // Convert the image to a blob
      const imageBlob = await response.blob();
      
      // Create a URL for the blob
      const blobUrl = URL.createObjectURL(imageBlob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      
      // Programmatically click the link to trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "There was a problem downloading this image.",
        variant: "destructive"
      });
    }
  };

  // Calculate photos per page based on screen size
  const [photosPerPage, setPhotosPerPage] = useState(6);

  // Update photos per page based on screen size
  useEffect(() => {
    const updatePhotosPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) { // mobile
        setPhotosPerPage(6);
      } else if (width < 1024) { // tablet
        setPhotosPerPage(9);
      } else if (width < 1536) { // desktop
        setPhotosPerPage(12);
      } else { // large desktop
        setPhotosPerPage(15);
      }
    };

    updatePhotosPerPage();
    window.addEventListener('resize', updatePhotosPerPage);
    return () => window.removeEventListener('resize', updatePhotosPerPage);
  }, []);

  if (loading) return <MapLoader />;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (!route) return null;

  // Handler for photo pagination
  const handlePhotoPageChange = (pageNumber: number) => {
    setCurrentPhotoPage(pageNumber);
  };

  const totalPhotoPages = route?.photos ? Math.ceil(route.photos.length / photosPerPage) : 0;
  const currentPhotos = route?.photos ? 
    route.photos.slice((currentPhotoPage - 1) * photosPerPage, currentPhotoPage * photosPerPage) : 
    [];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-white to-accent/10 flex flex-col items-center p-4 sm:p-6 md:p-8">
      {/* Back button */}
      <button 
        onClick={() => navigate('/app', { state: { tab: 'route' } })}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm text-sm font-medium rounded-full shadow-md hover:bg-white transition-all duration-300 text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Back to Routes</span>
      </button>

      {/* Action buttons for creators */}
      {isCreator && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {/* Share button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
            onClick={() => setShowShareModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
          
          {/* Delete button */}
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Delete Route</span>
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-[2000px] mx-auto mt-14 px-4">
        {/* Cover Photo and Route Overview */}
        <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {route.photos && route.photos.length > 0 ? (
            <div className="relative h-[40vh] md:h-[50vh] lg:h-[60vh] 2xl:h-[70vh] w-full group">
              <LazyImage 
                src={route.photos[coverPhotoIndex].cloudfrontUrl} 
                alt={`Cover photo for ${route.name}`}
                className="w-full h-full object-cover"
              />
              {isCreator && (
                <button
                  onClick={() => setShowPhotoView(true)}
                  className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Change Cover Photo
                </button>
              )}
            </div>
          ) : (
            <div className="h-[40vh] md:h-[50vh] w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                <p className="text-gray-600 mb-4">No photos added yet</p>
                {isCreator && (
                  <button
                    onClick={() => setShowAddImagesModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg shadow transition-all flex items-center gap-2 mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Photos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Route Quick Info */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{route.name}</h1>
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <span className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {route.origin.name} → {route.destination.name}
              </span>
              {route.intermediateWaypoints.length > 0 && (
                <span className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {route.intermediateWaypoints.length} {route.intermediateWaypoints.length === 1 ? 'Stop' : 'Stops'}
                </span>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}${route.intermediateWaypoints.length > 0 ? `&waypoints=${route.intermediateWaypoints.map(wp => `${wp.lat},${wp.lng}`).join('|')}` : ''}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Route Details and Map Card */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => setRouteDetailsExpanded(!routeDetailsExpanded)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900">Route Details & Map</h2>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-500 transform transition-transform ${routeDetailsExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {routeDetailsExpanded && (
              <div className="p-6 pt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2">Origin</h3>
                      <p className="text-green-900">{route.origin.name}</p>
                      <p className="text-sm text-green-700">{route.origin.address}</p>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="font-medium text-red-800 mb-2">Destination</h3>
                      <p className="text-red-900">{route.destination.name}</p>
                      <p className="text-sm text-red-700">{route.destination.address}</p>
                    </div>

                    {route.intermediateWaypoints.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-3">Stops</h3>
                        <div className="space-y-3">
                          {route.intermediateWaypoints.map((stop, index) => (
                            <div key={stop.id} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-blue-900">{stop.name}</p>
                                <p className="text-sm text-blue-700">{stop.address}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-[400px] md:h-full min-h-[400px] rounded-lg overflow-hidden">
                    <MiniMap route={route} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photos
                {route.photos && (
                  <span className="text-sm font-normal text-gray-500">
                    ({route.photos.length} {route.photos.length === 1 ? 'photo' : 'photos'})
                  </span>
                )}
              </h2>
              {canUploadPhotos && (
                <button
                  onClick={() => setShowAddImagesModal(true)}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg shadow transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Photos
                </button>
              )}
            </div>

            {route.photos && route.photos.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 xl:gap-5">
                  {currentPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <div
                        className="w-full h-full rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => {
                          setCurrentPhotoIndex((currentPhotoPage - 1) * photosPerPage + idx);
                          setShowPhotoView(true);
                        }}
                      >
                        <LazyImage
                          src={photo.cloudfrontUrl}
                          alt={`Route photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      {isCreator && (
                        <button
                          onClick={() => setCoverPhotoIndex((currentPhotoPage - 1) * photosPerPage + idx)}
                          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                            (currentPhotoPage - 1) * photosPerPage + idx === coverPhotoIndex
                              ? 'bg-primary text-white'
                              : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80'
                          }`}
                          title={
                            (currentPhotoPage - 1) * photosPerPage + idx === coverPhotoIndex
                              ? 'Current cover photo'
                              : 'Set as cover photo'
                          }
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {totalPhotoPages > 1 && (
                  <div className="flex justify-center mt-6 gap-2">
                    <button
                      onClick={() => handlePhotoPageChange(Math.max(1, currentPhotoPage - 1))}
                      disabled={currentPhotoPage === 1}
                      className={`p-2 rounded-lg ${
                        currentPhotoPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                      Page {currentPhotoPage} of {totalPhotoPages}
                    </span>
                    <button
                      onClick={() => handlePhotoPageChange(Math.min(totalPhotoPages, currentPhotoPage + 1))}
                      disabled={currentPhotoPage === totalPhotoPages}
                      className={`p-2 rounded-lg ${
                        currentPhotoPage === totalPhotoPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                <p className="text-gray-600 mb-2">No photos available for this route</p>
                <p className="text-sm text-gray-500">Add some photos to showcase your journey</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {showPhotoView && route.photos && route.photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
             onClick={() => setShowPhotoView(false)}>
          <div className="relative w-full max-w-5xl max-h-[90vh] px-4">
            <LazyImage
              src={route.photos[currentPhotoIndex].cloudfrontUrl}
              alt={`Route photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-contain"
              showDownloadButton={true}
              downloadFileName={`Route-${route.name}-Photo-${currentPhotoIndex + 1}`}
            />

            <div className="absolute top-4 right-4 flex items-center gap-2">
              {isCreator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverPhotoIndex(currentPhotoIndex);
                  }}
                  className={`p-2 rounded-full transition-all ${
                    currentPhotoIndex === coverPhotoIndex
                      ? 'bg-primary text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={currentPhotoIndex === coverPhotoIndex ? 'Current cover photo' : 'Set as cover photo'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhotoView(false);
                }}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {route.photos.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
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
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
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

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              {currentPhotoIndex + 1} / {route.photos.length}
            </div>
          </div>
        </div>
      )}

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
                            <LazyImage 
                              src={previewUrl} 
                              alt={`Preview ${index}`}
                              className="w-full h-full group-hover:scale-105 transition-transform duration-300" 
                              onClick={() => {}} 
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
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

      {/* Share Route Modal */}
      {route && (
        <ShareRouteModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          routeId={route._id}
          routeName={route.name}
        />
      )}
    </div>
  );
};

export default RouteDetails;
