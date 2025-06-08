import React, { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  showDownloadButton?: boolean;
  downloadFileName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  onClick,
  showDownloadButton = false,
  downloadFileName
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  
  // Generate a tiny version of the image URL for blurry placeholder
  const getTinyImageUrl = (url: string): string => {
    // If it's a Cloudfront URL, we can add query parameters to request a smaller version
    if (url.includes('cloudfront.net')) {
      // Append a query parameter to get a small version (20% of original size)
      return `${url}?w=40&q=10`;
    }
    return url;
  };

  useEffect(() => {
    // Reset states when source changes
    setImageLoaded(false);
    setImageSrc('');
    
    // First load a tiny version
    const tinyImageUrl = getTinyImageUrl(src);
    const tinyImage = new Image();
    tinyImage.src = tinyImageUrl;
    tinyImage.onload = () => {
      setImageSrc(tinyImageUrl);
      
      // Then load the full quality image
      const fullImage = new Image();
      fullImage.src = src;
      fullImage.onload = () => {
        setImageSrc(src);
        setImageLoaded(true);
      };
    };
    
    // Cleanup
    return () => {
      tinyImage.onload = null;
    };
  }, [src]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick of parent
    
    try {
      // For more reliable downloads, especially for cross-origin images,
      // fetch the image first and then create a blob URL
      const response = await fetch(src, { mode: 'cors' });
      
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        return;
      }
      
      // Get the blob data
      const imageBlob = await response.blob();
      
      // Create a blob URL
      const blobUrl = URL.createObjectURL(imageBlob);
      
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFileName || alt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Image download error:', error);
      
      // Fallback to direct download if the fetch method fails
      const link = document.createElement('a');
      link.href = src;
      link.download = downloadFileName || alt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className} group`}>
      {/* Placeholder or low quality image */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Image with transition */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`
            w-full h-full object-cover transition-all duration-500 ease-in-out
            ${imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-70 blur-sm scale-105'}
          `}
          onClick={onClick}
          loading="lazy"
          decoding="async"
          onLoad={() => {
            // Once the full image is loaded, remove blur and scale effects
            if (imageSrc === src) {
              setImageLoaded(true);
            }
          }}
        />
      )}

      {/* Download Button - Only shows on hover and when image is loaded */}
      {showDownloadButton && imageLoaded && (
        <button
          onClick={handleDownload}
          className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
          title="Download image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default LazyImage;
