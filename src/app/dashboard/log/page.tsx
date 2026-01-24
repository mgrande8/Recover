'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  CloudSun,
  Lightbulb,
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
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingLog, setExistingLog] = useState<boolean>(false);

  // Get initial date from URL params or default to yesterday
  const initialDate = searchParams.get('date') || getYesterdayDate();
  const initialIsNap = searchParams.get('nap') === 'true';

  // Form state
  const [date, setDate] = useState(initialDate);
  const [bedtime, setBedtime] = useState(initialIsNap ? '14:00' : '22:30');
  const [wakeTime, setWakeTime] = useState(initialIsNap ? '14:30' : '06:30');
  const [quality, setQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [interruptions, setInterruptions] = useState(0);
  const [notes, setNotes] = useState('');
  const [isNap, setIsNap] = useState(initialIsNap);

  // Load existing log data when date changes
  useEffect(() => {
    const loadExistingLog = async () => {
      setIsLoadingData(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Query by date AND is_nap to get the correct log type
        const { data } = await supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .eq('is_nap', initialIsNap)
          .single();

        if (data) {
          setExistingLog(true);
          // Parse bedtime and wake time from ISO strings
          const bedDate = new Date(data.bedtime);
          const wakeDate = new Date(data.wake_time);
          setBedtime(
            `${bedDate.getHours().toString().padStart(2, '0')}:${bedDate.getMinutes().toString().padStart(2, '0')}`
          );
          setWakeTime(
            `${wakeDate.getHours().toString().padStart(2, '0')}:${wakeDate.getMinutes().toString().padStart(2, '0')}`
          );
          setQuality(data.quality);
          setEnergy(data.energy);
          setInterruptions(data.interruptions);
          setNotes(data.notes || '');
          setIsNap(data.is_nap || false);
        } else {
          setExistingLog(false);
          // Reset to defaults for new log (keep isNap from URL param)
          setBedtime(initialIsNap ? '14:00' : '22:30');
          setWakeTime(initialIsNap ? '14:30' : '06:30');
          setQuality(3);
          setEnergy(3);
          setInterruptions(0);
          setNotes('');
          setIsNap(initialIsNap);
        }
      }
      setIsLoadingData(false);
    };

    loadExistingLog();
  }, [date]);

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
        // For naps: use neutral defaults since these fields aren't shown
        quality: isNap ? 3 : quality,
        energy: isNap ? 3 : energy,
        interruptions: isNap ? 0 : interruptions,
        notes: isNap ? null : (notes.trim() || null),
        is_nap: isNap,
      };

      // Upsert (insert or update if exists)
      // Constraint is now on (user_id, date, is_nap) to allow one sleep + one nap per date
      const { error: upsertError } = await supabase
        .from('sleep_logs')
        .upsert(logData, {
          onConflict: 'user_id,date,is_nap',
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
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href={existingLog ? "/dashboard/history" : "/dashboard"}
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              {existingLog ? (isNap ? 'Edit Nap' : 'Edit Sleep Log') : (isNap ? 'Log Nap' : 'Log Sleep')}
            </h1>
            {existingLog && (
              <p className="text-xs text-text-muted">Editing existing entry</p>
            )}
          </div>
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
              disabled={isLoadingData}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[160px]">
              <p className="text-xl font-semibold text-text-primary">{formatDate(date)}</p>
              {isLoadingData ? (
                <p className="text-xs text-text-muted mt-1">Loading...</p>
              ) : existingLog ? (
                <p className="text-xs text-warning mt-1">Editing existing entry</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => navigateDate('next')}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              disabled={date >= new Date().toISOString().split('T')[0] || isLoadingData}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nap toggle */}
        <button
          type="button"
          onClick={() => setIsNap(!isNap)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border mb-6 transition-all ${
            isNap
              ? 'border-warning bg-warning/10'
              : 'border-border bg-card hover:bg-card-hover'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isNap ? 'bg-warning/20' : 'bg-background'
            }`}>
              <CloudSun className={`w-5 h-5 ${isNap ? 'text-warning' : 'text-text-muted'}`} />
            </div>
            <div className="text-left">
              <p className={`font-medium ${isNap ? 'text-warning' : 'text-text-primary'}`}>
                {isNap ? 'This is a nap' : 'Is this a nap?'}
              </p>
              <p className="text-sm text-text-secondary">
                {isNap ? 'Naps won\'t affect your bedtime insights' : 'Toggle if logging a daytime nap'}
              </p>
            </div>
          </div>
          <div className={`w-12 h-7 rounded-full transition-colors ${
            isNap ? 'bg-warning' : 'bg-border'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full m-1 transition-transform ${
              isNap ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
        </button>

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
              <p className="text-sm text-text-secondary mb-1">{isNap ? 'Nap duration' : 'Total sleep'}</p>
              <p className={`text-2xl font-bold ${isNap && durationMinutes > 60 ? 'text-warning' : 'text-text-primary'}`}>
                {durationHours}h {durationMins > 0 ? `${durationMins}m` : ''}
              </p>
              {isNap && durationMinutes > 60 && (
                <p className="text-xs text-warning mt-1">Naps over 60 min may affect night sleep</p>
              )}
            </div>

            {/* Smart Alarm Suggestion - only for night sleep */}
            {!isNap && durationMinutes >= 300 && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Smart Alarm Tip</p>
                    <p className="text-sm text-text-secondary">
                      Set your alarm for {(() => {
                        // Calculate 30-min window ending at wake time
                        const [h, m] = wakeTime.split(':').map(Number);
                        const wakeMinutes = h * 60 + m;
                        const startMinutes = wakeMinutes - 30;
                        const startH = Math.floor(startMinutes / 60) % 24;
                        const startM = startMinutes % 60;
                        const startMeridian = startH >= 12 ? 'PM' : 'AM';
                        const endMeridian = h >= 12 ? 'PM' : 'AM';
                        const displayStartH = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH;
                        const displayEndH = h > 12 ? h - 12 : h === 0 ? 12 : h;
                        return `${displayStartH}:${startM.toString().padStart(2, '0')} ${startMeridian} - ${displayEndH}:${m.toString().padStart(2, '0')} ${endMeridian}`;
                      })()} to wake during light sleep.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quality, Energy, Interruptions, Notes - only for night sleep */}
          {!isNap && (
            <>
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
            </>
          )}

          {/* Submit button */}
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            <Check className="w-5 h-5 mr-2" />
            {isNap
              ? (existingLog ? 'Update Nap' : 'Save Nap')
              : (existingLog ? 'Update Sleep Log' : 'Save Sleep Log')
            }
          </Button>
        </form>
      </main>
    </div>
  );
}
