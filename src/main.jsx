import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA functionality with auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New Service Worker version found, updating...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available, reload to activate
              console.log('✨ New version available! Reloading page...');

              // Tell the new service worker to skip waiting
              newWorker.postMessage({ type: 'SKIP_WAITING' });

              // Reload page after a short delay to ensure SW is ready
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });

    // Listen for controllerchange to reload page when new SW takes over
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller changed, reloading...');
      window.location.reload();
    });
  });
}
