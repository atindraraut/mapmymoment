
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
      setIsVisible(false);
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4 animate-fade-in">
      <div className="bg-primary text-white p-3 rounded-lg shadow-lg flex items-center justify-between max-w-sm w-full">
        <div className="mr-3">
          <p className="font-medium">Install MapMyMoments</p>
          <p className="text-xs text-white/80">Add to your home screen</p>
        </div>
        <Button 
          onClick={handleInstallClick} 
          className="bg-white text-primary hover:bg-white/90 text-sm"
          size="sm"
        >
          Install
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
