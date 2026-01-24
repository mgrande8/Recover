import { getSupabaseAdmin } from '@/lib/supabase/admin';

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

// Send iOS push notification via APNs
async function sendAPNs(token: string, payload: PushNotificationPayload): Promise<boolean> {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY;
  const bundleId = process.env.APNS_BUNDLE_ID || 'com.recover.app';

  if (!teamId || !keyId || !privateKey) {
    console.error('APNs credentials not configured. Set APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY');
    // Return true to not remove the token - config issue, not token issue
    return true;
  }

  try {
    // Generate JWT for APNs authentication
    const jwt = await generateAPNsJWT(teamId, keyId, privateKey);

    // APNs endpoint (use api.push.apple.com for production)
    const isProduction = process.env.NODE_ENV === 'production';
    const apnsHost = isProduction
      ? 'https://api.push.apple.com'
      : 'https://api.sandbox.push.apple.com';

    const response = await fetch(`${apnsHost}/3/device/${token}`, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: 'default',
          badge: 1,
        },
        ...payload.data,
      }),
    });

    if (response.status === 200) {
      console.log('APNs notification sent successfully');
      return true;
    } else if (response.status === 410 || response.status === 400) {
      // 410 = Unregistered, 400 = Bad device token
      console.log('Invalid APNs token, will be removed');
      return false;
    } else {
      const errorBody = await response.text();
      console.error('APNs error:', response.status, errorBody);
      return true; // Don't remove token on server errors
    }
  } catch (err) {
    console.error('APNs request failed:', err);
    return true; // Don't remove token on network errors
  }
}

// Generate JWT for APNs authentication
async function generateAPNsJWT(teamId: string, keyId: string, privateKey: string): Promise<string> {
  // JWT header
  const header = {
    alg: 'ES256',
    kid: keyId,
  };

  // JWT payload
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: teamId,
    iat: now,
  };

  // Base64url encode
  const base64url = (obj: object) => {
    const str = JSON.stringify(obj);
    const base64 = Buffer.from(str).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = base64url(header);
  const claimsEncoded = base64url(claims);
  const message = `${headerEncoded}.${claimsEncoded}`;

  // Sign with ES256 (requires crypto)
  const crypto = await import('crypto');
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  sign.end();

  // The private key should be in PEM format
  const pemKey = privateKey.includes('-----BEGIN')
    ? privateKey
    : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;

  const signature = sign.sign(pemKey, 'base64url');

  return `${message}.${signature}`;
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
