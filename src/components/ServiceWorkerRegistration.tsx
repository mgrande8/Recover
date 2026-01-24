'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Wait a bit for Capacitor to initialize, then check platform
    const timer = setTimeout(() => {
      // Check if Capacitor native bridge is available
      const isNative = typeof window !== 'undefined' &&
        (window as any).Capacitor?.isNativePlatform?.() === true;

      if (isNative) {
        console.log('[SW] Native platform detected, skipping Service Worker');
        return;
      }

      // Only register on web in production
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SW] Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            // Silently fail - not critical for the app
            console.log('[SW] Service Worker not available');
          });
      }
    }, 1000); // Wait 1 second for Capacitor to initialize

    return () => clearTimeout(timer);
  }, []);

  return null;
}
