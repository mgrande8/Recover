# Recover - Supabase Email Templates

Configure these templates in **Supabase Dashboard → Authentication → Email Templates**

---

## 1. Confirm Signup Email

**Subject:** Welcome to Recover! Please confirm your email

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Recover</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0E1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0E1A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #151B2B; border-radius: 16px; overflow: hidden;">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px 40px;">
              <!-- Moon Icon -->
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">🌙</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #F8FAFC;">RECOVER</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #94A3B8;">Sleep Better, Perform Better</p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 0 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #F8FAFC; text-align: center;">Welcome to Recover!</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                You're one step away from transforming your sleep. Confirm your email to start tracking your recovery and unlock personalized insights.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #3B82F6; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                Confirm Email Address
              </a>
            </td>
          </tr>

          <!-- Features Preview -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 16px; background-color: #0A0E1A; border-radius: 12px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #F8FAFC;">What you'll get:</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #94A3B8;">✓ Daily Recovery Score</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #94A3B8;">✓ Sleep quality tracking</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #94A3B8;">✓ Pre-sleep checklist</p>
                    <p style="margin: 0; font-size: 14px; color: #94A3B8;">✓ Personalized insights</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0A0E1A; border-top: 1px solid #1E293B;">
              <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
                If you didn't create a Recover account, you can safely ignore this email.
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
```

---

## 2. Magic Link Email

**Subject:** Your Recover login link

**Body (HTML):**

```html
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

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px 40px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 32px; line-height: 64px;">🌙</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #F8FAFC;">RECOVER</h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 0 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #F8FAFC; text-align: center;">Sign in to Recover</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                Click the button below to securely sign in to your account.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #3B82F6; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                Sign In to Recover
              </a>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0; font-size: 14px; color: #64748B; text-align: center;">
                This link expires in 24 hours and can only be used once.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0A0E1A; border-top: 1px solid #1E293B;">
              <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Password Reset Email

**Subject:** Reset your Recover password

**Body (HTML):**

```html
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

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px 40px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 32px; line-height: 64px;">🌙</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #F8FAFC;">RECOVER</h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 0 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #F8FAFC; text-align: center;">Reset Your Password</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                We received a request to reset your password. Click below to create a new one.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #3B82F6; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                Reset Password
              </a>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0; font-size: 14px; color: #64748B; text-align: center;">
                This link expires in 24 hours. If you didn't request a password reset, please ignore this email.
              </p>
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
```

---

## Configuration Notes

1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. For each template type, paste the corresponding HTML above
3. Make sure to keep the `{{ .ConfirmationURL }}` variable - Supabase replaces this with the actual link
4. Test each email type before going live

### Redirect URLs
Make sure your redirect URLs are configured in **Authentication → URL Configuration**:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/**`
