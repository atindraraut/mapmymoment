import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Application from "./pages/Application";
import { APIProvider } from '@vis.gl/react-google-maps';
import MapLoader from '@/components/MapLoader';
import RouteDetails from "./pages/RouteDetails";
import RequestReset from './pages/RequestReset';
import ResetPassword from './pages/ResetPassword';
import { OAuthCallback } from './pages/OAuthCallback';
import JoinSharedRoute from './pages/JoinSharedRoute';

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800); // Show splash for 1.8s
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <MapLoader />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <APIProvider apiKey={apiKey} libraries={['marker', 'routes', 'places']}>

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/app" element={<Application />} />
              <Route path="/route/:id" element={<Suspense fallback={<MapLoader />}><RouteDetails /></Suspense>} />
              <Route path="/request-reset" element={<RequestReset />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/shared-routes/:token" element={<Suspense fallback={<MapLoader />}><JoinSharedRoute /></Suspense>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </APIProvider>

        </BrowserRouter>
        <PWAInstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  )
};

export default App;
