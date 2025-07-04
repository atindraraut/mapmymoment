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
  _id?: string; // For MongoDB compatibility
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
    const response = await apiFetch('/api/routes', {
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

/**
 * Get S3 signed upload URLs for a route
 * @param routeId - The route ID (directory)
 * @param filenames - Array of filenames (max 30)
 * @returns Array of { filename, url }
 */
export async function getS3UploadUrls(routeId: string, filenames: string[]): Promise<ApiResponse<{ filename: string; url: string }[]>> {
  if (!routeId || !filenames.length || filenames.length > 30) {
    return { success: false, error: 'Invalid routeId or filenames' };
  }
  const response = await apiFetch(`/api/routes/${routeId}/generate-upload-urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filenames }),
  });
  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || 'Failed to get upload URLs' };
  }
  return { success: true, data: data.urls };
}

/**
 * Delete a route by ID
 * 
 * @param routeId - The ID of the route to delete
 * @returns void
 */
export async function deleteRoute(routeId: string): Promise<void> {
  const response = await apiFetch(`/api/routes/${routeId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete route');
  }
}

// OAuth API Types
export interface GoogleOAuthUrlResponse {
  auth_url: string;
  state: string;
}

export interface GoogleOAuthCallbackRequest {
  code: string;
  state: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Get Google OAuth authorization URL
 * 
 * @returns Google OAuth URL and state
 */
export async function getGoogleOAuthUrl(): Promise<GoogleOAuthUrlResponse> {
  const response = await apiFetch('/user/oauth/google/url', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to get OAuth URL');
  }

  return response.json();
}

/**
 * Exchange OAuth authorization code for tokens
 * 
 * @param code - Authorization code from Google
 * @param state - State parameter for CSRF protection
 * @returns Access token, refresh token, and user info
 */
export async function exchangeOAuthCode(code: string, state: string): Promise<AuthTokenResponse> {
  const response = await apiFetch('/user/oauth/google/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to exchange OAuth code');
  }

  return response.json();
}

export interface UserAuthInfo {
  email: string;
  first_name: string;
  last_name: string;
  auth_type: string;
  has_password: boolean;
  has_google: boolean;
}

/**
 * Get user authentication information
 * 
 * @returns User auth info including linked accounts
 */
export async function getUserAuthInfo(): Promise<UserAuthInfo> {
  const response = await apiFetch('/user/auth-info', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to get user auth info');
  }

  return response.json();
}

/**
 * Unlink Google account from current user
 * 
 * @returns Success message
 */
export async function unlinkGoogleAccount(): Promise<{ message: string }> {
  const response = await apiFetch('/user/unlink-google', {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to unlink Google account');
  }

  return response.json();
}
