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
  Lock,
  Eye,
  EyeOff,
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
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<UserType>('general');
  const [goal, setGoal] = useState<Goal>('energy');
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepGoal, setSleepGoal] = useState(7.5);

  // Notification preferences state
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(true);
  const [emailStreakCelebrations, setEmailStreakCelebrations] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState('10:00');

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
          setName(profile.name || '');
          setUserType(profile.user_type as UserType);
          setGoal(profile.goal as Goal);
          setBedtime(profile.typical_bedtime || '22:30');
          setWakeTime(profile.typical_wake_time || '06:30');
          setSleepGoal(profile.sleep_goal_hours || 7.5);
          // Load notification preferences
          setPushNotificationsEnabled(profile.push_notifications_enabled ?? true);
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
          name: name || null,
          user_type: userType,
          goal: goal,
          typical_bedtime: bedtime,
          typical_wake_time: wakeTime,
          sleep_goal_hours: sleepGoal,
          push_notifications_enabled: pushNotificationsEnabled,
          email_weekly_summary: emailWeeklySummary,
          email_streak_celebrations: emailStreakCelebrations,
          email_reminders: emailReminders,
          reminder_time: reminderTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError(`Failed to save: ${updateError.message}`);
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

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError('An unexpected error occurred');
    } finally {
      setIsChangingPassword(false);
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
          <h1 className="text-lg font-semibold text-text-primary">Edit Profile</h1>
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

        {/* Name */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-medium text-text-primary">Your Name</h2>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-text-muted mt-2">This will be displayed in your dashboard greeting</p>
        </div>

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
            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-sm text-text-primary">Push Notifications</p>
                  <p className="text-xs text-text-muted">Receive notifications on your device</p>
                </div>
              </div>
              <button
                onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  pushNotificationsEnabled ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    pushNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-border pt-4">
              <p className="text-xs text-text-muted mb-3">Email Notifications</p>
            </div>

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

        {/* Change Password */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="font-medium text-text-primary">Password</h2>
            </div>
            {!showPasswordSection && (
              <button
                onClick={() => setShowPasswordSection(true)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

          {passwordSuccess && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
              <p className="text-success text-sm">Password changed successfully!</p>
            </div>
          )}

          {showPasswordSection && (
            <div className="space-y-4">
              {passwordError && (
                <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                  <p className="text-danger text-sm">{passwordError}</p>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="text-sm text-text-secondary block mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-background border border-border rounded-lg py-2.5 px-3 pr-10 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm text-text-secondary block mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-background border border-border rounded-lg py-2.5 px-3 pr-10 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1">Minimum 8 characters</p>
              </div>

              {/* Password action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handlePasswordChange}
                  size="sm"
                  isLoading={isChangingPassword}
                  className="flex-1"
                >
                  Update Password
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordSection(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!showPasswordSection && (
            <p className="text-xs text-text-muted">Update your password to keep your account secure</p>
          )}
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
