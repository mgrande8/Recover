'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, TrendingUp, Brain, BarChart3, Sparkles, Headphones, X } from 'lucide-react';
import { Button } from '@/components/ui';

const proFeatures = [
  { icon: TrendingUp, title: 'Sleep Banking', description: 'Track sleep debt and surplus' },
  { icon: Brain, title: 'AI Insights', description: 'Personalized recommendations' },
  { icon: BarChart3, title: 'Correlation Analysis', description: 'See what affects your sleep' },
  { icon: Sparkles, title: 'Advanced Trends', description: 'Weekly & monthly breakdowns' },
  { icon: Headphones, title: 'Priority Support', description: 'Get help when you need it' },
];

export function ProUpgradeSuccessModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setIsOpen(true);
      // Remove the query param from URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleExploreFeatures = () => {
    setIsOpen(false);
    router.push('/dashboard/insights');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration header */}
        <div className="bg-gradient-to-br from-pro-accent to-yellow-600 px-6 py-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-background">You're Pro!</h2>
          <p className="text-background/80 mt-1">Welcome to Recover Pro</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary text-center mb-6">
            Thank you for upgrading! You now have access to all premium features.
          </p>

          {/* Feature list */}
          <div className="space-y-3 mb-6">
            {proFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pro-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-pro-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{feature.title}</p>
                    <p className="text-xs text-text-muted">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleExploreFeatures}
              size="lg"
              className="w-full bg-pro-accent hover:bg-pro-accent/90 text-background"
            >
              <Star className="w-5 h-5 mr-2" />
              Explore Pro Features
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="lg"
              className="w-full"
            >
              Continue to Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
