
import React from 'react';
import { MapPin, Camera, Compass, Users, Route } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Route className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
      title: "Interactive Route Creation",
      description: "Plan your trips using an interactive map. Define routes with waypoints, customize paths, and add descriptive notes for your journey."
    },
    {
      icon: <MapPin className="h-8 w-8 md:h-10 md:w-10 text-secondary" />,
      title: "Photo Pinning",
      description: "Upload and pin photos to specific locations on your route. Add captions and stories to create a rich multimedia travelogue."
    },
    {
      icon: <Compass className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
      title: "Journey Discovery",
      description: "Explore routes created by others and filter by location, travel type, or popularity to find inspiration for your next adventure."
    },
    {
      icon: <Users className="h-8 w-8 md:h-10 md:w-10 text-secondary" />,
      title: "Travel Community",
      description: "Share your journeys, follow other travelers, and engage with a community of passionate adventurers and storytellers."
    },
    {
      icon: <Camera className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
      title: "Visual Storytelling",
      description: "Create visually engaging travel stories that combine your route, photos, and personal narratives in one seamless experience."
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-accent/10 relative overflow-hidden">
      <div className="absolute inset-0 map-pattern opacity-70"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-4">
            Your Complete Travel Companion
          </h2>
          <p className="text-foreground/80 text-base md:text-lg">
            MapMyMoments combines mapping, journaling, and sharing in one seamless platform designed for modern travelers.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card rounded-lg p-5 md:p-6 flex flex-col items-start"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="mb-3 md:mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-foreground">{feature.title}</h3>
              <p className="text-sm md:text-base text-foreground/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
