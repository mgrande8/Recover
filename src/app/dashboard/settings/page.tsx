import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  Moon,
  History,
  User,
  Clock,
  Target,
  LogOut,
  ChevronRight,
  Star,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import { ProUpgradeSuccessModal } from '@/components/ProUpgradeSuccessModal';
import { HiddenPushDiagnostic } from '@/components/PushDiagnostic';

// Settings item component
function SettingsItem({
  icon: Icon,
  label,
  value,
  iconColor = 'text-text-muted',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="text-sm">{value}</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile (use admin to bypass RLS for immediate Pro status visibility)
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Format user type for display
  const formatUserType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format goal for display
  const formatGoal = (goal: string) => {
    const goalLabels: Record<string, string> = {
      energy: 'More Energy',
      focus: 'Better Focus',
      performance: 'Peak Performance',
      consistency: 'Consistency',
    };
    return goalLabels[goal] || goal;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Pro upgrade success modal */}
      <Suspense fallback={null}>
        <ProUpgradeSuccessModal />
      </Suspense>

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-text-primary">Profile</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile section */}
        <div className="bg-card rounded-xl border border-border p-4">
          <Link href="/dashboard/settings/edit" className="block">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border hover:bg-card-hover -m-4 p-4 rounded-t-xl transition-colors">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                {profile.name ? (
                  <p className="font-semibold text-text-primary">{profile.name}</p>
                ) : (
                  <p className="font-semibold text-primary">Add your name</p>
                )}
                <p className="text-sm text-text-muted">{user.email}</p>
                <p className="text-sm text-text-secondary">
                  {profile.is_pro ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-pro-accent" />
                      <span className="text-pro-accent">Pro Member</span>
                    </span>
                  ) : (
                    'Free Account'
                  )}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted" />
            </div>
          </Link>

          <Link href="/dashboard/settings/edit" className="block">
            <div className="divide-y divide-border hover:bg-card-hover rounded-lg transition-colors -mx-2 px-2">
              <SettingsItem
                icon={User}
                label="User Type"
                value={formatUserType(profile.user_type)}
                iconColor="text-primary"
              />
              <SettingsItem
                icon={Target}
                label="Goal"
                value={formatGoal(profile.goal)}
                iconColor="text-success"
              />
              <SettingsItem
                icon={Clock}
                label="Sleep Goal"
                value={`${profile.sleep_goal_hours}h`}
                iconColor="text-warning"
              />
              <SettingsItem
                icon={Moon}
                label="Typical Bedtime"
                value={profile.typical_bedtime}
                iconColor="text-primary"
              />
            </div>
          </Link>
          <p className="text-xs text-text-muted text-center mt-3">Tap to edit your profile</p>
        </div>

        {/* Upgrade to Pro / Manage Subscription */}
        {!profile.is_pro ? (
          <Link href="/dashboard/upgrade" className="block">
            <div className="bg-gradient-to-br from-card to-card-hover rounded-xl border border-border p-4 hover:border-pro-accent/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-pro-accent" />
                <span className="text-pro-accent font-semibold">Upgrade to Pro</span>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Get advanced insights, sleep banking, and correlation analysis.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-text-primary font-bold">$4.99/mo</span>
                <ChevronRight className="w-5 h-5 text-pro-accent" />
              </div>
            </div>
          </Link>
        ) : (
          <ManageSubscriptionButton />
        )}

        {/* Sign out */}
        <form action="/auth/signout" method="post">
          <Button variant="outline" className="w-full" type="submit">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </form>

        {/* Delete Account */}
        <Link href="/dashboard/settings/delete-account">
          <Button
            variant="outline"
            className="w-full border-error/50 text-error hover:bg-error/10 hover:border-error"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </Link>

        {/* App info - tap version 5 times to show push diagnostic */}
        <HiddenPushDiagnostic />
      </main>

    </div>
  );
}
