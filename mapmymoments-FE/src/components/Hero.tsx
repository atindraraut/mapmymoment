
import React from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-cover bg-center" 
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1500673922987-e212871fec22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")' }}>
      <div className="absolute inset-0 hero-gradient"></div>

      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <MapPin size={32} className="text-white mr-2" />
            <h2 className="text-lg md:text-xl font-medium text-white bg-primary/80 px-3 py-1 rounded-full">
              The Travel Storytelling Platform
            </h2>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            Pin Your Journey, <br />
            <span className="text-secondary">Share Your Adventure</span>
          </h1>
          
          <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl animate-fade-up" style={{ animationDelay: "0.5s" }}>
            Create interactive travel routes, document your journey with pinned photos, and inspire others with your authentic adventures.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "0.7s" }}>
            <Button className="bg-secondary hover:bg-secondary/90 text-foreground px-8 py-6 text-lg">
              Get Started
            </Button>
            {/* <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
              Explore Journeys
            </Button> */}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <a href="#features" className="animate-bounce text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;
