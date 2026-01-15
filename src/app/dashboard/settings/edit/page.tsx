'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Trophy,
  Briefcase,
  Baby,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Moon,
  Sun,
  Check,
  Loader2,
  Bell,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { UserType, Goal, Profile } from '@/types';

// User type options
const userTypes = [
  { id: 'athlete' as UserType, label: 'Athlete', icon: Trophy, color: 'text-success' },
  { id: 'professional' as UserType, label: 'Professional', icon: Briefcase, color: 'text-primary' },
  { id: 'parent' as UserType, label: 'Parent', icon: Baby, color: 'text-warning' },
  { id: 'general' as UserType, label: 'General', icon: User, color: 'text-text-secondary' },
];

// Goal options
const goals = [
  { id: 'energy' as Goal, label: 'More Energy', icon: Zap, color: 'text-warning' },
  { id: 'focus' as Goal, label: 'Better Focus', icon: Target, color: 'text-primary' },
  { id: 'performance' as Goal, label: 'Peak Performance', icon: TrendingUp, color: 'text-success' },
  { id: 'consistency' as Goal, label: 'Consistency', icon: Clock, color: 'text-danger' },
];

export default function EditSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [userType, setUserType] = useState<UserType>('general');
  const [goal, setGoal] = useState<Goal>('energy');
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepGoal, setSleepGoal] = useState(7.5);

  // Notification preferences state
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(true);
  const [emailStreakCelebrations, setEmailStreakCelebrations] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState('10:00');

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserType(profile.user_type as UserType);
          setGoal(profile.goal as Goal);
          setBedtime(profile.typical_bedtime || '22:30');
          setWakeTime(profile.typical_wake_time || '06:30');
          setSleepGoal(profile.sleep_goal_hours || 7.5);
          // Load notification preferences
          setEmailWeeklySummary(profile.email_weekly_summary ?? true);
          setEmailStreakCelebrations(profile.email_streak_celebrations ?? true);
          setEmailReminders(profile.email_reminders ?? true);
          setReminderTime(profile.reminder_time || '10:00');
        }
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in to continue');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: userType,
          goal: goal,
          typical_bedtime: bedtime,
          typical_wake_time: wakeTime,
          sleep_goal_hours: sleepGoal,
          email_weekly_summary: emailWeeklySummary,
          email_streak_celebrations: emailStreakCelebrations,
          email_reminders: emailReminders,
          reminder_time: reminderTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        setError('Failed to save settings. Please try again.');
        return;
      }

      router.push('/dashboard/settings');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard/settings"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Edit Settings</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* User Type */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-medium text-text-primary mb-3">What describes you best?</h2>
          <div className="grid grid-cols-2 gap-2">
            {userTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = userType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setUserType(type.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-card-hover'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${type.color}`} />
                  <span className={`text-sm ${isSelected ? 'text-primary font-medium' : 'text-text-primary'}`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-medium text-text-primary mb-3">Your main goal</h2>
          <div className="grid grid-cols-2 gap-2">
            {goals.map((g) => {
              const Icon = g.icon;
              const isSelected = goal === g.id;

              return (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-card-hover'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${g.color}`} />
                  <span className={`text-sm ${isSelected ? 'text-primary font-medium' : 'text-text-primary'}`}>
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sleep Schedule */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-medium text-text-primary mb-4">Typical sleep schedule</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Bedtime */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-primary" />
                <label className="text-sm text-text-secondary">Bedtime</label>
              </div>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Wake time */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-warning" />
                <label className="text-sm text-text-secondary">Wake time</label>
              </div>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Sleep goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-text-secondary">Sleep goal</label>
              <span className="text-lg font-bold text-primary">{sleepGoal}h</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              step="0.5"
              value={sleepGoal}
              onChange={(e) => setSleepGoal(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>4h</span>
              <span>8h</span>
              <span>12h</span>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-medium text-text-primary">Notifications</h2>
          </div>

          <div className="space-y-4">
            {/* Weekly Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-sm text-text-primary">Weekly Summary</p>
                  <p className="text-xs text-text-muted">Get your sleep stats every week</p>
                </div>
              </div>
              <button
                onClick={() => setEmailWeeklySummary(!emailWeeklySummary)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  emailWeeklySummary ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    emailWeeklySummary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Streak Celebrations */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-base">🔥</span>
                <div>
                  <p className="text-sm text-text-primary">Streak Celebrations</p>
                  <p className="text-xs text-text-muted">Get notified when you hit milestones</p>
                </div>
              </div>
              <button
                onClick={() => setEmailStreakCelebrations(!emailStreakCelebrations)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  emailStreakCelebrations ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    emailStreakCelebrations ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sleep Log Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-sm text-text-primary">Log Reminders</p>
                  <p className="text-xs text-text-muted">Remind me if I haven't logged</p>
                </div>
              </div>
              <button
                onClick={() => setEmailReminders(!emailReminders)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  emailReminders ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    emailReminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reminder Time (only show if reminders enabled) */}
            {emailReminders && (
              <div className="pl-7 pt-2 border-t border-border">
                <label className="text-sm text-text-secondary block mb-2">Reminder time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" size="lg" isLoading={isSaving}>
          <Check className="w-5 h-5 mr-2" />
          Save Changes
        </Button>
      </main>
    </div>
  );
}
