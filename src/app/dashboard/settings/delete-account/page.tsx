'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);

  // Get user email on mount
  useState(() => {
    const getEmail = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      setIsLoadingEmail(false);
    };
    getEmail();
  });

  const handleDelete = async () => {
    if (!userEmail || confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
      setError('Please enter your email address exactly as shown above');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect to landing page
      const supabase = createClient();
      await supabase.auth.signOut();

      // Redirect to landing page
      window.location.href = '/?deleted=true';

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const isEmailMatch = userEmail && confirmEmail.toLowerCase() === userEmail.toLowerCase();

  if (isLoadingEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard/settings"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-error">Delete Account</h1>
            <p className="text-sm text-text-secondary">This action cannot be undone</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Warning section */}
        <div className="bg-error/10 border border-error/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-error" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-error mb-2">
                Permanent Account Deletion
              </h2>
              <p className="text-text-secondary text-sm">
                This will permanently delete your account and all associated data.
                This action cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-text-primary mb-4">
            The following will be permanently deleted:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-text-secondary">
              <XCircle className="w-5 h-5 text-error flex-shrink-0" />
              <span>All your sleep logs and history</span>
            </li>
            <li className="flex items-center gap-3 text-text-secondary">
              <XCircle className="w-5 h-5 text-error flex-shrink-0" />
              <span>All checklist data</span>
            </li>
            <li className="flex items-center gap-3 text-text-secondary">
              <XCircle className="w-5 h-5 text-error flex-shrink-0" />
              <span>Your streak progress</span>
            </li>
            <li className="flex items-center gap-3 text-text-secondary">
              <XCircle className="w-5 h-5 text-error flex-shrink-0" />
              <span>Profile and preferences</span>
            </li>
            <li className="flex items-center gap-3 text-text-secondary">
              <XCircle className="w-5 h-5 text-error flex-shrink-0" />
              <span>Any active subscriptions will be cancelled</span>
            </li>
          </ul>
        </div>

        {/* Confirmation input */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-text-primary mb-2">
            Confirm deletion
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            To confirm, type your email address: <strong className="text-text-primary">{userEmail}</strong>
          </p>

          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-error/50 focus:border-error"
            disabled={isDeleting}
          />

          {error && (
            <p className="mt-3 text-error text-sm">{error}</p>
          )}
        </div>

        {/* Delete button */}
        <Button
          onClick={handleDelete}
          disabled={!isEmailMatch || isDeleting}
          className="w-full bg-error hover:bg-error/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Deleting Account...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5 mr-2" />
              Permanently Delete Account
            </>
          )}
        </Button>

        {/* Cancel button */}
        <Link href="/dashboard/settings">
          <Button variant="outline" className="w-full">
            Cancel
          </Button>
        </Link>
      </main>
    </div>
  );
}
