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
    return { success: true, sent: 0, failed: 0 };
  }

  // Check if user has push notifications enabled
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_notifications_enabled')
    .eq('id', userId)
    .single();

  if (!profile?.push_notifications_enabled) {
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

// Send notification to a specific device
// This is a placeholder - you need to implement based on your push service:
// - For iOS: Use APNs (Apple Push Notification service)
// - For Android: Use FCM (Firebase Cloud Messaging)
// - For Web: Use Web Push
async function sendToDevice(
  deviceToken: DeviceToken,
  payload: PushNotificationPayload
): Promise<boolean> {
  // TODO: Implement actual push notification sending
  // Options:
  // 1. Firebase Cloud Messaging (works for iOS, Android, Web)
  // 2. Direct APNs for iOS
  // 3. Expo Push Notifications if using Expo
  // 4. OneSignal or other third-party service

  // For now, log the notification (for debugging)
  console.log('Would send push notification:', {
    token: deviceToken.token.substring(0, 20) + '...',
    platform: deviceToken.platform,
    payload,
  });

  // Return true to indicate the token is still valid
  // In production, you'd check the response from your push service
  return true;
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
