'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PushNotificationHandler() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Wait for Capacitor bridge to be ready
    const waitForCapacitor = () => {
      return new Promise<void>((resolve) => {
        const checkCapacitor = () => {
          const cap = (window as any).Capacitor;
          if (cap && typeof cap.getPlatform === 'function') {
            resolve();
          } else {
            setTimeout(checkCapacitor, 100);
          }
        };
        checkCapacitor();
      });
    };

    const initPushNotifications = async () => {
      // Wait up to 3 seconds for Capacitor
      const timeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Capacitor timeout')), 3000)
      );

      try {
        await Promise.race([waitForCapacitor(), timeout]);
      } catch {
        console.log('[Push] Capacitor not available, skipping push setup');
        return;
      }

      const cap = (window as any).Capacitor;
      const platform = cap.getPlatform();
      const isNative = cap.isNativePlatform();

      console.log('[Push] Platform:', platform);
      console.log('[Push] Is native:', isNative);

      if (platform !== 'ios' && platform !== 'android') {
        console.log('[Push] Not a native platform, skipping push setup');
        return;
      }

      try {
        // Dynamically import Capacitor push notifications
        const { PushNotifications } = await import('@capacitor/push-notifications');
        console.log('[Push] PushNotifications plugin loaded');

        // Check current permission status
        const permStatus = await PushNotifications.checkPermissions();
        console.log('[Push] Current permission status:', permStatus.receive);

        if (permStatus.receive === 'prompt') {
          console.log('[Push] Requesting permissions...');
          const requestResult = await PushNotifications.requestPermissions();
          console.log('[Push] Permission result:', requestResult.receive);

          if (requestResult.receive !== 'granted') {
            console.log('[Push] Permission denied by user');
            return;
          }
        } else if (permStatus.receive !== 'granted') {
          console.log('[Push] Permissions not granted:', permStatus.receive);
          return;
        }

        // Set up listeners BEFORE registering
        await PushNotifications.addListener('registration', async (token) => {
          console.log('[Push] ✓ Registration successful!');
          console.log('[Push] Token:', token.value.substring(0, 20) + '...');
          await saveTokenToDatabase(token.value, platform);
        });

        await PushNotifications.addListener('registrationError', (error) => {
          console.error('[Push] ✗ Registration error:', error.error);
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Notification received:', notification.title);
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Push] Notification tapped');
          const data = action.notification.data;
          if (data?.route) {
            window.location.href = data.route;
          }
        });

        // Now register with APNs
        console.log('[Push] Registering with APNs...');
        await PushNotifications.register();
        console.log('[Push] Registration request sent');

      } catch (error) {
        console.error('[Push] Error:', error);
      }
    };

    // Small delay to let the page settle
    setTimeout(initPushNotifications, 500);
  }, []);

  return null;
}

async function saveTokenToDatabase(token: string, platform: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[Push] No user logged in, will save token after login');
      // Store token for later
      localStorage.setItem('pendingPushToken', JSON.stringify({ token, platform }));
      return;
    }

    console.log('[Push] Saving token for user:', user.id);

    const response = await fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    });

    if (response.ok) {
      console.log('[Push] ✓ Token saved to database');
      localStorage.removeItem('pendingPushToken');
    } else {
      const error = await response.json();
      console.error('[Push] ✗ Failed to save token:', error);
    }
  } catch (error) {
    console.error('[Push] Error saving token:', error);
  }
}
