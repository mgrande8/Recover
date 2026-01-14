import { Moon, History, Settings } from 'lucide-react';
import { Skeleton, SkeletonRecoveryScore } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-7 h-7 text-primary" />
            <span className="text-lg font-bold text-text-primary">Recover</span>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Recovery Score skeleton */}
        <SkeletonRecoveryScore />

        {/* Quick actions skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>

        {/* Weekly trend skeleton */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <div className="flex flex-col items-center gap-1 py-2 px-4 text-primary">
              <Moon className="w-5 h-5" />
              <span className="text-xs font-medium">Today</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted">
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted">
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
