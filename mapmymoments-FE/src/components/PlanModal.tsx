import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';

interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface PlanModalProps {
  isOpen: boolean;
  onPreviewRoute?: (points: { origin: string; destination: string; stops: Stop[] }) => void;
}

const PlanModal = ({ isOpen, onPreviewRoute }: PlanModalProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [draggedStop, setDraggedStop] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const dragItemRef = useRef<HTMLDivElement | null>(null);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const [lastAddedStopId, setLastAddedStopId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleAddStop = () => {
    const newStop: Stop = {
      id: Date.now().toString(),
      name: '',
      lat: 0,
      lng: 0
    };
    setStops([...stops, newStop]);
    setLastAddedStopId(newStop.id);
  };

  // Focus the new input when a stop is added
  useEffect(() => {
    if (lastAddedStopId && lastInputRef.current) {
      lastInputRef.current.focus();
    }
  }, [stops.length]);

  const handleMoveStop = (dragIndex: number, hoverIndex: number) => {
    const newStops = [...stops];
    const draggedStop = newStops[dragIndex];
    newStops.splice(dragIndex, 1);
    newStops.splice(hoverIndex, 0, draggedStop);
    setStops(newStops);
  };

  const handleRemoveStop = (stopId: string) => {
    setStops(stops.filter(stop => stop.id !== stopId));
  };

  const handlePreview = () => {
    if (onPreviewRoute) {
      onPreviewRoute({
        origin,
        destination,
        stops
      });
    }
    setShowMobilePreview(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const reorderStops = (dragIndex: number, dropIndex: number) => {
    const draggedStop = stops[dragIndex];
    const newStops = [...stops];
    newStops.splice(dragIndex, 1);
    newStops.splice(dropIndex, 0, draggedStop);
    setStops(newStops);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    setDraggedStop(index);
    setTouchStartY(e.touches[0].clientY);
    const element = e.currentTarget as HTMLDivElement;
    element.style.opacity = '0.6';
    element.style.transform = 'scale(1.02)';
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggedStop === null || touchStartY === null) return;

    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const dropTarget = elements.find(el => el.hasAttribute('data-stop-index')) as HTMLElement;

    if (dropTarget) {
      const dropIndex = parseInt(dropTarget.getAttribute('data-stop-index') || '0');
      if (dropIndex !== draggedStop) {
        const currentY = touch.clientY;
        const deltaY = currentY - touchStartY;
        if (Math.abs(deltaY) > 30) { // Threshold for reordering
          reorderStops(draggedStop, dropIndex);
          setDraggedStop(dropIndex);
          setTouchStartY(currentY);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const element = e.currentTarget as HTMLDivElement;
    element.style.opacity = '1';
    element.style.transform = 'none';
    setDraggedStop(null);
    setTouchStartY(null);
  };

  const handleSave = () => {
    setIsSaved(true);
    // Trigger confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    toast({
      title: "🎉 Route Saved Successfully!",
      description: "Your journey has been created. Let's add some memories!",
    });
  };

  const handleShare = () => {
    toast({
      title: "Share Your Journey",
      description: "Your shareable link has been copied to clipboard!",
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            // TODO: Implement actual sharing logic
            navigator.clipboard.writeText("https://mapmymoments.com/route/123");
          }}
        >
          Copy Link
        </Button>
      ),
    });
  };

  const finalizeJourney = () => {
    if (selectedPhotos.length > 0) {
      // Show celebratory confetti
      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 },
        colors: ['#FF9B9B', '#FFB5B5', '#FFD1D1', '#FFE3E3']
      });
      
      // TODO: Handle actual photo upload with AWS S3
      toast({
        title: "Journey Complete! 🎉",
        description: "Your photos are being uploaded. We'll notify you when they're ready.",
      });
    }

    // Clear all states to prepare for a new route
    setRouteName('');
    setOrigin('');
    setDestination('');
    setStops([]);
    setSelectedPhotos([]);
    // Clean up preview URLs to prevent memory leaks
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setIsSaved(false);
    setIsExpanded(false);
    setShowMobilePreview(false);
    setDraggedStop(null);
    setTouchStartY(null);
    setLastAddedStopId(null);
    
    toast({
      title: "Route Completed! 🎯",
      description: "Ready to plan your next adventure!",
    });
  };

  // Render the waypoints list for the planning view
  const renderWaypointsList = () => (
    <div className="space-y-2 my-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">
          Stops ({stops.length}/8)
        </span>
        {stops.length > 0 && (
          <span className="text-xs text-gray-500">
            {window.matchMedia('(pointer: coarse)').matches ? 'Touch and hold to reorder' : 'Drag to reorder'}
          </span>
        )}
      </div>
      
      {stops.map((stop, index) => (
        <div
          key={stop.id}
          ref={index === draggedStop ? dragItemRef : null}
          data-stop-index={index}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index.toString());
            setDraggedStop(index);
            (e.currentTarget as HTMLDivElement).style.opacity = '0.6';
          }}
          onDragEnd={(e) => {
            setDraggedStop(null);
            (e.currentTarget as HTMLDivElement).style.opacity = '1';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-gray-50');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-gray-50');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-gray-50');
            const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
            if (dragIndex !== index) {
              reorderStops(dragIndex, index);
            }
          }}
          onTouchStart={(e) => handleTouchStart(e, index)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            "flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200",
            "transform transition-all duration-200",
            "hover:shadow-md hover:border-gray-300",
            "touch-none",
            draggedStop === index && "shadow-lg border-primary bg-gray-50"
          )}
        >
          {/* Drag Handle */}
          <div className="flex-shrink-0 touch-none p-2 -m-2">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 2a1 1 0 011 1v1h3V3a1 1 0 112 0v1h3V3a1 1 0 112 0v3h1a1 1 0 110 2h-1v3h1a1 1 0 110 2h-1v3a1 1 0 11-2 0v-1h-3v1a1 1 0 11-2 0v-1H7v1a1 1 0 11-2 0v-3H4a1 1 0 110-2h1V8H4a1 1 0 110-2h1V3a1 1 0 011-1zm2 5v3h3V7H9zm0 5v3h3v-3H9z" />
            </svg>
          </div>

          {/* Stop Input */}
          <input
            type="text"
            ref={lastAddedStopId === stop.id ? lastInputRef : null}
            value={stop.name}
            onChange={(e) => {
              const newStops = [...stops];
              newStops[index].name = e.target.value;
              setStops(newStops);
            }}
            className="flex-1 bg-transparent border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 -mx-2 text-sm transition-all"
            placeholder="Enter location"
          />

          {/* Delete Button */}
          <button
            onClick={() => handleRemoveStop(stop.id)}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-red-50 group"
            title="Remove stop"
          >
            <svg 
              className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
      ))}

      {stops.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No stops added yet. Add stops to create your route.
        </div>
      )}
    </div>
  );

  // Collapsed state shows just the search box
  if (!isExpanded) {
    return (
      <div className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-50",
        "lg:left-24 lg:transform-none"
      )}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 bg-white rounded-lg shadow-lg text-left text-gray-500 hover:shadow-xl transition-shadow"
        >
          Search destinations
        </button>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className={cn(
        "fixed inset-0 bg-white z-50 flex flex-col",
        "lg:inset-auto lg:left-24 lg:top-4 lg:w-[400px] lg:rounded-lg lg:shadow-lg lg:bottom-20"
      )}>
        {/* Celebration Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary/80 to-primary px-6 py-8 text-white">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="text-5xl mb-2">🎉</div>
            <h1 className="text-2xl font-bold">Route Created!</h1>
            <p className="text-white/90">Let's make it memorable with some photos</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Route Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">{routeName || "Untitled Route"}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>From: {origin}</p>
                {stops.length > 0 && (
                  <p>{stops.length} stop{stops.length !== 1 ? 's' : ''}</p>
                )}
                <p>To: {destination}</p>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div>
              <h3 className="font-medium mb-3">Add Photos</h3>
              <div className="space-y-4">
                {/* Photo Grid */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img 
                          src={url} 
                          alt={`Upload preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-primary/30 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    onChange={handlePhotoSelect}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-600">Click to upload more photos</span>
                    <span className="text-sm text-gray-400">
                      Supports: JPG, PNG, HEIC
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Updated Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t p-4 space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              className="flex-1"
              variant="outline"
            >
              Share Route
            </Button>
            <Button
              onClick={finalizeJourney}
              className="flex-1"
            >
              {selectedPhotos.length > 0 ? 'Upload & Finish' : 'Finish'}
            </Button>
          </div>
          {selectedPhotos.length > 0 && (
            <p className="text-xs text-center text-gray-500">
              {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main route planning UI
  return (
    <div className={cn(
      "fixed inset-0 bg-white z-50 flex flex-col",
      "lg:inset-auto lg:left-24 lg:top-4 lg:w-[400px] lg:rounded-lg lg:shadow-lg lg:bottom-20",
      showMobilePreview ? "lg:h-[60vh]" : "lg:h-auto"
    )}>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => {
              setIsExpanded(false);
              setShowMobilePreview(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold flex-1">Plan Your Route</h1>
          <button
            onClick={handlePreview}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-primary"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600">Set points, add stops, and save your route.</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Route Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Route Name</label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="My Awesome Route"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Origin */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              </svg>
              <label className="text-sm font-medium">Origin</label>
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Search or click map for start point"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Waypoints List */}
          {renderWaypointsList()}

          {/* Add Stop Button */}
          {stops.length < 8 && (
            <button
              onClick={handleAddStop}
              className="flex items-center gap-2 text-primary hover:text-primary/80 w-full py-3 border-2 border-dashed border-gray-200 rounded-lg justify-center hover:border-primary/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              <span>Add Stop / Waypoint</span>
            </button>
          )}

          {/* Destination */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <label className="text-sm font-medium">Destination</label>
            </div>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Search or click map for end point"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
        <Button
          onClick={handlePreview}
          className="flex-1"
          variant="outline"
        >
          Preview
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
        >
          Save Route
        </Button>
      </div>
    </div>
  );
};

export default PlanModal;