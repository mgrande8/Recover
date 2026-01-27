import { SignJWT, importPKCS8 } from 'jose';

// Apple App Store Server API endpoints
const APPLE_PRODUCTION_URL = 'https://api.storekit.itunes.apple.com';
const APPLE_SANDBOX_URL = 'https://api.storekit-sandbox.itunes.apple.com';

// Product IDs
export const APPLE_MONTHLY_PRODUCT_ID = 'com.mgrande8.recover.monthly';
export const APPLE_ANNUAL_PRODUCT_ID = 'com.mgrande8.recover.annual';

// Environment detection
export function getAppleAPIBaseURL(environment: string): string {
  if (environment === 'Sandbox' || environment === 'Xcode') {
    return APPLE_SANDBOX_URL;
  }
  return APPLE_PRODUCTION_URL;
}

/**
 * Generate a JWT for Apple App Store Server API authentication
 * Uses ES256 algorithm as required by Apple
 */
export async function generateAppleJWT(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APPLE_BUNDLE_ID || 'com.mgrande8.recover';

  if (!teamId || !keyId || !privateKey) {
    throw new Error('Missing Apple IAP environment variables (APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY)');
  }

  // Import the private key (handle newline formatting)
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  const key = await importPKCS8(formattedKey, 'ES256');

  // Generate JWT
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({})
    .setProtectedHeader({
      alg: 'ES256',
      kid: keyId,
      typ: 'JWT',
    })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600) // 1 hour expiration
    .setAudience('appstoreconnect-v1')
    .setSubject(bundleId)
    .sign(key);

  return jwt;
}

/**
 * Transaction info returned from Apple Server API
 */
export interface AppleTransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;
  expiresDate?: number;
  type: string;
  inAppOwnershipType: string;
  signedDate: number;
  environment: string;
  transactionReason?: string;
  storefront?: string;
  storefrontId?: string;
  price?: number;
  currency?: string;
}

/**
 * Subscription status from Apple
 */
export interface AppleSubscriptionStatus {
  bundleId: string;
  appAppleId: number;
  environment: string;
  data: Array<{
    subscriptionGroupIdentifier: string;
    lastTransactions: Array<{
      originalTransactionId: string;
      status: number; // 1 = Active, 2 = Expired, 3 = Billing retry, 4 = Grace period, 5 = Revoked
      signedTransactionInfo: string;
      signedRenewalInfo: string;
    }>;
  }>;
}

/**
 * Get subscription status from Apple App Store Server API
 */
export async function getSubscriptionStatus(
  originalTransactionId: string,
  environment: string = 'Production'
): Promise<AppleSubscriptionStatus | null> {
  try {
    const jwt = await generateAppleJWT();
    const baseUrl = getAppleAPIBaseURL(environment);

    const response = await fetch(
      `${baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apple API error:', response.status, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get subscription status from Apple:', error);
    return null;
  }
}

/**
 * Look up transaction history from Apple
 */
export async function getTransactionHistory(
  originalTransactionId: string,
  environment: string = 'Production'
): Promise<{ transactions: AppleTransactionInfo[] } | null> {
  try {
    const jwt = await generateAppleJWT();
    const baseUrl = getAppleAPIBaseURL(environment);

    const response = await fetch(
      `${baseUrl}/inApps/v1/history/${originalTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apple API error:', response.status, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get transaction history from Apple:', error);
    return null;
  }
}

/**
 * Decode a signed transaction from Apple (JWS format)
 * Returns the decoded payload without verification for now
 */
export function decodeSignedTransaction(signedTransaction: string): AppleTransactionInfo | null {
  try {
    // JWS format: header.payload.signature
    const parts = signedTransaction.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWS format');
      return null;
    }

    // Decode the payload (base64url)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode signed transaction:', error);
    return null;
  }
}

/**
 * Apple Server Notification V2 types
 */
export type AppleNotificationType =
  | 'CONSUMPTION_REQUEST'
  | 'DID_CHANGE_RENEWAL_PREF'
  | 'DID_CHANGE_RENEWAL_STATUS'
  | 'DID_FAIL_TO_RENEW'
  | 'DID_RENEW'
  | 'EXPIRED'
  | 'GRACE_PERIOD_EXPIRED'
  | 'OFFER_REDEEMED'
  | 'PRICE_INCREASE'
  | 'REFUND'
  | 'REFUND_DECLINED'
  | 'REFUND_REVERSED'
  | 'RENEWAL_EXTENDED'
  | 'RENEWAL_EXTENSION'
  | 'REVOKE'
  | 'SUBSCRIBED'
  | 'TEST';

export type AppleSubtype =
  | 'INITIAL_BUY'
  | 'RESUBSCRIBE'
  | 'DOWNGRADE'
  | 'UPGRADE'
  | 'AUTO_RENEW_ENABLED'
  | 'AUTO_RENEW_DISABLED'
  | 'VOLUNTARY'
  | 'BILLING_RETRY'
  | 'PRICE_INCREASE'
  | 'GRACE_PERIOD'
  | 'PENDING'
  | 'ACCEPTED'
  | 'BILLING_RECOVERY'
  | 'PRODUCT_NOT_FOR_SALE'
  | 'SUMMARY'
  | 'FAILURE';

export interface AppleServerNotificationV2 {
  notificationType: AppleNotificationType;
  subtype?: AppleSubtype;
  notificationUUID: string;
  data: {
    bundleId: string;
    bundleVersion: string;
    environment: string;
    signedTransactionInfo: string;
    signedRenewalInfo?: string;
  };
  version: string;
  signedDate: number;
}

/**
 * Decode Apple Server Notification V2 payload
 */
export function decodeServerNotification(signedPayload: string): AppleServerNotificationV2 | null {
  try {
    const parts = signedPayload.split('.');
    if (parts.length !== 3) {
      console.error('Invalid notification JWS format');
      return null;
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode server notification:', error);
    return null;
  }
}

/**
 * Calculate subscription expiration date based on product
 */
export function calculateExpirationDate(productId: string, fromDate?: Date): Date {
  const baseDate = fromDate || new Date();

  if (productId === APPLE_ANNUAL_PRODUCT_ID) {
    // Annual: 1 year from purchase
    const expiry = new Date(baseDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  } else {
    // Monthly: 1 month from purchase
    const expiry = new Date(baseDate);
    expiry.setMonth(expiry.getMonth() + 1);
    return expiry;
  }
}

/**
 * Check if subscription status indicates an active subscription
 */
export function isSubscriptionActive(status: number): boolean {
  // Apple subscription statuses:
  // 1 = Active
  // 2 = Expired
  // 3 = Billing retry period
  // 4 = Billing grace period
  // 5 = Revoked
  return status === 1 || status === 3 || status === 4;
}

/**
 * Determine plan type from product ID
 */
export function getPlanType(productId: string): 'monthly' | 'annual' {
  return productId === APPLE_ANNUAL_PRODUCT_ID ? 'annual' : 'monthly';
}
