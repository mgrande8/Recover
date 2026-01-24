import Link from 'next/link';
import { Moon, TrendingUp, Zap, BarChart3, Star, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile App Hero - Shows on small screens */}
      <div className="lg:hidden min-h-screen flex flex-col pt-safe">
        {/* Logo Header */}
        <div className="px-6 py-8">
          <div className="flex items-center gap-3">
            <Moon className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold text-text-primary">Recover</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4 leading-tight">
            Sleep better.
            <br />
            <span className="text-primary">Perform better.</span>
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            Track your sleep and wake up knowing exactly how ready you are for the day.
          </p>

          {/* Recovery Score Preview */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-2 text-center">
              Your Recovery Score
            </p>
            <div className="text-6xl font-bold text-success text-center mb-1">87</div>
            <p className="text-text-primary text-center font-medium">Fully Recovered</p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link href="/signup" className="block">
              <Button size="lg" className="w-full">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Log In
              </Button>
            </Link>
          </div>
          <p className="text-text-muted text-sm text-center mt-4">Free to use. No credit card required.</p>
        </div>
      </div>

      {/* Desktop Landing Page - Hidden on mobile */}
      <div className="hidden lg:block">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Moon className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-text-primary">Recover</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Log in
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Sleep better.
            <br />
            <span className="text-primary">Perform better.</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Track your sleep, understand your patterns, and wake up knowing exactly how ready you
            are for the day ahead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Tracking Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-text-muted text-sm mt-4">No credit card required</p>
        </div>
      </section>

      {/* Recovery Score Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl border border-border p-8 sm:p-12">
            <div className="text-center mb-8">
              <p className="text-text-secondary text-sm uppercase tracking-wide mb-2">
                Your Recovery Score
              </p>
              <div className="text-7xl sm:text-8xl font-bold text-success mb-2">87</div>
              <p className="text-text-primary text-lg font-medium">Fully Recovered</p>
              <p className="text-text-secondary">Ready for high intensity</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center border-t border-border pt-8">
              <div>
                <p className="text-2xl font-semibold text-text-primary">7h 45m</p>
                <p className="text-text-muted text-sm">Sleep Duration</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">4/5</p>
                <p className="text-text-muted text-sm">Sleep Quality</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">5/5</p>
                <p className="text-text-muted text-sm">Morning Energy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
            Everything you need to optimize your rest
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Simple tracking, powerful insights. No wearables required.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Track */}
            <div className="bg-card rounded-xl border border-border p-6 hover:bg-card-hover transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Moon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Track</h3>
              <p className="text-text-secondary">
                Log your sleep in seconds. Record bedtime, wake time, quality, and how you feel each
                morning.
              </p>
            </div>
            {/* Learn */}
            <div className="bg-card rounded-xl border border-border p-6 hover:bg-card-hover transition-colors">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Learn</h3>
              <p className="text-text-secondary">
                Understand what affects your sleep. See patterns, trends, and get personalized
                insights.
              </p>
            </div>
            {/* Optimize */}
            <div className="bg-card rounded-xl border border-border p-6 hover:bg-card-hover transition-colors">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Optimize</h3>
              <p className="text-text-secondary">
                Use your Recovery Score to plan your day. Know when to push hard and when to rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tier Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Powerful features, completely free
            </h2>
            <p className="text-text-secondary">
              Start improving your sleep today. No credit card required.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-text-primary">Unlimited sleep tracking</span>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-text-primary">Daily Recovery Score</span>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-text-primary">Full sleep history</span>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-text-primary">Pre-sleep checklist</span>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-text-primary">3 basic insights</span>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-text-primary">Weekly trends</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pro Mention */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-card to-card-hover rounded-2xl border border-border p-8 sm:p-12">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-pro-accent" />
              <span className="text-pro-accent font-semibold">Recover Pro</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
              Want to go deeper?
            </h2>
            <p className="text-text-secondary mb-6 max-w-xl">
              Upgrade to Pro for advanced insights, sleep debt tracking, correlation analysis, and
              performance mode. Understand exactly what helps you sleep better.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-text-primary">
                <span className="text-3xl font-bold">$4.99</span>
                <span className="text-text-muted">/month</span>
              </div>
              <span className="text-text-muted">or $39.99/year (save 33%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
            Built for everyone who wants better sleep
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Whether you&apos;re training for a marathon or just want more energy for your day.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Athletes</h3>
              <p className="text-text-secondary text-sm">Optimize recovery for peak performance</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Professionals</h3>
              <p className="text-text-secondary text-sm">Maximize energy and focus at work</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-8 h-8 text-warning" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Parents</h3>
              <p className="text-text-secondary text-sm">Manage fragmented sleep patterns</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-danger" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Everyone</h3>
              <p className="text-text-secondary text-sm">Build better sleep habits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Start sleeping better tonight
          </h2>
          <p className="text-text-secondary mb-8">
            Join thousands who have improved their sleep and transformed their days.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Moon className="w-6 h-6 text-primary" />
              <span className="font-semibold text-text-primary">Recover</span>
            </div>
            <p className="text-text-muted text-sm">
              &copy; {new Date().getFullYear()} Recover. Sleep better. Perform better.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
