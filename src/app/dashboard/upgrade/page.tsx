'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Star,
  TrendingUp,
  Brain,
  BarChart3,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';

const proFeatures = [
  {
    icon: TrendingUp,
    title: 'Sleep Banking',
    description: 'Track your sleep debt and surplus over time',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    description: 'Personalized recommendations based on your patterns',
  },
  {
    icon: BarChart3,
    title: 'Correlation Analysis',
    description: 'See how checklist items affect your sleep quality',
  },
  {
    icon: Sparkles,
    title: 'Advanced Trends',
    description: 'Weekly and monthly performance breakdowns',
  },
];

const comparisonFeatures = [
  { feature: 'Sleep logging', free: true, pro: true },
  { feature: 'Recovery score', free: true, pro: true },
  { feature: 'Pre-sleep checklist', free: true, pro: true },
  { feature: 'Basic insights (3)', free: true, pro: true },
  { feature: 'Sleep banking', free: false, pro: true },
  { feature: 'AI-powered insights', free: false, pro: true },
  { feature: 'Correlation analysis', free: false, pro: true },
  { feature: 'Advanced trends', free: false, pro: true },
  { feature: 'Priority support', free: false, pro: true },
];

type PlanType = 'monthly' | 'annual';

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard/settings"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Upgrade to Pro</h1>
            <p className="text-sm text-text-secondary">Unlock advanced features</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 p-6 text-center">
          <div className="w-16 h-16 bg-pro-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-pro-accent" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Recover Pro</h2>
          <p className="text-text-secondary mb-6">
            Take your sleep optimization to the next level
          </p>

          {/* Plan toggle */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-background rounded-lg p-1 flex">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-card text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  selectedPlan === 'annual'
                    ? 'bg-card text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-success text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  -33%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing display */}
          {selectedPlan === 'monthly' ? (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold text-text-primary">$4.99</span>
                <span className="text-text-secondary">/month</span>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold text-text-primary">$39.99</span>
                <span className="text-text-secondary">/year</span>
              </div>
              <p className="text-sm text-success mt-1">
                Only $3.33/month — Save $20/year
              </p>
            </div>
          )}

          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            size="lg"
            className="w-full bg-pro-accent hover:bg-pro-accent/90 text-background"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Star className="w-5 h-5 mr-2" />
                {selectedPlan === 'annual' ? 'Get Annual Pro' : 'Get Monthly Pro'}
              </>
            )}
          </Button>
          <p className="text-xs text-text-muted mt-3">Cancel anytime. No questions asked.</p>
        </div>

        {/* Pro features */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text-primary">Pro Features</h3>
          {proFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-card rounded-xl border border-border p-4 flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-pro-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-pro-accent" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{feature.title}</p>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-text-primary">Free vs Pro</h3>
          </div>
          <div className="divide-y divide-border">
            {/* Header row */}
            <div className="grid grid-cols-3 px-4 py-2 bg-background">
              <span className="text-sm text-text-muted">Feature</span>
              <span className="text-sm text-text-muted text-center">Free</span>
              <span className="text-sm text-pro-accent text-center font-medium">Pro</span>
            </div>
            {/* Feature rows */}
            {comparisonFeatures.map((item) => (
              <div key={item.feature} className="grid grid-cols-3 px-4 py-3 items-center">
                <span className="text-sm text-text-primary">{item.feature}</span>
                <div className="flex justify-center">
                  {item.free ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </div>
                <div className="flex justify-center">
                  <Check className="w-4 h-4 text-pro-accent" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text-primary">FAQ</h3>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="font-medium text-text-primary mb-1">Can I cancel anytime?</p>
            <p className="text-sm text-text-secondary">
              Yes! You can cancel your subscription at any time from your settings. You&apos;ll
              keep Pro access until the end of your billing period.
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="font-medium text-text-primary mb-1">Can I switch between plans?</p>
            <p className="text-sm text-text-secondary">
              Yes! You can switch between monthly and annual billing anytime through the
              Stripe customer portal in your settings.
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="font-medium text-text-primary mb-1">Is my payment secure?</p>
            <p className="text-sm text-text-secondary">
              Absolutely. We use Stripe for payment processing, the same platform used by
              millions of businesses worldwide.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
