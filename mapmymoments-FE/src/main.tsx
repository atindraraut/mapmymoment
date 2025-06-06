
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register } from './registerServiceWorker'

// Register the service worker
register();

createRoot(document.getElementById("root")!).render(<App />);
