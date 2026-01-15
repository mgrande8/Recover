'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Moon,
  Sun,
  Star,
  Zap,
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { getYesterdayDate, formatDate } from '@/lib/utils';

// Rating component for quality and energy
function RatingSelector({
  label,
  value,
  onChange,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-medium text-text-primary">{label}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`flex-1 py-3 rounded-lg border transition-all text-lg font-medium ${
              value === rating
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-card text-text-secondary hover:bg-card-hover'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-muted mt-1 px-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

// Interruptions selector
function InterruptionsSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const options = [
    { value: 0, label: 'None' },
    { value: 1, label: '1 time' },
    { value: 2, label: '2 times' },
    { value: 3, label: '3+ times' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-warning" />
        <span className="font-medium text-text-primary">Wake-ups during night</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`py-3 rounded-lg border transition-all text-sm font-medium ${
              value === opt.value
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-card text-text-secondary hover:bg-card-hover'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SleepLogPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingLog, setExistingLog] = useState<boolean>(false);

  // Form state
  const [date, setDate] = useState(getYesterdayDate());
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [interruptions, setInterruptions] = useState(0);
  const [notes, setNotes] = useState('');

  // Calculate duration
  const calculateDuration = () => {
    const [bedH, bedM] = bedtime.split(':').map(Number);
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);

    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;

    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    return wakeMinutes - bedMinutes;
  };

  const durationMinutes = calculateDuration();
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;

  // Check if log exists for selected date
  useEffect(() => {
    const checkExistingLog = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('sleep_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', date)
          .single();

        setExistingLog(!!data);
      }
    };

    checkExistingLog();
  }, [date]);

  // Navigate date
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(date);
    current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    const newDate = current.toISOString().split('T')[0];

    // Don't allow future dates
    const today = new Date().toISOString().split('T')[0];
    if (newDate <= today) {
      setDate(newDate);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in to continue');
        return;
      }

      // Create bedtime and wake time timestamps
      const bedDate = new Date(date);
      const [bedH, bedM] = bedtime.split(':').map(Number);
      bedDate.setHours(bedH, bedM, 0, 0);

      const wakeDate = new Date(date);
      const [wakeH, wakeM] = wakeTime.split(':').map(Number);
      wakeDate.setHours(wakeH, wakeM, 0, 0);

      // If wake time is before bedtime, it's the next day
      if (wakeDate <= bedDate) {
        wakeDate.setDate(wakeDate.getDate() + 1);
      }

      const logData = {
        user_id: user.id,
        date,
        bedtime: bedDate.toISOString(),
        wake_time: wakeDate.toISOString(),
        duration_minutes: durationMinutes,
        quality,
        energy,
        interruptions,
        notes: notes.trim() || null,
      };

      // Upsert (insert or update if exists)
      const { error: upsertError } = await supabase
        .from('sleep_logs')
        .upsert(logData, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        setError('Failed to save sleep log. Please try again.');
        return;
      }

      // Check for streak milestone (only for new logs, not updates)
      if (!existingLog) {
        try {
          const streakResponse = await fetch('/api/streak/check', { method: 'POST' });
          const streakData = await streakResponse.json();

          if (streakData.milestone) {
            // Show celebration toast for milestone
            showToast(`${streakData.message}`, 'success');
          } else {
            showToast('Sleep log saved!', 'success');
          }
        } catch {
          // If streak check fails, still show success
          showToast('Sleep log saved!', 'success');
        }
      } else {
        showToast('Sleep log updated!', 'success');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Log Sleep</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Date selector */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <p className="text-sm text-text-secondary text-center mb-2">Night of</p>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigateDate('prev')}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-xl font-semibold text-text-primary">{formatDate(date)}</p>
              {existingLog && (
                <p className="text-xs text-warning mt-1">Already logged - will update</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigateDate('next')}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              disabled={date >= new Date().toISOString().split('T')[0]}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-6">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sleep times */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Bedtime */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-text-primary">Bedtime</label>
                </div>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {/* Wake time */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-warning" />
                  <label className="text-sm font-medium text-text-primary">Wake time</label>
                </div>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Duration display */}
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-sm text-text-secondary mb-1">Total sleep</p>
              <p className="text-2xl font-bold text-text-primary">
                {durationHours}h {durationMins > 0 ? `${durationMins}m` : ''}
              </p>
            </div>
          </div>

          {/* Quality rating */}
          <div className="bg-card rounded-xl border border-border p-4">
            <RatingSelector
              label="Sleep Quality"
              value={quality}
              onChange={setQuality}
              icon={Star}
              color="text-primary"
            />
          </div>

          {/* Energy rating */}
          <div className="bg-card rounded-xl border border-border p-4">
            <RatingSelector
              label="Morning Energy"
              value={energy}
              onChange={setEnergy}
              icon={Zap}
              color="text-success"
            />
          </div>

          {/* Interruptions */}
          <div className="bg-card rounded-xl border border-border p-4">
            <InterruptionsSelector value={interruptions} onChange={setInterruptions} />
          </div>

          {/* Notes */}
          <div className="bg-card rounded-xl border border-border p-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything that affected your sleep? Dreams, stress, late meal..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            <Check className="w-5 h-5 mr-2" />
            {existingLog ? 'Update Sleep Log' : 'Save Sleep Log'}
          </Button>
        </form>
      </main>
    </div>
  );
}
