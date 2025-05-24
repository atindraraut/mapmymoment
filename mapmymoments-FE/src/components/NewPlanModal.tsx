import { cn } from "@/lib/utils"; // Assuming cn is here
import { Button } from "@/components/ui/button"; // Assuming Button is here
import { useToast } from "@/hooks/use-toast"; // Assuming useToast is here
import confetti from 'confetti-js'; // Added confetti
import { useState, useEffect, useRef, ReactNode } from 'react'; // Explicit React imports
import { useMapsLibrary } from '@vis.gl/react-google-maps'; // Assuming this is the correct import path

// Added Stop interface
interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

type Props = {
  isOpen: boolean;
  children?: ReactNode;
  onPlaceSelect?: (place: google.maps.places.PlaceResult | null, type: 'origin' | 'destination' | 'stop', stopId?: string) => void;
  onPreviewRoute?: (points: { origin: string; destination: string; stops: Stop[] }) => void;
  onClose: () => void; // Added onClose prop to manage modal visibility from parent
}

export default function NewPlanModal({ isOpen, onPlaceSelect, onPreviewRoute, onClose }: Props) {
  const { toast } = useToast();
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const stopInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [lastAddedStopId, setLastAddedStopId] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isFormExpanded, setIsFormExpanded] = useState(false); // New state for UI expansion


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
      const newOrigin = place.formatted_address || place.name || '';
      setOrigin(newOrigin);
      if (onPlaceSelect && place) {
        onPlaceSelect(place, 'origin');
      }
      if (newOrigin && !isFormExpanded) { // Expand form if an origin is selected
        setIsFormExpanded(true);
      }
    });
    return () => {
      listener.remove();
    };
  }, [placesLib, onPlaceSelect, isFormExpanded]); // isFormExpanded added to re-evaluate if needed, though primary attachment is on ref

  // Autocomplete for Destination
  useEffect(() => {
    if (!placesLib || !destinationInputRef.current || !isFormExpanded) { // Only init if expanded
      return;
    }
    const autocomplete = new placesLib.Autocomplete(destinationInputRef.current, autocompleteOptions);
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      setDestination(place.formatted_address || place.name || '');
      if (onPlaceSelect && place) {
        onPlaceSelect(place, 'destination');
      }
    });
    return () => {
      listener.remove();
    };
  }, [placesLib, onPlaceSelect, isFormExpanded]);

  // Autocomplete for Stops
  useEffect(() => {
    if (!placesLib || !isFormExpanded) { // Only init if expanded
      return;
    }
    const activeListeners: google.maps.MapsEventListener[] = [];
    stops.forEach((stop, index) => {
      const inputElement = stopInputRefs.current[index];
      if (inputElement) {
        const autocomplete = new placesLib.Autocomplete(inputElement, autocompleteOptions);
        const listener = autocomplete.addListener("place_changed", () => {
          const placeDetails = autocomplete.getPlace();
          const newName = placeDetails.formatted_address || placeDetails.name || '';
          setStops(currentStops =>
            currentStops.map(s =>
              s.id === stop.id ? { ...s, name: newName, lat: placeDetails.geometry?.location?.lat() || 0, lng: placeDetails.geometry?.location?.lng() || 0 } : s
            )
          );
          if (onPlaceSelect && placeDetails) {
            onPlaceSelect(placeDetails, 'stop', stop.id);
          }
        });
        activeListeners.push(listener);
      }
    });
    return () => {
      activeListeners.forEach(listener => listener.remove());
    };
  }, [placesLib, stops, onPlaceSelect, isFormExpanded]);

  const handleAddStop = () => {
    const newStopId = Date.now().toString();
    const newStop: Stop = { id: newStopId, name: '', lat: 0, lng: 0 };
    setStops([...stops, newStop]);
    setLastAddedStopId(newStopId);
  };

  useEffect(() => {
    if (lastAddedStopId && isFormExpanded) { // Ensure form is expanded before trying to focus
      const newStopIndex = stops.findIndex(s => s.id === lastAddedStopId);
      if (newStopIndex !== -1 && stopInputRefs.current[newStopIndex]) {
        stopInputRefs.current[newStopIndex]?.focus();
        setLastAddedStopId(null);
      }
    }
  }, [stops, lastAddedStopId, isFormExpanded]);

  const handleRemoveStop = (stopId: string) => {
    setStops(stops.filter(stop => stop.id !== stopId));
  };

  const handleStopInputChange = (id: string, value: string) => {
    setStops(currentStops =>
      currentStops.map(stop =>
        stop.id === id ? { ...stop, name: value } : stop
      )
    );
  };

  const handlePreview = () => {
    if (onPreviewRoute) {
      onPreviewRoute({ origin, destination, stops });
    }
    toast({ title: "Previewing Route", description: "Showing the route on the map." });
  };

  const handleSave = () => {
    setIsSaved(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast({
      title: "🎉 Route Saved Successfully!",
      description: "Your journey has been created. Let\'s add some memories!",
    });
    console.log("Route saved:", { routeName, origin, destination, stops });
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

  const finalizeJourney = () => {
    if (selectedPhotos.length > 0) {
      confetti({ particleCount: 200, spread: 160, origin: { y: 0.6 }, colors: ['#FF9B9B', '#FFB5B5', '#FFD1D1', '#FFE3E3'] });
      toast({ title: "Journey Complete! 🎉", description: "Your photos are being uploaded." });
      // TODO: Handle actual photo upload (e.g., to AWS S3)
      console.log("Uploading photos:", selectedPhotos);
    }
    // Reset state
    setRouteName('');
    setOrigin('');
    setDestination('');
    setStops([]);
    setSelectedPhotos([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setIsSaved(false);
    setIsFormExpanded(false); // Reset expansion
    setLastAddedStopId(null);
    toast({ title: "Route Completed! 🎯", description: "Ready to plan your next adventure!" });
    // onClose(); // Consider if finalizeJourney should also close the modal
  };
  
  const handleCloseAndReset = () => {
    setRouteName('');
    setOrigin('');
    setDestination('');
    setStops([]);
    setSelectedPhotos([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setIsSaved(false);
    setIsFormExpanded(false); // Reset expanded state
    setLastAddedStopId(null);
    onClose(); // Use onClose prop
  };

  // Reset expansion state if modal is closed externally
  useEffect(() => {
    if (!isOpen) {
      setIsFormExpanded(false);
      // Minimal reset here; handleCloseAndReset is more comprehensive for user-triggered close
    }
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-white z-50 shadow-xl fixed", // Common styles
        isFormExpanded
          ? // Expanded State: panel styles
            "flex flex-col overflow-hidden top-0 left-0 w-full h-full rounded-none " + // Mobile full screen
            // Desktop: Set left to 100px
            "md:rounded-lg md:top-4 md:left-[100px] md:w-[400px] md:h-auto md:max-h-[calc(100vh-2rem)]"
          : // Collapsed State: search bar styles
            "flex items-center rounded-full top-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[500px] " + // Mobile centered
            // Desktop: Set left to 100px
            "md:left-[100px] md:transform-none md:w-[400px] h-12 px-4"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Only show if expanded */}
      {isFormExpanded && (
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {isSaved ? "Journey Saved" : "Plan Your Route"}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleCloseAndReset}>X</Button>
        </div>
      )}

      {!isFormExpanded ? (
        // Simple Search Bar Content (Initial Collapsed State)
        <div className="flex items-center w-full h-full">
          {/* Icon placeholder: You can add a SearchIcon component here if you have one */}
          {/* e.g., <SearchIcon className="h-5 w-5 text-gray-500 mr-3" /> */}
          <input
            id="initialSearchOrigin"
            ref={originInputRef}
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
            }}
            onFocus={() => {
              if (!isFormExpanded) setIsFormExpanded(true);
            }}
            className="w-full h-full text-base bg-transparent outline-none placeholder-gray-600"
            placeholder="Search Google Maps" // Placeholder like the image
          />
          {/* Icon placeholder: You can add a DirectionsIcon here if you have one */}
          {/* e.g., <DirectionsIcon className="h-6 w-6 text-blue-500 ml-3 cursor-pointer" onClick={() => setIsFormExpanded(true)} /> */}
        </div>
      ) : (
        // Expanded Form Content
        <>
          {isSaved ? (
            // Saved State UI
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-green-600">🎉 Success!</h3>
                <p className="text-gray-600 mt-2">Your route "{routeName || 'Unnamed Route'}" has been saved.</p>
              </div>
              
              {/* Photo Upload Section */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Add Photos to Your Journey</h4>
                <input
                  type="file"
                  multiple
                  onChange={handlePhotoSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {previewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`Preview ${index}`} className="rounded-md object-cover h-24 w-full" />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6" 
                          onClick={() => removePhoto(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col space-y-3">
                <Button onClick={finalizeJourney} className="bg-green-500 hover:bg-green-600">
                  Finalize Journey & Upload Photos
                </Button>
                <Button variant="outline" onClick={() => { setIsSaved(false); /* Don't reset isFormExpanded here */ }}>
                  Edit Route
                </Button>
              </div>
            </div>
          ) : (
            // Planning State UI
            <>
              <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="routeName">Route Name (Optional)</label>
                  <input
                    id="routeName"
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Summer Road Trip"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="origin">Origin</label>
                  <input
                    id="origin" // Different ID from the initial search input
                    type="text"
                    ref={originInputRef} // Ref will point to this input when expanded
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter origin"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="destination">Destination</label>
                  <input
                    id="destination"
                    type="text"
                    ref={destinationInputRef}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter destination"
                  />
                </div>

                <div className="mb-4">
                  <h3 className="text-md font-semibold mb-2">Stops (Optional)</h3>
                  {stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center mb-2">
                      <input
                        type="text"
                        ref={el => stopInputRefs.current[index] = el}
                        value={stop.name}
                        onChange={(e) => handleStopInputChange(stop.id, e.target.value)}
                        className="w-full border rounded px-3 py-2 mr-2"
                        placeholder={`Stop ${index + 1}`}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveStop(stop.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={handleAddStop}
                    variant="outline"
                    className="mt-2 w-full"
                  >
                    Add Stop
                  </Button>
                </div>
              </div>
              {/* Footer Actions (only in planning mode and when form is expanded) */}
              <div className="p-4 border-t flex justify-end space-x-3">
                <Button variant="outline" onClick={handlePreview} disabled={!origin.trim() || !destination.trim()}>
                  Preview Route
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={!origin.trim() || !destination.trim()}>
                  Save Route
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
