
import React from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

const DownloadSection = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-primary to-accent text-white relative overflow-hidden">
      <div className="absolute inset-0 map-pattern opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <div className="max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-white/90 text-lg mb-8">
                Download the WanderPin app today and begin mapping your adventures, pinning your memories, and sharing your stories with the world.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-secondary hover:bg-secondary/90 text-foreground px-8 py-6">
                  <span className="mr-2">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M17.05 20.28a14.1 14.1 0 01-1.93 1.4c-.48.27-.96.5-1.47.7-.58.22-1.18.33-1.8.33-.62 0-1.21-.11-1.77-.33a5.53 5.53 0 01-1.47-.7 13.77 13.77 0 01-1.92-1.4 16.33 16.33 0 01-1.85-1.86C3.39 16.55 2 14.05 2 11.54c0-1.16.23-2.2.7-3.12.47-.92 1.13-1.66 2-2.23a5.19 5.19 0 013.05-.85c.59 0 1.17.12 1.73.36.34.15.7.38 1.1.7.1.07.28.22.56.43a5.8 5.8 0 00.58.42c.2.12.38.22.54.3.16.08.32.12.5.12.17 0 .33-.04.5-.12.15-.08.34-.18.53-.3.2-.13.38-.27.59-.42.28-.21.47-.36.55-.43.4-.32.76-.55 1.1-.7.56-.24 1.14-.36 1.74-.36 1.13 0 2.16.28 3.05.85.88.57 1.55 1.31 2 2.23.48.91.72 1.96.72 3.12 0 2.51-1.39 5-4.16 7.5-.63.55-1.25 1.1-1.9 1.67z"/>
                    </svg>
                  </span>
                  App Store
                </Button>
                <Button className="bg-secondary hover:bg-secondary/90 text-foreground px-8 py-6">
                  <span className="mr-2">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M5.27 2.67l9.05 5.15c.8.47.8 1.63 0 2.1l-9.05 5.15c-.8.47-1.8-.12-1.8-1.05V3.73c0-.93 1-1.53 1.8-1.06zm9.5 6.8l4.89 2.78c.8.47.8 1.63 0 2.1l-4.89 2.78c-.8.47-1.8-.12-1.8-1.05v-5.57c0-.93 1-1.53 1.8-1.05z"/>
                    </svg>
                  </span>
                  Play Store
                </Button>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 shadow-2xl rotate-3 transform">
                <img 
                  src="https://images.unsplash.com/photo-1426604966848-d7adac402bff?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80" 
                  alt="WanderPin App Screenshot"
                  className="rounded-2xl w-full h-full object-cover"
                />
                <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="pin-marker">
                    <MapPin size={38} className="text-secondary" />
                  </div>
                </div>
                <div className="absolute top-1/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="pin-marker" style={{ animationDelay: "0.3s" }}>
                    <MapPin size={38} className="text-secondary" />
                  </div>
                </div>
                <div className="absolute bottom-1/3 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="pin-marker" style={{ animationDelay: "0.6s" }}>
                    <MapPin size={38} className="text-secondary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
