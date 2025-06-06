/**
 * NewPlanModal Component
 * 
 * This component provides a modal interface for planning and saving routes:
 * - Search for origins, destinations, and stops using Google Places API
 * - Preview routes on a map
 * - Save routes to the backend
 * - Upload photos associated with the route
 */
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, ReactNode } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { 
  setRouteName, 
  setOrigin, 
  setDestination, 
  setStops,
  type Place,
  type Stop
} from '@/store/routeSlice';

type Props = {
  isOpen: boolean;
  children?: ReactNode;
  onPlaceSelect?: (place: google.maps.places.PlaceResult | null, type: 'origin' | 'destination' | 'stop', stopId?: string) => void;
  onPreviewRoute?: (points: { origin: string; destination: string; stops: Stop[] }) => void;
  onClose: () => void;
}

export default function NewPlanModal({ isOpen, onPlaceSelect, onPreviewRoute, onClose }: Props) {
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get state from Redux store
  const routeName = useSelector((state: RootState) => state.route.routeName);
  const origin = useSelector((state: RootState) => state.route.origin);
  const destination = useSelector((state: RootState) => state.route.destination);
  const stops = useSelector((state: RootState) => state.route.stops);

  // Local state for input values (what user is typing)
  const [originInputValue, setOriginInputValue] = useState('');
  const [destinationInputValue, setDestinationInputValue] = useState('');

  // Update input values when Redux state changes
  useEffect(() => {
    setOriginInputValue(origin?.name || '');
  }, [origin]);

  useEffect(() => {
    setDestinationInputValue(destination?.name || '');
  }, [destination]);

  // Debug: Log Redux state changes
  useEffect(() => {
    console.log('Redux state changed:', { routeName, origin, destination, stops });
  }, [routeName, origin, destination, stops]);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const stopInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [lastAddedStopId, setLastAddedStopId] = useState<string | null>(null);

  // Add state for saving route and route ID
  const [isSaved, setIsSaved] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);

  const placesLib = useMapsLibrary('places');

  const autocompleteOptions = {
    fields: ["formatted_address", "geometry", "name", "place_id"],
    types: ["geocode", "establishment"],
  };

  // Autocomplete for Origin
  useEffect(() => {
    if (!placesLib || !originInputRef.current) {
      return;
    }
    const autocomplete = new placesLib.Autocomplete(originInputRef.current, autocompleteOptions);
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const newOrigin: Place = {
          id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name || '',
          address: place.formatted_address || ''
        };
        // Dispatch to Redux immediately
        dispatch(setOrigin(newOrigin));
        if (onPlaceSelect && place) {
          onPlaceSelect(place, 'origin');
        }
        // Expand form if not already expanded
        if (!isFormExpanded) {
          setIsFormExpanded(true);
        }
      }
    });
    return () => {
      listener.remove();
    };
  }, [placesLib, onPlaceSelect, isFormExpanded, dispatch]);

  // Auto-focus on origin input when form expands
  useEffect(() => {
    if (isFormExpanded && originInputRef.current) {
      // Small delay to ensure the form is rendered
      setTimeout(() => {
        originInputRef.current?.focus();
      }, 100);
    }
  }, [isFormExpanded]);

  // Autocomplete for Destination
  useEffect(() => {
    if (!placesLib || !destinationInputRef.current || !isFormExpanded) {
      return;
    }
    const autocomplete = new placesLib.Autocomplete(destinationInputRef.current, autocompleteOptions);
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const newDestination: Place = {
          id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name || '',
          address: place.formatted_address || ''
        };
        // Dispatch to Redux immediately
        dispatch(setDestination(newDestination));
        if (onPlaceSelect && place) {
          onPlaceSelect(place, 'destination');
        }
      }
    });
    return () => {
      listener.remove();
    };
  }, [placesLib, onPlaceSelect, isFormExpanded, dispatch]);

  // Autocomplete for Stops
  useEffect(() => {
    if (!placesLib || !isFormExpanded) {
      return;
    }
    const activeListeners: google.maps.MapsEventListener[] = [];

    stops.forEach((stop, index) => {
      const inputElement = stopInputRefs.current[index];
      if (inputElement) {
        const autocomplete = new placesLib.Autocomplete(inputElement, autocompleteOptions);
        const listener = autocomplete.addListener("place_changed", () => {
          const placeDetails = autocomplete.getPlace();
          if (placeDetails.geometry?.location) {
            const updatedStops = stops.map(s =>
              s.id === stop.id ? { 
                ...s, 
                name: placeDetails.name || placeDetails.formatted_address || '',
                lat: placeDetails.geometry!.location!.lat(),
                lng: placeDetails.geometry!.location!.lng()
              } : s
            );
            dispatch(setStops(updatedStops));
            if (onPlaceSelect && placeDetails) {
              onPlaceSelect(placeDetails, 'stop', stop.id);
            }
          }
        });
        activeListeners.push(listener);
      }
    });

    return () => {
      activeListeners.forEach(listener => listener.remove());
    };
  }, [placesLib, stops.length, onPlaceSelect, isFormExpanded, dispatch]);

  const handleAddStop = () => {
    const newStopId = Date.now().toString();
    const newStop: Stop = { id: newStopId, name: '', lat: 0, lng: 0 };
    dispatch(setStops([...stops, newStop]));
    setLastAddedStopId(newStopId);
  };

  useEffect(() => {
    if (lastAddedStopId && isFormExpanded) {
      const newStopIndex = stops.findIndex(s => s.id === lastAddedStopId);
      if (newStopIndex !== -1) {
        const stopToFocus = stops[newStopIndex];
        // Only focus if this is truly a new empty stop, not an updated one
        if (stopToFocus.name === '' && stopToFocus.lat === 0 && stopToFocus.lng === 0) {
          stopInputRefs.current[newStopIndex]?.focus();
        }
        // Clear the lastAddedStopId after attempting to focus
        setLastAddedStopId(null);
      }
    }
  }, [stops, lastAddedStopId, isFormExpanded]);

  const handleRemoveStop = (stopId: string) => {
    const updatedStops = stops.filter(stop => stop.id !== stopId);
    dispatch(setStops(updatedStops));
  };

  const handleStopInputChange = (id: string, value: string) => {
    // Only update the name when user types manually, preserve existing coordinates
    const updatedStops = stops.map(stop =>
      stop.id === id ? { ...stop, name: value } : stop
    );
    dispatch(setStops(updatedStops));
  };

  const handlePreview = () => {
    if (onPreviewRoute && origin && destination) {
      onPreviewRoute({ 
        origin: origin.name, 
        destination: destination.name, 
        stops 
      });
    }
    toast({ title: "Previewing Route", description: "Showing the route on the map." });
  };

  const handleSave = async () => {
    if (!origin || !destination) {
      toast({
        title: "❌ Cannot Save Route",
        description: "Please set both origin and destination.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    // Show loading toast
    toast({
      title: "📍 Saving Route...",
      description: "Please wait while we save your journey.",
    });
    
    try {
      // Import the saveRoute function
      const { saveRoute } = await import('@/lib/api');
      
      // Format data for API
      const routeData = {
        name: routeName || `Journey ${new Date().toLocaleDateString()}`,
        origin: {
          id: origin.id,
          lat: origin.lat,
          lng: origin.lng,
          name: origin.name,
          address: origin.address || origin.name
        },
        destination: {
          id: destination.id,
          lat: destination.lat,
          lng: destination.lng,
          name: destination.name,
          address: destination.address || destination.name
        },
        intermediateWaypoints: stops.map(stop => ({
          id: stop.id,
          lat: stop.lat,
          lng: stop.lng,
          name: stop.name,
          address: stop.name // Using name as address since we don't have separate address
        }))
      };
      
      // Call API to save route
      const result = await saveRoute(routeData);
      
      if (result.success) {
        setIsSaved(true);
        setSavedRouteId(result.data?.id || null);
        toast({
          title: "🎉 Route Saved Successfully!",
          description: "Your route has been saved. Add photos or plan another route.",
        });
        console.log("Route saved with ID:", result.data?.id);
      } else {
        toast({
          title: "❌ Error Saving Route",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during route save:", error);
      toast({
        title: "❌ Error Saving Route",
        description: "There was an issue connecting to the server.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForNewRoute = () => {
    // Reset Redux state for new route
    dispatch(setRouteName(''));
    dispatch(setOrigin(null));
    dispatch(setDestination(null));
    dispatch(setStops([]));
    
    // Reset local state
    setIsSaved(false);
    setSelectedPhotos([]);
    setPreviewUrls([]);
    setIsFormExpanded(false);
    
    // Clear photo URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    toast({
      title: "Ready for Next Route! 🚀",
      description: "Plan another amazing journey.",
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
    
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const finalizeJourney = async () => {
    if (selectedPhotos.length > 0 && savedRouteId) {
      if (selectedPhotos.length > 30) {
        toast({
          title: "❌ Too Many Photos",
          description: "You can upload a maximum of 30 images at once.",
          variant: "destructive"
        });
        return;
      }
      setIsUploading(true);
      try {
        toast({
          title: "📸 Getting Upload URLs...",
          description: "Preparing to upload your photos."
        });
        const filenames = selectedPhotos.map(f => f.name);
        const contentTypes = selectedPhotos.map(f => f.type || 'application/octet-stream');
        // Custom fetch to send both filenames and contentTypes
        const response = await apiFetch(`/api/routes/${savedRouteId}/generate-upload-urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filenames, contentTypes })
        },false);
        let urlRes;
        try {
          urlRes = await response.json();
        } catch (e) {
          toast({
            title: "❌ Failed to get upload URLs",
            description: "Server returned invalid JSON. Please try again.",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }
        // Accept both { urls: [...] } and { success, data } shapes
        let urls = urlRes.data || urlRes.urls;
        if (!urls || !Array.isArray(urls)) {
          toast({
            title: "❌ Failed to get upload URLs",
            description: urlRes.error || "Could not get S3 signed URLs.",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }
        toast({
          title: "📤 Uploading Photos...",
          description: `Uploading ${selectedPhotos.length} images to S3.`
        });
        // Upload each file to its signed URL
        for (let i = 0; i < selectedPhotos.length; i++) {
          const file = selectedPhotos[i];
          const urlObj = urls.find(u => u.filename === file.name);
          if (!urlObj) continue;

          console.log('Uploading to URL:', urlObj.url);
          console.log('Headers:', {
            'Content-Type': file.type || 'application/octet-stream',
            'Cache-Control': 'max-age=7200'
          });

          const res = await fetch(urlObj.url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
              'Cache-Control': 'max-age=7200'
            }
          });

          if (!res.ok) {
            toast({
              title: `❌ Failed to upload ${file.name}`,
              description: `Could not upload image to S3.`,
              variant: "destructive"
            });
          }
        }
        toast({
          title: "✅ Photos Uploaded!",
          description: "Your journey photos have been uploaded to S3."
        });
      } catch (error) {
        console.error('Error uploading photos:', error);
        toast({
          title: "❌ Photo Upload Error",
          description: "There was a problem uploading your photos.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      toast({
        title: "Journey Complete! 🎉",
        description: selectedPhotos.length === 0
          ? "Your route has been saved without photos."
          : "No route ID found to upload photos to."
      });
    }
    // Clean up photo URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    // Reset for new route
    handleResetForNewRoute();
  };

  const handleCollapseModal = () => {
    // Reset Redux state
    dispatch(setRouteName(''));
    dispatch(setOrigin(null));
    dispatch(setDestination(null));
    dispatch(setStops([]));
    
    // Reset local state
    setIsSaved(false);
    setSelectedPhotos([]);
    setPreviewUrls([]);
    setIsFormExpanded(false);
    
    // Clear input values
    setOriginInputValue('');
    setDestinationInputValue('');
    
    // Clean up photo URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  };

  const handleCloseAndReset = () => {
    // Reset Redux state
    dispatch(setRouteName(''));
    dispatch(setOrigin(null));
    dispatch(setDestination(null));
    dispatch(setStops([]));
    
    // Reset local state
    setIsSaved(false);
    setSelectedPhotos([]);
    setPreviewUrls([]);
    setSavedRouteId(null);
    setIsSaving(false);
    setIsUploading(false);
    
    // Clean up resources
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Close the modal
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setIsFormExpanded(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 pointer-events-none"
    )}>
      {/* Responsive Floating Container */}
      <div className={cn(
        "absolute pointer-events-auto",
        // Mobile positioning (full width with margins)
        "top-4 left-4 right-4",
        "w-auto max-w-none",
        // Tablet positioning
        "sm:top-6 sm:left-6 sm:right-auto sm:w-full sm:max-w-md",
        // Desktop positioning (avoid sidebar overlap)
        "lg:left-24 lg:max-w-lg",
        "bg-white rounded-lg shadow-xl border border-gray-200/50",
        "transform transition-all duration-300 ease-out",
        isFormExpanded 
          ? "translate-y-0 opacity-100 scale-100" 
          : "translate-y-0 opacity-100 scale-100"
      )}>
        {/* Expanded Header with Close Button */}
        {isFormExpanded && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🗺️</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {isSaved ? "Journey Saved" : "Plan Your Route"}
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCollapseModal}
              className="w-8 h-8 rounded-full hover:bg-gray-100/50 transition-colors"
            >
              ✕
            </Button>
          </div>
        )}

        {/* Content Area */}
        <div className="max-h-[calc(100vh-16rem)] sm:max-h-[calc(100vh-12rem)] lg:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
          {!isFormExpanded ? (
            // Initial state - only origin input visible with floating style
            <div className="p-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-white shadow-sm z-10"></div>
                <input
                  id="origin-initial"
                  type="text"
                  ref={originInputRef}
                  value={originInputValue}
                  onChange={(e) => {
                    setOriginInputValue(e.target.value);
                  }}
                  onFocus={() => {
                    if (!isFormExpanded) {
                      setIsFormExpanded(true);
                    }
                  }}
                  className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base border border-gray-200 rounded-full bg-white shadow-sm hover:shadow-md focus:shadow-lg focus:border-blue-500 focus:ring-0 transition-all duration-200 placeholder:text-gray-500"
                  placeholder="Where do you want to start your journey?"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {isSaved ? (
                <div className="text-center space-y-4 py-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center mb-3">
                    <span className="text-white text-xl">✅</span>
                  </div>
                  <p className="text-gray-700 text-base font-medium">
                    Route "{routeName || 'Unnamed Route'}" saved!
                  </p>
                  <p className="text-gray-500 text-sm">
                    Add photos or start planning your next route
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        📸 Add photos from your journey (optional)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors"
                      />
                    </div>
                    
                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Preview ${index}`} 
                              className="w-full h-12 object-cover rounded group-hover:shadow-md transition-shadow" 
                            />
                            <button
                              onClick={() => removePhoto(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <Button 
                      onClick={finalizeJourney} 
                      disabled={isUploading}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
                    >
                      {isUploading ? '⏳ Uploading Photos...' : '✅ Complete Journey'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleResetForNewRoute}
                      className="border-2 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 px-4 py-2 text-sm rounded-lg transition-all duration-200"
                    >
                      🗺️ Plan New Route
                    </Button>
                  </div>
                </div>
              ) : (
                // Expanded form with floating style inputs
                <div className="space-y-4">
                  {/* Route Name */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏷️ Route Name
                    </label>
                    <input
                      id="routeName"
                      type="text"
                      value={routeName}
                      onChange={(e) => {
                        const newRouteName = e.target.value;
                        dispatch(setRouteName(newRouteName));
                      }}
                      className="w-full px-4 py-3 text-sm sm:text-base border-2 border-gray-200/50 rounded-xl bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all duration-200 placeholder:text-gray-400"
                      placeholder="Give your route a memorable name..."
                    />
                  </div>

                  {/* Origin Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Starting Point
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                      <input
                        id="origin"
                        type="text"
                        ref={originInputRef}
                        value={originInputValue}
                        onChange={(e) => setOriginInputValue(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm sm:text-base border-2 border-gray-200/50 rounded-xl bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all duration-200 placeholder:text-gray-400"
                        placeholder="Enter your starting location"
                      />
                    </div>
                  </div>

                  {/* Destination Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Destination
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                      <input
                        id="destination"
                        type="text"
                        ref={destinationInputRef}
                        value={destinationInputValue}
                        onChange={(e) => setDestinationInputValue(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm sm:text-base border-2 border-gray-200/50 rounded-xl bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all duration-200 placeholder:text-gray-400"
                        placeholder="Where are you heading?"
                      />
                    </div>
                  </div>

                  {/* Stops Section */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      🛑 Stops (Optional)
                    </label>
                    {stops.map((stop, index) => (
                      <div key={stop.id} className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                          <input
                            type="text"
                            value={stop.name}
                            ref={el => stopInputRefs.current[index] = el}
                            onChange={(e) => handleStopInputChange(stop.id, e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border-2 border-gray-200/50 rounded-lg bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all duration-200 placeholder:text-gray-400"
                            placeholder={`Stop ${index + 1}`}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStop(stop.id)}
                          className="w-8 h-8 p-0 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddStop}
                      className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700 rounded-lg py-2.5 transition-all duration-200"
                    >
                      ➕ Add Stop
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handlePreview} 
                      disabled={!origin || !destination}
                      className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm sm:text-base transition-all duration-200 disabled:opacity-50"
                    >
                      👁️ Preview Route
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={!origin || !destination || isSaving}
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl py-2.5 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {isSaving ? '⏳ Saving...' : '💾 Save Route'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
