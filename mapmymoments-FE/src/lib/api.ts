// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
}

export interface RouteData {
  id?: string;
  name: string;
  origin: Waypoint;
  destination: Waypoint;
  intermediateWaypoints: Waypoint[];
  photos?: Photo[];
  createdAt?: number;
  updatedAt?: number;
}

export interface Photo {
  id?: string;
  url?: string;
  location?: {
    lat: number;
    lng: number;
  };
  description?: string;
  file?: File;
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}, tryRefresh = true): Promise<Response> {
  let url = typeof input === 'string' && !input.startsWith('http') ? `${API_BASE_URL}${input}` : input;
  let access_token = localStorage.getItem('access_token');
  const headers = new Headers(init.headers || {});
  if (access_token) {
    headers.set('Authorization', `Bearer ${access_token}`);
  }
  let res = await fetch(url, { ...init, headers });
  if (res.status === 401 && tryRefresh) {
    // Try to refresh token
    const refresh_token = localStorage.getItem('refresh_token');
    if (refresh_token) {
      const refreshRes = await fetch(`${API_BASE_URL}/user/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token })
      });
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.access_token) {
        localStorage.setItem('access_token', refreshData.access_token);
        localStorage.setItem('refresh_token', refreshData.refresh_token);
        // Retry original request with new token
        headers.set('Authorization', `Bearer ${refreshData.access_token}`);
        res = await fetch(url, { ...init, headers });
      } else {
        // Refresh failed, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }
  return res;
}

/**
 * Save a new route to the backend
 * 
 * @param routeData - The route data to save
 * @returns An object containing success status, route ID and any error messages
 */
export async function saveRoute(routeData: RouteData): Promise<ApiResponse<{ id: string }>> {
  try {
    console.log('Saving route:', routeData);
    
    const response = await apiFetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: routeData.name,
        origin: routeData.origin,
        destination: routeData.destination,
        intermediateWaypoints: routeData.intermediateWaypoints,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Route save failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to save route',
      };
    }

    return {
      success: true,
      data: { id: data.id },
      message: 'Route saved successfully',
    };
  } catch (error) {
    console.error('Error saving route:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a list of routes from the backend
 * 
 * @returns An array of routes
 */
export async function getRoutes(): Promise<ApiResponse<RouteData[]>> {
  try {
    const response = await apiFetch('/api/my-routes', {
      method: 'GET',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to fetch routes',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching routes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a specific route by ID
 * 
 * @param id - The ID of the route to fetch
 * @returns The route data
 */
export async function getRouteById(id: string): Promise<ApiResponse<RouteData>> {
  try {
    const response = await apiFetch(`/api/routes/${id}`, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to fetch route',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(`Error fetching route ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload photos for a route
 * 
 * @param routeId - The ID of the route to add photos to
 * @param photos - Array of photo files to upload
 * @returns API response with upload status
 */
export async function uploadRoutePhotos(routeId: string, photos: File[]): Promise<ApiResponse> {
  try {
    if (!photos.length) {
      return { 
        success: true,
        message: 'No photos to upload' 
      };
    }

    // Create form data to upload photos
    const formData = new FormData();
    formData.append('routeId', routeId);
    
    // Append each photo to the form data
    photos.forEach((photo, index) => {
      formData.append(`photos[${index}]`, photo);
    });

    const response = await apiFetch(`/api/routes/${routeId}/photos`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - the browser will set it with the boundary
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Photo upload failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to upload photos',
      };
    }

    return {
      success: true,
      data: data,
      message: 'Photos uploaded successfully',
    };
  } catch (error) {
    console.error('Error uploading photos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during upload',
    };
  }
}
