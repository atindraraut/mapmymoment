
import React from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const Journeys = () => {
  const journeys = [
    {
      title: "Pacific Coast Highway",
      author: "Sarah Johnson",
      location: "California, USA",
      image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
      pins: 24
    },
    {
      title: "Alps Adventure",
      author: "Mark Williams",
      location: "Switzerland",
      image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
      pins: 36
    },
    {
      title: "Japanese Temples",
      author: "Emma Chen",
      location: "Kyoto, Japan",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
      pins: 18
    }
  ];

  return (
    <section id="journeys" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Discover Popular Journeys
          </h2>
          <p className="text-foreground/80 text-lg">
            Explore routes created by our community and find inspiration for your next adventure.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {journeys.map((journey, index) => (
            <div key={index} className="journey-card rounded-lg overflow-hidden shadow-lg">
              <div className="relative h-64">
                <img 
                  src={journey.image} 
                  alt={journey.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{journey.title}</h3>
                  <div className="flex items-center text-white/90">
                    <span>{journey.location}</span>
                    <span className="mx-2">•</span>
                    <span>By {journey.author}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin size={18} className="text-secondary mr-1" />
                    <span className="text-foreground/80">{journey.pins} pinned photos</span>
                  </div>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                    View Journey
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button className="bg-primary hover:bg-primary/90 text-white px-8">
            Explore All Journeys
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Journeys;
