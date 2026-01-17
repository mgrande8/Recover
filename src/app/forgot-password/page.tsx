'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Moon, Mail, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      // Use /auth/confirm for the redirect - Supabase will append token_hash/code and type=recovery
      // The confirm route will then redirect to /reset-password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Link
            href="/login"
            className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>

          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Check your email</h1>
            <p className="text-text-secondary mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-text-muted">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-primary hover:underline"
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link
          href="/login"
          className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Moon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Reset password</h1>
            <p className="text-text-secondary mt-2">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-6">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-background border border-border rounded-lg py-3 pl-10 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Reset Link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
