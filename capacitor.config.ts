import type { CapacitorConfig } from '@capacitor/cli';

// Production URL - update this to your Vercel deployment URL
const PRODUCTION_URL = process.env.CAPACITOR_SERVER_URL || 'https://recover-app.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.recover.app',
  appName: 'Recover',
  webDir: 'out',
  server: {
    // For production, point to the live server
    // This allows all server features (API routes, auth, etc.) to work
    url: PRODUCTION_URL,

    // For development with local server:
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  ios: {
    // iOS specific configurations
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0E1A',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A0E1A',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
