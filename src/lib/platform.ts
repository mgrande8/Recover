import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running as a native iOS app
 */
export function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Check if the app is running as a native Android app
 */
export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Check if the app is running in a web browser
 */
export function isWeb(): boolean {
  return !Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'web';
}

/**
 * Check if the app is running as any native platform
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform name
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (isNativeIOS()) return 'ios';
  if (isNativeAndroid()) return 'android';
  return 'web';
}

/**
 * Check if StoreKit (Apple IAP) should be used for purchases
 * Only true on native iOS
 */
export function shouldUseStoreKit(): boolean {
  return isNativeIOS();
}

/**
 * Check if Stripe should be used for purchases
 * True on web and Android (for now)
 */
export function shouldUseStripe(): boolean {
  return isWeb() || isNativeAndroid();
}
