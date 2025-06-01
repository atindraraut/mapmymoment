import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Marker, useMap } from '@vis.gl/react-google-maps';
import { RootState } from '@/store';
import { setRouteInfo } from '@/store/routeSlice';
import MarkerTooltip from './MarkerTooltip';

const RouteDisplay: React.FC = () => {
  const map = useMap();
  const dispatch = useDispatch();
  const { origin, destination, stops } = useSelector((state: RootState) => state.route);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;

    // Initialize directions renderer
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // We'll use custom markers
      polylineOptions: {
        strokeColor: '#2563eb',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        geodesic: true,
      },
    });
    renderer.setMap(map);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (!directionsRenderer || !origin || !destination) return;

    const directionsService = new google.maps.DirectionsService();

    // Prepare waypoints from stops
    const waypoints = stops.map(stop => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    // Request directions
    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // Keep the order of stops as specified
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          
          // Calculate total distance and duration
          const route = result.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;
          
          route.legs.forEach(leg => {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;
          });
          
          setRouteInfo({
            distance: (totalDistance / 1000).toFixed(1) + ' km',
            duration: Math.round(totalDuration / 60) + ' min'
          });
          
          // Dispatch to Redux
          dispatch(setRouteInfo({
            distance: (totalDistance / 1000).toFixed(1) + ' km',
            duration: Math.round(totalDuration / 60) + ' min'
          }));
        } else {
          console.error('Directions request failed due to ' + status);
          setRouteInfo(null);
          dispatch(setRouteInfo(null));
        }
      }
    );
  }, [directionsRenderer, origin, destination, stops]);

  // Render custom markers with enhanced info windows
  return (
    <>
      {/* Origin marker */}
      {origin && (
        <Marker
          position={{ lat: origin.lat, lng: origin.lng }}
          title={`🚩 START: ${origin.name}`}
          icon={{
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 0C13.272 0 6 7.272 6 16c0 12 16 38 16 38s16-26 16-38c0-8.728-7.272-16-16-16z" fill="#22c55e" stroke="#ffffff" stroke-width="3"/>
                <circle cx="22" cy="16" r="10" fill="white"/>
                <text x="22" y="12" text-anchor="middle" fill="#22c55e" font-family="Arial" font-size="9" font-weight="bold">🚩</text>
                <text x="22" y="22" text-anchor="middle" fill="#22c55e" font-family="Arial" font-size="7" font-weight="bold">START</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(44, 54),
            anchor: new google.maps.Point(22, 54),
          }}
          onClick={() => {
            const infoWindow = new google.maps.InfoWindow({
              content: MarkerTooltip({
                type: 'origin',
                name: origin.name,
                address: origin.address
              })
            });
            infoWindow.open(map, { target: { lat: origin.lat, lng: origin.lng } } as any);
          }}
        />
      )}

      {/* Stop markers */}
      {stops.map((stop, index) => (
        <Marker
          key={stop.id}
          position={{ lat: stop.lat, lng: stop.lng }}
          title={`📍 STOP ${index + 1}: ${stop.name}`}
          icon={{
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0C11.8 0 5 6.8 5 15c0 11 15 35 15 35s15-24 15-35c0-8.2-6.8-15-15-15z" fill="#f59e0b" stroke="#ffffff" stroke-width="3"/>
                <circle cx="20" cy="15" r="11" fill="white"/>
                <circle cx="20" cy="15" r="8" fill="#f59e0b"/>
                <text x="20" y="19" text-anchor="middle" fill="white" font-family="Arial" font-size="11" font-weight="bold">${index + 1}</text>
                <text x="20" y="8" text-anchor="middle" fill="#f59e0b" font-family="Arial" font-size="6" font-weight="bold">STOP</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 50),
            anchor: new google.maps.Point(20, 50),
          }}
          onClick={() => {
            const infoWindow = new google.maps.InfoWindow({
              content: MarkerTooltip({
                type: 'stop',
                name: stop.name,
                index: index + 1
              })
            });
            infoWindow.open(map, { target: { lat: stop.lat, lng: stop.lng } } as any);
          }}
        />
      ))}

      {/* Destination marker */}
      {destination && (
        <Marker
          position={{ lat: destination.lat, lng: destination.lng }}
          title={`🏁 END: ${destination.name}`}
          icon={{
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 0C13.272 0 6 7.272 6 16c0 12 16 38 16 38s16-26 16-38c0-8.728-7.272-16-16-16z" fill="#dc2626" stroke="#ffffff" stroke-width="3"/>
                <circle cx="22" cy="16" r="10" fill="white"/>
                <text x="22" y="12" text-anchor="middle" fill="#dc2626" font-family="Arial" font-size="9" font-weight="bold">🏁</text>
                <text x="22" y="22" text-anchor="middle" fill="#dc2626" font-family="Arial" font-size="7" font-weight="bold">END</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(44, 54),
            anchor: new google.maps.Point(22, 54),
          }}
          onClick={() => {
            const infoWindow = new google.maps.InfoWindow({
              content: MarkerTooltip({
                type: 'destination',
                name: destination.name,
                address: destination.address
              })
            });
            infoWindow.open(map, { target: { lat: destination.lat, lng: destination.lng } } as any);
          }}
        />
      )}
    </>
  );
};

export default RouteDisplay;
