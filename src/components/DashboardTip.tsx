'use client';

import { Lightbulb } from 'lucide-react';
import type { RecoveryLevel } from '@/types';

// Date-seeded tip index helper
function getDailyTipIndex(date: string, poolSize: number, offset: number = 0): number {
  let hash = 0;
  const seed = date + offset.toString();
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % poolSize;
}

// Recovery-tier tip pools (science-backed)
const recoveryTips: Record<string, string[]> = {
  maintain: [
    'Great recovery! Capitalize on this energy with your most demanding tasks today.',
    'Well-rested days are ideal for high-intensity training or learning new skills.',
    'Keep your momentum by sticking to the same bedtime tonight.',
    'Strong recovery supports immune function. Today is a great day to push your limits.',
    'Your focus and reaction time peak after quality sleep. Schedule important decisions now.',
    'Consistent nights like this build long-term health. Aim for the same wind-down routine tonight.',
    'Good sleep improves emotional regulation. You may find social interactions easier today.',
    'Recovery like this means your muscles are primed for growth. Make the most of your workout.',
    'Your brain consolidated memories overnight. Review anything you learned yesterday to lock it in.',
    'High recovery correlates with better creativity. Tackle complex problems while you have this edge.',
  ],
  improve: [
    'Decent sleep, but there is room to improve. Try going to bed 15 minutes earlier tonight.',
    'A short 20-minute nap this afternoon could boost your alertness for the rest of the day.',
    'Check your evening routine. Reducing screen time before bed can improve sleep quality by 20%.',
    'Moderate recovery means your body is still repairing. Stay hydrated and avoid overtraining.',
    'Try a 5-minute breathing exercise before bed tonight to improve sleep onset.',
    'Consider whether caffeine, alcohol, or a heavy dinner affected your sleep last night.',
    'Your sleep was okay but not optimal. Aim for a cooler bedroom (65-68°F) tonight.',
    'Partial recovery means your focus may dip after lunch. Plan lighter tasks for the afternoon.',
    'Consistent bedtimes improve sleep quality over time. Set an alarm to remind you to wind down.',
    'Getting morning sunlight within 30 minutes of waking can help you sleep deeper tonight.',
  ],
  fix: [
    'Low recovery detected. Prioritize rest today and avoid intense physical or mental demands.',
    'Your body needs extra recovery. Try to get to bed 30-60 minutes earlier tonight.',
    'Poor sleep compounds over days. A 20-minute nap before 2 PM can help restore some alertness.',
    'Under-recovery impairs decision-making. Delay important choices if possible until you are better rested.',
    'Avoid caffeine after noon today. Your body needs natural sleep pressure to recover tonight.',
    'Low recovery increases injury risk by 1.7x. Consider lighter exercise or active recovery today.',
    'Skip screens for the last hour before bed. Blue light is especially disruptive when sleep-deprived.',
    'Under-recovered days call for simple carbs and protein to maintain steady energy. Stay hydrated.',
    'Make tonight non-negotiable for sleep. Protect 8+ hours in bed to start recovering your deficit.',
    'If stress is keeping you awake, try writing down tomorrow\'s tasks before bed to clear your mind.',
  ],
};

function getTipTier(level: RecoveryLevel): string {
  if (level === 'fully-recovered' || level === 'recovered') return 'maintain';
  if (level === 'adequate') return 'improve';
  return 'fix';
}

function getTipColor(level: RecoveryLevel) {
  if (level === 'fully-recovered' || level === 'recovered') {
    return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' };
  }
  if (level === 'adequate') {
    return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' };
  }
  return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' };
}

export function DashboardTip({ level }: { level: RecoveryLevel }) {
  const tier = getTipTier(level);
  const tips = recoveryTips[tier];
  const today = new Date().toDateString();
  const tipIndex = getDailyTipIndex(today, tips.length);
  const tip = tips[tipIndex];
  const colors = getTipColor(level);

  return (
    <div className={`${colors.bg} rounded-xl border ${colors.border} p-3 flex gap-3 items-start`}>
      <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <Lightbulb className={`w-4 h-4 ${colors.text}`} />
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{tip}</p>
    </div>
  );
}
