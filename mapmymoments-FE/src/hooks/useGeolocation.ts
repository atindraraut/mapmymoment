import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationResult {
  location: { lat: number; lng: number };
  error: string | null;
  loading: boolean;
  isUserLocation: boolean;
}

const BENGALURU_FALLBACK = { lat: 12.9716, lng: 77.5946 };

// Function to reduce location precision to city level only
const reduceLocationPrecision = (lat: number, lng: number): { lat: number; lng: number } => {
  // City-level precision: ~50-100km radius
  // 1 degree latitude ≈ 111km, so 0.5 degrees ≈ 55km
  // We'll use 0.3 degrees for ~30-35km radius variation (city-level)
  const precision = 0.3;
  
  // Round to nearest precision and add small random offset
  const roundedLat = Math.round(lat / precision) * precision;
  const roundedLng = Math.round(lng / precision) * precision;
  
  // Add small random offset within the precision range for privacy
  const randomOffsetLat = (Math.random() - 0.5) * precision * 0.5; // Half the precision for offset
  const randomOffsetLng = (Math.random() - 0.5) * precision * 0.5;
  
  return {
    lat: roundedLat + randomOffsetLat,
    lng: roundedLng + randomOffsetLng
  };
};

// IP-based location detection only
const getLocationFromIP = async (): Promise<{ lat: number; lng: number } | null> => {
  try {
    console.log('Getting location from IP address...');
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      console.log('IP location success (precise):', { lat: data.latitude, lng: data.longitude });
      
      // Reduce precision for privacy
      const impreciseLocation = reduceLocationPrecision(data.latitude, data.longitude);
      console.log('IP location (reduced precision):', impreciseLocation);
      
      return impreciseLocation;
    }
    
    console.log('IP location failed - no coordinates');
    return null;
  } catch (error) {
    console.log('IP location error:', error);
    return null;
  }
};

export const useGeolocation = (): GeolocationResult => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const detectLocation = async () => {
      // Use IP-based location only - faster and no permissions needed
      console.log('Detecting location via IP address...');
      const ipLocation = await getLocationFromIP();
      
      if (ipLocation) {
        setState({
          latitude: ipLocation.lat,
          longitude: ipLocation.lng,
          error: null,
          loading: false,
        });
      } else {
        // Fallback to Bengaluru if IP location fails
        console.log('IP location failed, using Bengaluru fallback');
        setState({
          latitude: null,
          longitude: null,
          error: 'Unable to detect location via IP',
          loading: false,
        });
      }
    };

    detectLocation();
  }, []);

  const hasValidLocation = state.latitude !== null && state.longitude !== null;
  
  const result = {
    location: hasValidLocation 
      ? { lat: state.latitude!, lng: state.longitude! }
      : BENGALURU_FALLBACK,
    error: state.error,
    loading: state.loading,
    isUserLocation: hasValidLocation,
  };
  
  return result;
};