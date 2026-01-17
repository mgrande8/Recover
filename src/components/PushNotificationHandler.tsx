'use client';

import { useEffect, useRef } from 'react';

// Capacitor Push Notifications types
interface PushNotificationToken {
  value: string;
}

interface PushNotificationReceived {
  id: string;
  title?: string;
  body?: string;
  data: Record<string, unknown>;
}

interface PushNotificationActionPerformed {
  notification: PushNotificationReceived;
  actionId: string;
}

// Check if we're running in Capacitor
function isCapacitor(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
}

// Get the platform
function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const capacitor = (window as any).Capacitor;
  if (capacitor?.getPlatform) {
    const platform = capacitor.getPlatform();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  }
  return 'web';
}

export function PushNotificationHandler() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initializePushNotifications();
  }, []);

  async function initializePushNotifications() {
    // Only run in Capacitor environment
    if (!isCapacitor()) {
      console.log('Not running in Capacitor, skipping push notification setup');
      return;
    }

    const platform = getPlatform();
    if (platform === 'web') {
      console.log('Running in web browser, skipping native push notification setup');
      return;
    }

    try {
      // Dynamically import Capacitor Push Notifications
      // This allows the app to work even if the plugin isn't installed
      const PushNotifications = await import('@capacitor/push-notifications')
        .then((m) => m.PushNotifications)
        .catch(() => null);

      if (!PushNotifications) {
        console.log(
          'Push Notifications plugin not installed. Run: npm install @capacitor/push-notifications'
        );
        return;
      }

      // Request permission
      let permission = await PushNotifications.checkPermissions();

      if (permission.receive === 'prompt') {
        permission = await PushNotifications.requestPermissions();
      }

      if (permission.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Register with the push notification service
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', async (token: PushNotificationToken) => {
        console.log('Push registration success, token:', token.value.substring(0, 20) + '...');
        await registerToken(token.value, platform);
      });

      // Listen for registration error
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
      });

      // Listen for push notifications received while app is in foreground
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationReceived) => {
          console.log('Push notification received:', notification);
          // You can show an in-app notification here if desired
        }
      );

      // Listen for push notification tapped
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: PushNotificationActionPerformed) => {
          console.log('Push notification action performed:', notification);
          // Handle navigation based on notification data
          handleNotificationTap(notification.notification);
        }
      );

      console.log('Push notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  async function registerToken(token: string, platform: 'ios' | 'android' | 'web') {
    try {
      const response = await fetch('/api/push/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform,
          deviceName: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to register push token:', error);
      } else {
        console.log('Push token registered successfully');
      }
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  function handleNotificationTap(notification: PushNotificationReceived) {
    // Navigate based on notification type
    const { data } = notification;

    if (data?.type === 'streak') {
      window.location.href = '/dashboard';
    } else if (data?.type === 'reminder') {
      window.location.href = '/dashboard/log';
    } else if (data?.type === 'weekly_summary') {
      window.location.href = '/dashboard/insights';
    } else if (data?.type === 'pro_upgrade') {
      window.location.href = '/dashboard/settings';
    } else {
      // Default: go to dashboard
      window.location.href = '/dashboard';
    }
  }

  // This component doesn't render anything
  return null;
}
