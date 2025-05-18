
import React from 'react';
import { Route, MapPin, Camera, Share } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Route className="h-8 w-8 text-white" />,
      title: "Plan Your Route",
      description: "Map out your journey with custom routes and waypoints for your upcoming adventure."
    },
    {
      icon: <MapPin className="h-8 w-8 text-white" />,
      title: "Visit Places",
      description: "Explore destinations along your planned route or discover new spots spontaneously."
    },
    {
      icon: <Camera className="h-8 w-8 text-white" />,
      title: "Pin Memories",
      description: "Capture moments and pin photos directly to your route map with stories and details."
    },
    {
      icon: <Share className="h-8 w-8 text-white" />,
      title: "Share Journey",
      description: "Publish your route with pinned photos to inspire others and preserve your memories."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How MapMyMoments Works
          </h2>
          <p className="text-white/80 text-lg">
            Creating and sharing your travel stories has never been easier. Follow these simple steps to start your journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="bg-white/10 rounded-full p-6 mb-6 relative">
                {step.icon}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-white/30 transform -translate-y-1/2">
                    <div className="absolute right-0 w-2 h-2 rounded-full bg-white transform -translate-y-1/2"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-white/80">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
