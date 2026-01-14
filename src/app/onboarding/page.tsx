'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Briefcase,
  Baby,
  User,
  Zap,
  Target,
  TrendingUp,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { UserType, Goal } from '@/types';

// User type options for Step 1
const userTypes = [
  {
    id: 'athlete' as UserType,
    label: 'Athlete',
    description: 'Optimize recovery for peak performance',
    icon: Trophy,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'professional' as UserType,
    label: 'Professional',
    description: 'Maximize energy and focus at work',
    icon: Briefcase,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'parent' as UserType,
    label: 'Parent',
    description: 'Manage fragmented sleep patterns',
    icon: Baby,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'general' as UserType,
    label: 'General',
    description: 'Build better sleep habits',
    icon: User,
    color: 'text-text-secondary',
    bgColor: 'bg-card',
  },
];

// Goal options for Step 3
const goals = [
  {
    id: 'energy' as Goal,
    label: 'More Energy',
    description: 'Wake up feeling refreshed and energized',
    icon: Zap,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'focus' as Goal,
    label: 'Better Focus',
    description: 'Improve concentration and mental clarity',
    icon: Target,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'performance' as Goal,
    label: 'Peak Performance',
    description: 'Optimize recovery for physical activities',
    icon: TrendingUp,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'consistency' as Goal,
    label: 'Consistency',
    description: 'Build a regular, healthy sleep routine',
    icon: Clock,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [userType, setUserType] = useState<UserType | null>(null);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepGoal, setSleepGoal] = useState(7.5);
  const [goal, setGoal] = useState<Goal | null>(null);

  const totalSteps = 3;

  // Calculate sleep duration from bedtime and wake time
  const calculateSleepHours = () => {
    const [bedH, bedM] = bedtime.split(':').map(Number);
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);

    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;

    // If wake time is before bedtime, add 24 hours
    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    const diffMinutes = wakeMinutes - bedMinutes;
    return (diffMinutes / 60).toFixed(1);
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form completion
  const handleComplete = async () => {
    if (!userType || !goal) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in to continue');
        return;
      }

      // Update profile with onboarding data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: userType,
          goal: goal,
          typical_bedtime: bedtime,
          typical_wake_time: wakeTime,
          sleep_goal_hours: sleepGoal,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Failed to save your preferences. Please try again.');
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return userType !== null;
      case 2:
        return bedtime && wakeTime && sleepGoal >= 4 && sleepGoal <= 12;
      case 3:
        return goal !== null;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-text-muted">
            {currentStep === 1 && 'About You'}
            {currentStep === 2 && 'Sleep Schedule'}
            {currentStep === 3 && 'Your Goal'}
          </span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-6">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: User Type Selection */}
      {currentStep === 1 && (
        <div className="animate-in fade-in duration-300">
          <h1 className="text-2xl font-bold text-text-primary mb-2">What describes you best?</h1>
          <p className="text-text-secondary mb-6">
            This helps us personalize your recovery insights.
          </p>

          <div className="space-y-3">
            {userTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = userType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setUserType(type.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-card-hover'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${type.bgColor}`}>
                    <Icon className={`w-6 h-6 ${type.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-text-primary">{type.label}</p>
                    <p className="text-sm text-text-secondary">{type.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Sleep Schedule */}
      {currentStep === 2 && (
        <div className="animate-in fade-in duration-300">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Your typical sleep schedule</h1>
          <p className="text-text-secondary mb-6">
            We&apos;ll use this as your baseline. You can adjust anytime.
          </p>

          <div className="space-y-6">
            {/* Bedtime */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Bedtime</p>
                  <p className="text-sm text-text-secondary">When do you usually go to bed?</p>
                </div>
              </div>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-3 px-4 text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Wake time */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Wake time</p>
                  <p className="text-sm text-text-secondary">When do you usually wake up?</p>
                </div>
              </div>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-3 px-4 text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Sleep duration summary */}
            <div className="bg-card-hover rounded-xl p-4 text-center">
              <p className="text-text-secondary text-sm mb-1">Typical sleep duration</p>
              <p className="text-3xl font-bold text-text-primary">{calculateSleepHours()} hours</p>
            </div>

            {/* Sleep goal */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-text-primary">Sleep goal</p>
                  <p className="text-sm text-text-secondary">How much sleep do you want?</p>
                </div>
                <span className="text-2xl font-bold text-primary">{sleepGoal}h</span>
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
        </div>
      )}

      {/* Step 3: Goal Selection */}
      {currentStep === 3 && (
        <div className="animate-in fade-in duration-300">
          <h1 className="text-2xl font-bold text-text-primary mb-2">What&apos;s your main goal?</h1>
          <p className="text-text-secondary mb-6">
            We&apos;ll focus your insights on what matters most to you.
          </p>

          <div className="space-y-3">
            {goals.map((g) => {
              const Icon = g.icon;
              const isSelected = goal === g.id;

              return (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-card-hover'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${g.bgColor}`}>
                    <Icon className={`w-6 h-6 ${g.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-text-primary">{g.label}</p>
                    <p className="text-sm text-text-secondary">{g.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button onClick={handleNext} disabled={!isStepValid()} className="flex-1">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!isStepValid()}
            isLoading={isLoading}
            className="flex-1"
          >
            Complete Setup
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
