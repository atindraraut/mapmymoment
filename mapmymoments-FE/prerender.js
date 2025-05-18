
const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

// List of routes to prerender
const routes = ['/', '/features', '/how-it-works', '/journeys'];

async function prerender() {
  console.log('Starting prerendering process...');
  
  try {
    // Create dist directory if it doesn't exist
    await fs.mkdir('dist', { recursive: true });
    
    // Load the index.html template
    const template = await fs.readFile(path.resolve(__dirname, 'dist', 'index.html'), 'utf8');
    
    // Prerender each route
    for (const route of routes) {
      console.log(`Prerendering route: ${route}`);
      
      // Create a DOM from the template
      const dom = new JSDOM(template);
      
      // Inject route-specific metadata
      const routeName = route === '/' ? 'Home' : route.substring(1).charAt(0).toUpperCase() + route.substring(1).slice(1);
      dom.window.document.title = `${routeName} | MapMyMoments - Pin Your Journey, Share Your Adventure`;
      
      // Update meta tags for SEO
      const metaDescription = dom.window.document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `MapMyMoments ${routeName} - The ultimate travel platform for documenting and sharing your adventures.`);
      }
      
      // Write the prerendered HTML to a file
      const routePath = route === '/' ? 'index.html' : `${route.substring(1)}/index.html`;
      const outputPath = path.resolve(__dirname, 'dist', routePath);
      
      // Create directory for the route if needed
      if (route !== '/') {
        await fs.mkdir(path.resolve(__dirname, 'dist', route.substring(1)), { recursive: true });
      }
      
      // Write the file
      await fs.writeFile(outputPath, dom.serialize());
      console.log(`Route ${route} prerendered successfully.`);
    }
    
    console.log('Prerendering complete!');
  } catch (error) {
    console.error('Error during prerendering:', error);
    process.exit(1);
  }
}

prerender();
