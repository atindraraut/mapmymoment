import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Render the App component directly
createRoot(document.getElementById("root")!).render(
  <App />
);
