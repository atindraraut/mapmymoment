
const { execSync } = require('child_process');

// Run the standard build
console.log('Building the application...');
execSync('vite build', { stdio: 'inherit' });

// Run the prerender script
console.log('Prerendering routes...');
execSync('node prerender.js', { stdio: 'inherit' });

console.log('Static site generation complete!');
