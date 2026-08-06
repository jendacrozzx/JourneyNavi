import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// 1. Import Leaflet CSS first
import 'leaflet/dist/leaflet.css';

// 2. Import global CSS
import './index.css';

// 3. Import Root App Controller
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);