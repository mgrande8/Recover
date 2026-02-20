import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { calculateRecoveryScore } from '@/lib/utils';
import type { SleepLog, Profile } from '@/types';

export interface OptimalBedtimeResult {
  hour: number;
  minute: number;
  score: number;
}

/**
 * Calculates the optimal bedtime based on sleep logs and profile.
 * Extracted from the OptimalBedtime component in the insights page.
 */
export function calculateOptimalBedtime(
  sleepLogs: SleepLog[],
  profile: Profile
): OptimalBedtimeResult | null {
  // Filter out naps
  const nightSleepLogs = sleepLogs.filter((log) => !log.is_nap);
  if (nightSleepLogs.length < 7) return null;

  // Get user's typical bedtime as reference
  const [typicalHour, typicalMin] = (profile.typical_bedtime || '22:30').split(':').map(Number);
  let typicalBedtimeHour = typicalHour + (typicalMin || 0) / 60;
  if (typicalBedtimeHour < 12) typicalBedtimeHour += 24;

  // Map bedtimes to quality scores
  const bedtimeQuality = nightSleepLogs
    .map((log) => {
      const bedtime = new Date(log.bedtime);
      let hour = bedtime.getHours() + bedtime.getMinutes() / 60;
      if (hour < 6) hour += 24;

      return {
        hour,
        score: calculateRecoveryScore(log, profile).score,
      };
    })
    .filter((bq) => bq.hour >= 17 && bq.hour <= 29);

  if (bedtimeQuality.length < 3) return null;

  // Group bedtimes into 30-min windows
  const windows: Record<string, { total: number; count: number; avgScore: number }> = {};
  bedtimeQuality.forEach((bq) => {
    const windowStart = Math.floor(bq.hour * 2) / 2;
    const key = windowStart.toString();
    if (!windows[key]) {
      windows[key] = { total: 0, count: 0, avgScore: 0 };
    }
    windows[key].total += bq.score;
    windows[key].count += 1;
  });

  Object.keys(windows).forEach((key) => {
    windows[key].avgScore = windows[key].total / windows[key].count;
  });

  const allScores = bedtimeQuality.map((bq) => bq.score);
  const avgOverallScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  // Find best window near typical bedtime
  let bestWindow = { hour: typicalBedtimeHour, avgScore: avgOverallScore };

  const nearbyWindows: { hour: number; avgScore: number; count: number }[] = [];
  Object.entries(windows).forEach(([key, data]) => {
    const windowHour = parseFloat(key);
    const distance = Math.abs(windowHour - typicalBedtimeHour);
    if (distance <= 2 && data.count >= 1) {
      nearbyWindows.push({ hour: windowHour, avgScore: data.avgScore, count: data.count });
    }
  });

  if (nearbyWindows.length > 0) {
    nearbyWindows.sort((a, b) => {
      const scoreDiff = b.avgScore - a.avgScore;
      if (Math.abs(scoreDiff) > 3) return scoreDiff;
      return Math.abs(a.hour - typicalBedtimeHour) - Math.abs(b.hour - typicalBedtimeHour);
    });
    bestWindow = { hour: nearbyWindows[0].hour, avgScore: nearbyWindows[0].avgScore };
  }

  // Convert to hours and minutes
  let displayHour = bestWindow.hour;
  if (displayHour >= 24) displayHour -= 24;

  const hours = Math.floor(displayHour);
  const minutes = Math.round((displayHour % 1) * 60);

  return {
    hour: hours,
    minute: minutes,
    score: Math.round(bestWindow.avgScore),
  };
}

/**
 * Gets current hour and minute in a timezone.
 */
function getCurrentTimeInTimezone(timezone: string): { hour: number; minute: number } {
  try {
    const now = new Date();
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const minuteFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      minute: 'numeric',
    });
    return {
      hour: parseInt(hourFormatter.format(now), 10),
      minute: parseInt(minuteFormatter.format(now), 10),
    };
  } catch {
    return { hour: new Date().getUTCHours(), minute: new Date().getUTCMinutes() };
  }
}

/**
 * Gets Pro users who should receive a smart bedtime reminder right now.
 * Checks if current time in their timezone is ~30 min before optimal bedtime.
 */
export async function getUsersForSmartReminder(): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  // Get Pro users with push enabled
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, timezone, typical_bedtime, sleep_goal_hours, is_pro, push_notifications_enabled')
    .eq('is_pro', true)
    .eq('push_notifications_enabled', true);

  if (error || !profiles) {
    console.error('[SmartBedtime] Failed to get profiles:', error);
    return [];
  }

  const usersToNotify: string[] = [];

  for (const profile of profiles) {
    const timezone = profile.timezone || 'America/New_York';

    // Get their sleep logs (need 7+ non-nap)
    const { data: sleepLogs, error: logsError } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_nap', false)
      .order('date', { ascending: false })
      .limit(30);

    if (logsError || !sleepLogs || sleepLogs.length < 7) continue;

    const optimalBedtime = calculateOptimalBedtime(sleepLogs as SleepLog[], profile as unknown as Profile);
    if (!optimalBedtime) continue;

    // Check if current time is ~30 min before optimal bedtime
    const currentTime = getCurrentTimeInTimezone(timezone);
    const currentMinutes = currentTime.hour * 60 + currentTime.minute;
    let optimalMinutes = optimalBedtime.hour * 60 + optimalBedtime.minute;

    // Handle midnight crossing
    if (optimalMinutes < 720 && currentMinutes > 720) {
      optimalMinutes += 1440;
    }

    const minutesBefore = optimalMinutes - currentMinutes;

    // Send if we're 25-35 minutes before optimal bedtime
    if (minutesBefore >= 25 && minutesBefore <= 35) {
      usersToNotify.push(profile.id);
    }
  }

  return usersToNotify;
}
