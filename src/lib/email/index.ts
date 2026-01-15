import { Resend } from 'resend';

// Lazy initialize Resend to avoid build-time errors
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM_EMAIL = 'Recover <onboarding@resend.dev>';

// Pro upgrade congratulations email
export async function sendProUpgradeEmail(email: string, plan: 'monthly' | 'annual') {
  const resend = getResend();

  const planDetails = plan === 'annual'
    ? { price: '$39.99/year', savings: 'You\'re saving $20/year!' }
    : { price: '$4.99/month', savings: '' };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🎉 Welcome to Recover Pro!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0E1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0E1A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #151B2B; border-radius: 16px; overflow: hidden;">

          <!-- Header with celebration -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px 40px; background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);">
              <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #0A0E1A;">You're Pro!</h1>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 32px 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #F8FAFC; text-align: center;">Welcome to Recover Pro</h2>
              <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                Thank you for upgrading! You now have access to all premium features.
              </p>
              <p style="margin: 0; font-size: 14px; color: #FBBF24; text-align: center; font-weight: 600;">
                ${planDetails.price} ${planDetails.savings}
              </p>
            </td>
          </tr>

          <!-- Pro Features -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <div style="background-color: #0A0E1A; border-radius: 12px; padding: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #FBBF24;">Your Pro Features:</p>

                <div style="margin-bottom: 12px;">
                  <span style="color: #22C55E; font-size: 16px;">✓</span>
                  <span style="color: #F8FAFC; font-size: 14px; margin-left: 8px; font-weight: 500;">Advanced Insights</span>
                  <p style="margin: 4px 0 0 24px; font-size: 13px; color: #64748B;">Deep analysis of your sleep patterns</p>
                </div>

                <div style="margin-bottom: 12px;">
                  <span style="color: #22C55E; font-size: 16px;">✓</span>
                  <span style="color: #F8FAFC; font-size: 14px; margin-left: 8px; font-weight: 500;">Sleep Banking</span>
                  <p style="margin: 4px 0 0 24px; font-size: 13px; color: #64748B;">Track sleep debt and surplus over time</p>
                </div>

                <div style="margin-bottom: 12px;">
                  <span style="color: #22C55E; font-size: 16px;">✓</span>
                  <span style="color: #F8FAFC; font-size: 14px; margin-left: 8px; font-weight: 500;">Correlation Analysis</span>
                  <p style="margin: 4px 0 0 24px; font-size: 13px; color: #64748B;">See what affects your sleep quality</p>
                </div>

                <div style="margin-bottom: 12px;">
                  <span style="color: #22C55E; font-size: 16px;">✓</span>
                  <span style="color: #F8FAFC; font-size: 14px; margin-left: 8px; font-weight: 500;">Personalized Recommendations</span>
                  <p style="margin: 4px 0 0 24px; font-size: 13px; color: #64748B;">AI-powered tips for better sleep</p>
                </div>

                <div>
                  <span style="color: #22C55E; font-size: 16px;">✓</span>
                  <span style="color: #F8FAFC; font-size: 14px; margin-left: 8px; font-weight: 500;">Priority Support</span>
                  <p style="margin: 4px 0 0 24px; font-size: 13px; color: #64748B;">Get help when you need it</p>
                </div>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <a href="https://recover.app/dashboard/insights" style="display: inline-block; padding: 16px 32px; background-color: #3B82F6; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                Explore Pro Features
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0A0E1A; border-top: 1px solid #1E293B;">
              <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
                Manage your subscription anytime in Settings.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748B; text-align: center;">
                © 2025 Recover. Sleep better, perform better.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

// Weekly summary email
export async function sendWeeklySummaryEmail(
  email: string,
  stats: {
    avgScore: number;
    avgDuration: string;
    logsCount: number;
    streak: number;
  }
) {
  const resend = getResend();

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `📊 Your Weekly Sleep Summary - Score: ${stats.avgScore}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0E1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0E1A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #151B2B; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px 40px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #F8FAFC;">Your Week in Sleep</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #94A3B8;">Here's how you did this week</p>
            </td>
          </tr>

          <!-- Stats Grid -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding: 12px; background-color: #0A0E1A; border-radius: 12px 0 0 0;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #3B82F6; text-align: center;">${stats.avgScore}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B; text-align: center;">Avg Score</p>
                  </td>
                  <td width="50%" style="padding: 12px; background-color: #0A0E1A; border-radius: 0 12px 0 0;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #22C55E; text-align: center;">${stats.avgDuration}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B; text-align: center;">Avg Sleep</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 12px; background-color: #0A0E1A; border-radius: 0 0 0 12px;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #F59E0B; text-align: center;">${stats.logsCount}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B; text-align: center;">Nights Logged</p>
                  </td>
                  <td width="50%" style="padding: 12px; background-color: #0A0E1A; border-radius: 0 0 12px 0;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #EF4444; text-align: center;">${stats.streak}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B; text-align: center;">Day Streak</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <a href="https://recover.app/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #3B82F6; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
                View Full Report
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0A0E1A; border-top: 1px solid #1E293B;">
              <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
                © 2025 Recover. Sleep better, perform better.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

// Streak celebration email
export async function sendStreakCelebrationEmail(email: string, streak: number) {
  const resend = getResend();

  const milestones: Record<number, { emoji: string; message: string }> = {
    3: { emoji: '🔥', message: '3 days strong! You\'re building a habit.' },
    7: { emoji: '⭐', message: '1 week streak! You\'re on fire!' },
    14: { emoji: '🏆', message: '2 weeks! You\'re a sleep tracking champion!' },
    30: { emoji: '👑', message: '30 days! You\'re a sleep master!' },
  };

  const milestone = milestones[streak];
  if (!milestone) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${milestone.emoji} ${streak}-Day Streak! Keep it up!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0E1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0E1A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #151B2B; border-radius: 16px; overflow: hidden;">

          <!-- Celebration Header -->
          <tr>
            <td align="center" style="padding: 40px; background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);">
              <div style="font-size: 64px; margin-bottom: 8px;">${milestone.emoji}</div>
              <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #FFFFFF;">${streak}</h1>
              <p style="margin: 8px 0 0 0; font-size: 18px; color: #FFFFFF; opacity: 0.9;">Day Streak!</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #F8FAFC;">${milestone.message}</h2>
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #94A3B8;">
                Consistency is the key to better sleep. Keep logging to maintain your streak!
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <a href="https://recover.app/dashboard/log" style="display: inline-block; padding: 14px 28px; background-color: #3B82F6; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
                Log Tonight's Sleep
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0A0E1A; border-top: 1px solid #1E293B;">
              <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
                © 2025 Recover. Sleep better, perform better.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}
