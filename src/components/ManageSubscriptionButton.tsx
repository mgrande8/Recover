'use client';

import { useState, useEffect } from 'react';
import { Star, CreditCard, Loader2, ExternalLink, Apple } from 'lucide-react';
import { Button } from '@/components/ui';
import { shouldUseStoreKit, isNativeIOS } from '@/lib/platform';
import { Capacitor } from '@capacitor/core';

interface SubscriptionInfo {
  subscription_source: 'stripe' | 'apple' | null;
  apple_product_id?: string | null;
  pro_expires_at?: string | null;
}

interface ManageSubscriptionButtonProps {
  subscriptionInfo?: SubscriptionInfo;
}

export function ManageSubscriptionButton({ subscriptionInfo }: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleSubscription, setIsAppleSubscription] = useState(false);

  useEffect(() => {
    // Determine subscription source
    // On iOS, if subscription_source is 'apple' or we're on native iOS and no source, assume Apple
    if (subscriptionInfo?.subscription_source === 'apple') {
      setIsAppleSubscription(true);
    } else if (isNativeIOS() && !subscriptionInfo?.subscription_source) {
      // Default to Apple on iOS if no source specified
      setIsAppleSubscription(true);
    } else {
      setIsAppleSubscription(false);
    }
  }, [subscriptionInfo]);

  const handleManageStripeSubscription = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No portal URL returned');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Portal error:', error);
      setIsLoading(false);
    }
  };

  const handleManageAppleSubscription = () => {
    // Open iOS Settings app to manage subscriptions
    // This deep link works on iOS 14.5+
    if (Capacitor.isNativePlatform()) {
      // Use App Store subscription management URL
      // This opens directly in Settings on iOS
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else {
      // Fallback for web - direct to Apple's subscription management
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  };

  const getExpirationText = () => {
    if (subscriptionInfo?.pro_expires_at) {
      const expiresAt = new Date(subscriptionInfo.pro_expires_at);
      const now = new Date();
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        return `Renews in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
      }
    }
    return null;
  };

  const getPlanName = () => {
    if (subscriptionInfo?.apple_product_id) {
      if (subscriptionInfo.apple_product_id.includes('annual')) {
        return 'Annual Plan';
      }
      return 'Monthly Plan';
    }
    return null;
  };

  const expirationText = getExpirationText();
  const planName = getPlanName();

  return (
    <div className="bg-gradient-to-br from-pro-accent/10 to-pro-accent/5 rounded-xl border border-pro-accent/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-5 h-5 text-pro-accent" />
        <span className="text-pro-accent font-semibold">Pro Member</span>
        {planName && (
          <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full">
            {planName}
          </span>
        )}
      </div>
      <p className="text-text-secondary text-sm mb-2">
        Thank you for supporting Recover!
      </p>
      {expirationText && (
        <p className="text-text-muted text-xs mb-4">{expirationText}</p>
      )}
      {!expirationText && <div className="mb-4" />}

      {isAppleSubscription ? (
        <Button
          variant="outline"
          className="w-full border-pro-accent/50 hover:bg-pro-accent/10"
          onClick={handleManageAppleSubscription}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Manage in Settings
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full border-pro-accent/50 hover:bg-pro-accent/10"
          onClick={handleManageStripeSubscription}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscription
            </>
          )}
        </Button>
      )}

      {isAppleSubscription && (
        <p className="text-text-muted text-xs text-center mt-3">
          Your subscription is managed through the App Store
        </p>
      )}
    </div>
  );
}
