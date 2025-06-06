// Script to adjust the viewport for mobile devices
document.addEventListener('DOMContentLoaded', function() {
  // Function to handle viewport adjustments for notched devices
  function adjustViewportForNotch() {
    // Check if the device has a notch (iOS safe area)
    const hasNotch = CSS.supports('padding-top: env(safe-area-inset-top)');
    
    if (hasNotch) {
      // Add the viewport-fit=cover parameter to the viewport meta tag
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }
      
      if (!viewportMeta.content.includes('viewport-fit=cover')) {
        viewportMeta.content = viewportMeta.content + ', viewport-fit=cover';
      }
      
      // Apply CSS fixes for notched elements
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --safe-area-inset-top: env(safe-area-inset-top, 0px);
          --safe-area-inset-right: env(safe-area-inset-right, 0px);
          --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
          --safe-area-inset-left: env(safe-area-inset-left, 0px);
        }
        
        body {
          padding-top: var(--safe-area-inset-top);
          padding-right: var(--safe-area-inset-right);
          padding-bottom: var(--safe-area-inset-bottom);
          padding-left: var(--safe-area-inset-left);
        }
        
        .fixed-top {
          top: var(--safe-area-inset-top) !important;
        }
        
        .fixed-bottom {
          bottom: var(--safe-area-inset-bottom) !important;
        }

        /* Fix for buttons at the top */
        .top-4.left-4 {
          top: calc(1rem + var(--safe-area-inset-top)) !important;
          left: calc(1rem + var(--safe-area-inset-left)) !important;
        }
        
        .top-4.right-4 {
          top: calc(1rem + var(--safe-area-inset-top)) !important;
          right: calc(1rem + var(--safe-area-inset-right)) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Apply the viewport adjustments
  adjustViewportForNotch();
});
