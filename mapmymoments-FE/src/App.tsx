import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Application from "./pages/Application";
import { APIProvider } from '@vis.gl/react-google-maps';

const queryClient = new QueryClient();

const App = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
