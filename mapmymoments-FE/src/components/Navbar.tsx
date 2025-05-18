
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed w-full bg-background/90 backdrop-blur-md z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-4">
        <a href="/" className="flex items-center space-x-2">
          <MapPin size={32} className="text-primary" />
          <span className="text-xl font-bold text-primary">MapMyMoments</span>
        </a>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-foreground/80 hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-foreground/80 hover:text-primary transition-colors">How it Works</a>
          <a href="#journeys" className="text-foreground/80 hover:text-primary transition-colors">Journeys</a>
          <a href="/login">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Log In</Button>
          </a>
          <Button className="bg-primary hover:bg-primary/90 text-white">Get Started</Button>
        </nav>
        
        <button 
          className="md:hidden flex items-center p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md shadow-md animate-fade-in">
          <div className="flex flex-col p-4 space-y-4">
            <a href="#features" className="text-foreground/80 hover:text-primary py-2 transition-colors">Features</a>
            <a href="#how-it-works" className="text-foreground/80 hover:text-primary py-2 transition-colors">How it Works</a>
            <a href="#journeys" className="text-foreground/80 hover:text-primary py-2 transition-colors">Journeys</a>
            <a href="/login">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full">Log In</Button>
            </a>
            <Button className="bg-primary hover:bg-primary/90 text-white w-full">Get Started</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
