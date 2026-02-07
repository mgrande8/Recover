import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ApnsClient, Notification, Errors } from 'apns2';

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_name: string | null;
  last_used_at: string;
  created_at: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Register a device token for push notifications
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android' | 'web',
  deviceName?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Upsert the token (update if exists, insert if not)
  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      device_name: deviceName,
      last_used_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,token',
    }
  );

  if (error) {
    console.error('Failed to register device token:', error);
    throw error;
  }
}

// Remove a device token
export async function removeDeviceToken(userId: string, token: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);

  if (error) {
    console.error('Failed to remove device token:', error);
    throw error;
  }
}

// Get all device tokens for a user
export async function getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('device_tokens')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to get device tokens:', error);
    throw error;
  }

  return data || [];
}

// Send push notification to a specific user
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  // Get user's device tokens
  const tokens = await getUserDeviceTokens(userId);

  if (tokens.length === 0) {
    console.log('No device tokens found for user:', userId);
    return { success: true, sent: 0, failed: 0 };
  }

  // Check if user has push notifications enabled
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_notifications_enabled')
    .eq('id', userId)
    .single();

  if (profile?.push_notifications_enabled === false) {
    console.log('Push notifications disabled for user:', userId);
    return { success: true, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Send to each device
  for (const deviceToken of tokens) {
    try {
      const success = await sendToDevice(deviceToken, payload);
      if (success) {
        sent++;
        // Update last_used_at
        await supabase
          .from('device_tokens')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', deviceToken.id);
      } else {
        failed++;
        // Remove invalid token
        await supabase.from('device_tokens').delete().eq('id', deviceToken.id);
      }
    } catch (err) {
      console.error('Failed to send push notification:', err);
      failed++;
    }
  }

  return { success: true, sent, failed };
}

// Send notification to a specific device using APNs (iOS) or FCM (Android)
async function sendToDevice(
  deviceToken: DeviceToken,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (deviceToken.platform === 'ios') {
    return sendAPNs(deviceToken.token, payload);
  } else if (deviceToken.platform === 'android') {
    return sendFCM(deviceToken.token, payload);
  } else if (deviceToken.platform === 'web') {
    // Web push would require VAPID keys - skip for now
    console.log('Web push not implemented');
    return true;
  }
  return false;
}

// Debug info for troubleshooting - stored in module scope
let lastApnsDebug: Record<string, unknown> = {};

export function getLastApnsDebug() {
  return lastApnsDebug;
}

// Cached APNs client (reuse connection)
let apnsClient: ApnsClient | null = null;

function getApnsClient(): ApnsClient | null {
  if (apnsClient) return apnsClient;

  const teamId = process.env.APNS_TEAM_ID || process.env.APPLE_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID || process.env.APPLE_KEY_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY || process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APNS_BUNDLE_ID || process.env.APPLE_BUNDLE_ID || 'com.mgrande8.recover';

  if (!teamId || !keyId || !privateKey) {
    return null;
  }

  // Format the private key properly
  const pemKey = privateKey.includes('-----BEGIN')
    ? privateKey
    : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;

  // APNs environment
  const apnsEnv = process.env.APNS_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');
  const host = apnsEnv === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';

  apnsClient = new ApnsClient({
    team: teamId,
    keyId: keyId,
    signingKey: pemKey,
    defaultTopic: bundleId,
    host: host,
  });

  return apnsClient;
}

// Send iOS push notification via APNs (using HTTP/2)
async function sendAPNs(token: string, payload: PushNotificationPayload): Promise<boolean> {
  const teamId = process.env.APNS_TEAM_ID || process.env.APPLE_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID || process.env.APPLE_KEY_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY || process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APNS_BUNDLE_ID || process.env.APPLE_BUNDLE_ID || 'com.mgrande8.recover';
  const apnsEnv = process.env.APNS_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');

  lastApnsDebug = {
    hasTeamId: !!teamId,
    hasKeyId: !!keyId,
    hasPrivateKey: !!privateKey,
    privateKeyLength: privateKey?.length || 0,
    bundleId,
    apnsEnv,
    tokenPreview: token.substring(0, 20) + '...',
  };

  if (!teamId || !keyId || !privateKey) {
    lastApnsDebug.error = 'Missing credentials';
    console.error('APNs credentials not configured');
    return true; // Don't remove token - config issue
  }

  try {
    const client = getApnsClient();
    if (!client) {
      lastApnsDebug.error = 'Failed to create APNs client';
      return true;
    }

    lastApnsDebug.clientCreated = true;

    const notification = new Notification(token, {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: 'default',
      badge: 1,
      payload: payload.data,
    });

    await client.send(notification);

    lastApnsDebug.success = true;
    console.log('APNs notification sent successfully via HTTP/2');
    return true;

  } catch (err: any) {
    lastApnsDebug.error = err.message || String(err);
    lastApnsDebug.errorReason = err.reason;
    console.error('APNs error:', err);

    // Check for invalid token errors
    if (err.reason === Errors.badDeviceToken ||
        err.reason === Errors.unregistered ||
        err.reason === 'BadDeviceToken' ||
        err.reason === 'Unregistered') {
      lastApnsDebug.invalidToken = true;
      return false; // Remove invalid token
    }

    return true; // Keep token on other errors
  }
}

// Send Android push notification via FCM
async function sendFCM(token: string, payload: PushNotificationPayload): Promise<boolean> {
  const fcmServerKey = process.env.FCM_SERVER_KEY;

  if (!fcmServerKey) {
    console.error('FCM server key not configured. Set FCM_SERVER_KEY');
    return true;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      }),
    });

    const result = await response.json();

    if (result.success === 1) {
      console.log('FCM notification sent successfully');
      return true;
    } else if (result.failure === 1) {
      console.log('Invalid FCM token, will be removed');
      return false;
    }

    return true;
  } catch (err) {
    console.error('FCM request failed:', err);
    return true;
  }
}

// Send notification to multiple users
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ total: number; sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return {
    total: userIds.length,
    sent: totalSent,
    failed: totalFailed,
  };
}
