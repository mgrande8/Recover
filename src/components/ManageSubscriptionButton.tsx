'use client';

import { useState } from 'react';
import { Star, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
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

  return (
    <div className="bg-gradient-to-br from-pro-accent/10 to-pro-accent/5 rounded-xl border border-pro-accent/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-5 h-5 text-pro-accent" />
        <span className="text-pro-accent font-semibold">Pro Member</span>
      </div>
      <p className="text-text-secondary text-sm mb-4">
        Thank you for supporting Recover! Manage your subscription below.
      </p>
      <Button
        variant="outline"
        className="w-full border-pro-accent/50 hover:bg-pro-accent/10"
        onClick={handleManageSubscription}
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
    </div>
  );
}
