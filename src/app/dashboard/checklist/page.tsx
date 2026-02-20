'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Dumbbell,
  Coffee,
  Wine,
  UtensilsCrossed,
  Moon,
  Thermometer,
  Smartphone,
  BedDouble,
  Loader2,
} from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { getTodayDate } from '@/lib/utils';
import { ChecklistStreakWidget } from '@/components/ChecklistStreakWidget';

// Checklist item type
interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'exercised',
    label: 'Exercised today',
    description: 'Physical activity helps you sleep deeper',
    icon: Dumbbell,
    color: 'text-success',
  },
  {
    id: 'no_caffeine_after_2pm',
    label: 'No caffeine after 2pm',
    description: 'Caffeine stays in your system for 8+ hours',
    icon: Coffee,
    color: 'text-warning',
  },
  {
    id: 'no_alcohol',
    label: 'No alcohol tonight',
    description: 'Alcohol disrupts REM sleep cycles',
    icon: Wine,
    color: 'text-danger',
  },
  {
    id: 'no_heavy_meal',
    label: 'No heavy meal before bed',
    description: 'Eat dinner at least 3 hours before sleep',
    icon: UtensilsCrossed,
    color: 'text-warning',
  },
  {
    id: 'room_dark',
    label: 'Room is dark',
    description: 'Darkness triggers melatonin production',
    icon: Moon,
    color: 'text-primary',
  },
  {
    id: 'room_cool',
    label: 'Room is cool (65-68°F)',
    description: 'Cool temperatures improve sleep quality',
    icon: Thermometer,
    color: 'text-primary',
  },
  {
    id: 'screens_off_30min',
    label: 'Screens off 30min before bed',
    description: 'Blue light suppresses melatonin',
    icon: Smartphone,
    color: 'text-danger',
  },
  {
    id: 'phone_not_in_bed',
    label: 'Phone not in bedroom',
    description: 'Removes temptation to check notifications',
    icon: BedDouble,
    color: 'text-success',
  },
];

export default function ChecklistPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const today = getTodayDate();

  // Load existing checklist for today
  useEffect(() => {
    const loadChecklist = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('checklist_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        if (data) {
          setCheckedItems({
            exercised: data.exercised,
            no_caffeine_after_2pm: data.no_caffeine_after_2pm,
            no_alcohol: data.no_alcohol,
            no_heavy_meal: data.no_heavy_meal,
            room_dark: data.room_dark,
            room_cool: data.room_cool,
            screens_off_30min: data.screens_off_30min,
            phone_not_in_bed: data.phone_not_in_bed,
          });
        }
      }
      setIsLoading(false);
    };

    loadChecklist();
  }, [today]);

  // Toggle item
  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculate score
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = checklistItems.length;
  const percentage = Math.round((checkedCount / totalItems) * 100);

  // Save checklist
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const checklistData = {
        user_id: user.id,
        date: today,
        ...checkedItems,
      };

      await supabase
        .from('checklist_logs')
        .upsert(checklistData, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false,
        });

      showToast('Checklist saved!', 'success');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error saving checklist:', error);
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Pre-Sleep Checklist</h1>
            <p className="text-sm text-text-secondary">Set yourself up for better sleep</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Streak widget */}
        <ChecklistStreakWidget />

        {/* Progress card */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary">Tonight&apos;s progress</span>
            <span className="text-2xl font-bold text-text-primary">
              {checkedCount}/{totalItems}
            </span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percentage >= 75 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-danger'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-text-muted mt-2">
            {percentage >= 75
              ? 'Great! You\'re set for quality sleep.'
              : percentage >= 50
              ? 'Good progress. Try to check a few more.'
              : 'Complete more items for better sleep.'}
          </p>
        </div>

        {/* Checklist items */}
        <div className="space-y-3 mb-6">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            const isChecked = checkedItems[item.id] || false;

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  isChecked
                    ? 'border-success/50 bg-success/5'
                    : 'border-border bg-card hover:bg-card-hover'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isChecked ? 'bg-success/20' : 'bg-background'
                  }`}
                >
                  {isChecked ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={`font-medium ${
                      isChecked ? 'text-success' : 'text-text-primary'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-sm text-text-secondary">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" size="lg" isLoading={isSaving}>
          <Check className="w-5 h-5 mr-2" />
          Save Checklist
        </Button>
      </main>
    </div>
  );
}
