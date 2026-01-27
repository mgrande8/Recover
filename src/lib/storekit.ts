import { registerPlugin } from '@capacitor/core';
import { isNativeIOS } from './platform';

/**
 * StoreKit Plugin Interface
 * TypeScript definitions for the native iOS StoreKit plugin
 */
interface StoreKitPlugin {
  getProducts(): Promise<GetProductsResult>;
  purchase(options: { productId: string }): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
  getSubscriptionStatus(): Promise<SubscriptionStatus>;
  getTransactionInfo(): Promise<TransactionInfo>;
}

/**
 * Product information from App Store
 */
export interface StoreKitProduct {
  id: string;
  displayName: string;
  description: string;
  price: string;
  displayPrice: string;
  type: string;
  subscription?: {
    subscriptionGroupID: string;
    period: {
      unit: 'day' | 'week' | 'month' | 'year';
      value: number;
    };
  };
}

export interface GetProductsResult {
  products: StoreKitProduct[];
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  pending?: boolean;
  productId?: string;
  transactionId?: string;
  originalTransactionId?: string;
  expirationDate?: string;
}

export interface RestoreResult {
  success: boolean;
  hasActiveSubscription: boolean;
  productIds: string[];
}

export interface SubscriptionStatus {
  isSubscribed: boolean;
  productId?: string;
  originalTransactionId?: string;
  expirationDate?: string;
  willAutoRenew?: boolean;
}

export interface TransactionInfo {
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  purchaseDate?: string;
  expirationDate?: string;
  environment?: string;
  hasTransaction?: boolean;
}

// Register the native plugin
const StoreKitNative = registerPlugin<StoreKitPlugin>('StoreKit');

/**
 * StoreKit Service
 * High-level wrapper for Apple In-App Purchases via native Capacitor plugin
 */
export const StoreKit = {
  /**
   * Check if StoreKit is available (only on native iOS)
   */
  isAvailable(): boolean {
    return isNativeIOS();
  },

  /**
   * Get available products from App Store
   * Returns monthly and annual subscription products
   */
  async getProducts(): Promise<StoreKitProduct[]> {
    if (!this.isAvailable()) {
      console.warn('StoreKit is not available on this platform');
      return [];
    }

    try {
      const result = await StoreKitNative.getProducts();
      return result.products || [];
    } catch (error) {
      console.error('Failed to get products:', error);
      throw error;
    }
  },

  /**
   * Initiate a purchase for a product
   * @param productId - The product ID to purchase (e.g., 'com.mgrande8.recover.monthly')
   */
  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.isAvailable()) {
      throw new Error('StoreKit is not available on this platform');
    }

    try {
      const result = await StoreKitNative.purchase({ productId });

      // If purchase was successful, verify with our server
      if (result.success && result.originalTransactionId) {
        await this.verifyPurchase(result);
      }

      return result;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  },

  /**
   * Restore previously purchased subscriptions
   * Required by Apple App Store guidelines
   */
  async restorePurchases(): Promise<RestoreResult> {
    if (!this.isAvailable()) {
      throw new Error('StoreKit is not available on this platform');
    }

    try {
      const result = await StoreKitNative.restorePurchases();

      // If we found an active subscription, verify with our server
      if (result.hasActiveSubscription) {
        const transactionInfo = await StoreKitNative.getTransactionInfo();
        if (transactionInfo.originalTransactionId) {
          await this.verifyPurchase({
            productId: transactionInfo.productId,
            transactionId: transactionInfo.transactionId,
            originalTransactionId: transactionInfo.originalTransactionId,
            expirationDate: transactionInfo.expirationDate,
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  },

  /**
   * Get current subscription status from native StoreKit
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (!this.isAvailable()) {
      return { isSubscribed: false };
    }

    try {
      return await StoreKitNative.getSubscriptionStatus();
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { isSubscribed: false };
    }
  },

  /**
   * Get transaction info for the current subscription
   */
  async getTransactionInfo(): Promise<TransactionInfo> {
    if (!this.isAvailable()) {
      return { hasTransaction: false };
    }

    try {
      return await StoreKitNative.getTransactionInfo();
    } catch (error) {
      console.error('Failed to get transaction info:', error);
      return { hasTransaction: false };
    }
  },

  /**
   * Verify a purchase with our backend server
   * Updates the user's subscription status in the database
   */
  async verifyPurchase(purchaseInfo: {
    productId?: string;
    transactionId?: string;
    originalTransactionId?: string;
    expirationDate?: string;
  }): Promise<void> {
    try {
      // Get full transaction info if not provided
      let info = purchaseInfo;
      if (!info.originalTransactionId) {
        const transactionInfo = await StoreKitNative.getTransactionInfo();
        info = {
          ...info,
          ...transactionInfo,
        };
      }

      const response = await fetch('/api/apple/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: info.transactionId,
          originalTransactionId: info.originalTransactionId,
          productId: info.productId,
          expirationDate: info.expirationDate,
          environment: (info as TransactionInfo).environment || 'Production',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      console.log('Purchase verified successfully');
    } catch (error) {
      console.error('Purchase verification failed:', error);
      // Don't throw - the purchase was successful even if verification fails
      // The webhook will eventually sync the subscription status
    }
  },
};

// Product IDs for convenience
export const APPLE_PRODUCTS = {
  MONTHLY: 'com.mgrande8.recover.monthly',
  ANNUAL: 'com.mgrande8.recover.annual',
} as const;
