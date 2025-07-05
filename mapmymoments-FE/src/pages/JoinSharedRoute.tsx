import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, Calendar, Share2, AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import { getSharedRoute, joinSharedRoute } from '@/lib/api';

interface RouteData {
  _id: string;
  name: string;
  origin: {
    name: string;
    address: string;
  };
  destination: {
    name: string;
    address: string;
  };
  intermediateWaypoints?: Array<{
    name: string;
    address: string;
  }>;
  photos?: Array<{
    filename: string;
    cloudfrontUrl: string;
  }>;
  createdAt: number;
  sharedWith?: Array<{
    email: string;
    permission: string;
    sharedAt: string;
  }>;
}

const JoinSharedRoute = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const accessToken = localStorage.getItem('access_token');
    setIsAuthenticated(!!accessToken);
    
    if (token) {
      fetchRouteByToken();
    }
  }, [token]);

  const fetchRouteByToken = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getSharedRoute(token);
      
      if (response.success && response.data) {
        setRoute(response.data);
      } else {
        throw new Error(response.error || 'Failed to load shared route');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoute = async () => {
    if (!token || !isAuthenticated) return;
    
    setIsJoining(true);
    
    try {
      const response = await joinSharedRoute(token);
      
      if (response.success) {
        toast.success('Successfully joined the shared route!');
        // Navigate to the route details page
        navigate(`/route/${route?._id}`);
      } else {
        throw new Error(response.error || 'Failed to join route');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join route');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLogin = () => {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    localStorage.setItem('pendingSharedRouteToken', token || '');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Share Link Invalid
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            You've been invited to join a route
          </CardTitle>
          <CardDescription>
            Join this shared route to upload photos and view the journey
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Route Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{route.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(route.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">From: {route.origin.name}</p>
                  <p className="text-xs text-muted-foreground">{route.origin.address}</p>
                </div>
              </div>
              
              {(route.intermediateWaypoints?.length || 0) > 0 && (
                <div className="ml-6 space-y-1">
                  {route.intermediateWaypoints?.map((waypoint, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                      <div>
                        <p className="font-medium text-sm">{waypoint.name}</p>
                        <p className="text-xs text-muted-foreground">{waypoint.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">To: {route.destination.name}</p>
                  <p className="text-xs text-muted-foreground">{route.destination.address}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{(route.sharedWith?.length || 0) + 1} member{(route.sharedWith?.length || 0) > 0 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{route.photos?.length || 0} photo{(route.photos?.length || 0) !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">
              As a shared member, you can:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• View the complete route and all photos</li>
              <li>• Upload your own photos to the route</li>
              <li>• See photos uploaded by other members</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              You cannot edit or delete the route itself.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isAuthenticated ? (
              <>
                <Button onClick={handleLogin} className="w-full" size="lg">
                  Login to Join Route
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You need to login or create an account to join this shared route
                </p>
              </>
            ) : (
              <Button 
                onClick={joinRoute} 
                disabled={isJoining}
                className="w-full" 
                size="lg"
              >
                {isJoining ? 'Joining...' : 'Join Shared Route'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinSharedRoute;