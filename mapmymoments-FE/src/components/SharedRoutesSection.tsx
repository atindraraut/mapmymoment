import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Share2, Users, Eye } from 'lucide-react';
import { getSharedRoutesForUser, RouteData } from '@/lib/api';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

interface SharedRouteData extends RouteData {
  _id: string;
  createdAt: number;
  sharedWith?: Array<{
    email: string;
    permission: string;
    sharedAt: string;
  }>;
}

const SharedRoutesSection = () => {
  const [sharedRoutes, setSharedRoutes] = useState<SharedRouteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSharedRoutes();
  }, []);

  const fetchSharedRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await getSharedRoutesForUser();
      if (response.success && response.data) {
        setSharedRoutes(response.data as SharedRouteData[]);
      } else {
        toast.error(response.error || 'Failed to load shared routes');
      }
    } catch (error) {
      toast.error('Failed to load shared routes');
      console.error('Error fetching shared routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRoute = (routeId: string) => {
    navigate(`/route/${routeId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Shared Routes
          </CardTitle>
          <CardDescription>
            Routes that have been shared with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Shared Routes
        </CardTitle>
        <CardDescription>
          Routes that have been shared with you ({sharedRoutes.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sharedRoutes.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shared routes</h3>
            <p className="text-gray-500 text-sm">
              When someone shares a route with you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedRoutes.map((route) => (
              <div
                key={route._id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {route.name}
                    </h4>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="truncate">{route.origin.name}</span>
                        <span>→</span>
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="truncate">{route.destination.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(route.createdAt).toLocaleDateString()}</span>
                        </div>
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
                    
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Shared Route
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <Button
                      onClick={() => handleViewRoute(route._id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedRoutesSection;