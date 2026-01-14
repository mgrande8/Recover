import { Moon, History, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui';

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Skeleton className="h-6 w-24" />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile section skeleton */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div>
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade card skeleton */}
        <div className="bg-card rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Sign out button skeleton */}
        <Skeleton className="h-11 w-full rounded-lg" />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <div className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted">
              <Moon className="w-5 h-5" />
              <span className="text-xs">Today</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted">
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-2 px-4 text-primary">
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Settings</span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
