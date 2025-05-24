import { ReactNode, useEffect, useRef, useState } from "react";
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { cn } from "@/lib/utils"; // Assuming cn is here
import { Button } from "@/components/ui/button"; // Assuming Button is here
import { useToast } from "@/hooks/use-toast"; // Assuming useToast is here
import confetti from 'confetti-js'; // Added confetti

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
  // Added for consistency with PlanModal if external preview handling is needed
  onPreviewRoute?: (points: { origin: string; destination: string; stops: Stop[] }) => void; 
}

export default function PlanModal({ isOpen, onPlaceSelect, onPreviewRoute }: Props) {
  const { toast } = useToast(); // Initialize toast
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const stopInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // const lastInputRef = useRef<HTMLInputElement | null>(null); // Kept from PlanModal, might be useful
  const [lastAddedStopId, setLastAddedStopId] = useState<string | null>(null);

  // State from PlanModal.tsx
  const [isSaved, setIsSaved] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // showMobilePreview might not be directly applicable if NewPlanModal has a different responsive strategy,
  // but let's include it for now if we adapt PlanModal's responsive classes directly.
  const [showMobilePreview, setShowMobilePreview] = useState(false);


  const placesLib = useMapsLibrary('places');

  const autocompleteOptions = {
    fields: ["formatted_address", "geometry", "name", "place_id"],
    types: ["geocode", "establishment"],
  };

  // Autocomplete for Origin (existing, ensure it's preserved)
  useEffect(() => {
    if (!placesLib || !originInputRef.current) {
      return;
    }
    const autocomplete = new placesLib.Autocomplete(originInputRef.current, autocompleteOptions);
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      setOrigin(place.formatted_address || place.name || '');
      if (onPlaceSelect && place) {
        onPlaceSelect(place, 'origin');
      }
    });
    return () => {
      listener.remove();
    };
  }, [placesLib, onPlaceSelect]);

  // Autocomplete for Destination (existing, ensure it's preserved)
  useEffect(() => {
    if (!placesLib || !destinationInputRef.current) {
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
  }, [placesLib, onPlaceSelect]);

  // Autocomplete for Stops (existing, ensure it's preserved)
  useEffect(() => {
    if (!placesLib) {
      return;
    }
    const activeListeners: google.maps.MapsEventListener[] = [];
    stops.forEach((stop, index) => {
      const inputElement = stopInputRefs.current[index];
      if (inputElement) {
        const autocomplete = new placesLib.Autocomplete(inputElement, autocompleteOptions);
        const listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          setStops(currentStops =>
            currentStops.map(s =>
              s.id === stop.id
                ? {
                    ...s,
                    name: place.formatted_address || place.name || '',
                    lat: place.geometry?.location?.lat() || 0,
                    lng: place.geometry?.location?.lng() || 0,
                  }
                : s
            )
          );
          if (onPlaceSelect && place) {
            onPlaceSelect(place, 'stop', stop.id);
          }
        });
        activeListeners.push(listener);
      }
    });
    return () => {
      activeListeners.forEach(listener => listener.remove());
    };
  }, [placesLib, stops, onPlaceSelect]);

  const handleAddStop = () => {
    const newStopId = Date.now().toString();
    const newStop: Stop = { id: newStopId, name: '', lat: 0, lng: 0 };
    setStops([...stops, newStop]);
    setLastAddedStopId(newStopId);
  };

  useEffect(() => {
    if (lastAddedStopId) {
      const newStopIndex = stops.findIndex(s => s.id === lastAddedStopId);
      if (newStopIndex !== -1 && stopInputRefs.current[newStopIndex]) {
        stopInputRefs.current[newStopIndex]?.focus();
        setLastAddedStopId(null);
      }
    }
  }, [stops, lastAddedStopId]);

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

  // --- Features from PlanModal.tsx ---

  const handlePreview = () => {
    if (onPreviewRoute) {
      onPreviewRoute({ origin, destination, stops });
    }
    // setShowMobilePreview(true); // This was for PlanModal's specific layout, adjust if needed
    toast({ title: "Previewing Route", description: "Showing the route on the map." });
    // Actual map preview logic would be handled by the parent component via onPreviewRoute
  };

  const handleSave = () => {
    setIsSaved(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast({
      title: "🎉 Route Saved Successfully!",
      description: "Your journey has been created. Let\'s add some memories!",
    });
    // Here you would typically send the data (routeName, origin, destination, stops) to a backend.
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
  }, [previewUrls]); // Changed dependency to previewUrls

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
    previewUrls.forEach(url => URL.revokeObjectURL(url)); // Ensure cleanup before setting to empty
    setPreviewUrls([]);
    setIsSaved(false);
    // setShowMobilePreview(false);
    setLastAddedStopId(null);
    toast({ title: "Route Completed! 🎯", description: "Ready to plan your next adventure!" });
  };
  
  // Close modal and reset basic fields (can be expanded)
  const handleCloseAndReset = () => {
    // Call a prop to close the modal, e.g., onClose()
    setRouteName('');
    setOrigin('');
    setDestination('');
    setStops([]);
    setSelectedPhotos([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setIsSaved(false);
    // setIsOpen(false); // This should be handled by parent via a prop
  };


  if (!isOpen) {
    return null;
  }

  // UI structure adapted from PlanModal.tsx for responsiveness and features
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center", // Backdrop
        !isOpen && "hidden"
      )}
      onClick={handleCloseAndReset} // Optional: close on backdrop click
    >
      <div
        className={cn(
          "bg-white z-50 flex flex-col rounded-lg shadow-xl",
          "w-[90vw] max-w-[500px] h-auto max-h-[90vh]", // Mobile first
          "lg:w-[400px] lg:max-w-none", // Desktop size from PlanModal
          // showMobilePreview ? "lg:h-[60vh]" : "lg:h-auto", // If we implement a similar preview state
          "overflow-hidden"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing if clicking inside modal
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{isSaved ? "Journey Saved" : "Plan Your Route"}</h2>
          <Button variant="ghost" size="sm" onClick={handleCloseAndReset}>X</Button> {/* Replace with actual close handler */}
        </div>

        {isSaved ? (
          // Saved State UI (similar to PlanModal)
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-green-600">🎉 Success!</h3>
              <p className="text-gray-600 mt-2">Your route "{routeName}" has been saved.</p>
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
              {/* Photo Previews */}
              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Preview ${index}`} className="rounded-md object-cover h-24 w-full" />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col space-y-3">
              <Button onClick={finalizeJourney} className="bg-green-500 hover:bg-green-600">
                Finalize Journey & Upload Photos
              </Button>
              <Button variant="outline" onClick={() => setIsSaved(false)}>
                Edit Route
              </Button>
            </div>
          </div>
        ) : (
          // Planning State UI
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="routeName">Route Name</label>
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
                id="origin"
                type="text"
                ref={originInputRef}
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
              <h3 className="text-md font-semibold mb-2">Stops</h3>
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
        )}

        {/* Footer Actions (only in planning mode) */}
        {!isSaved && (
          <div className="p-4 border-t flex justify-end space-x-3">
            <Button variant="outline" onClick={handlePreview}>
              Preview Route
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Route
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
