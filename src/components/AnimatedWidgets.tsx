'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedNumber, FadeIn, PulseGlow } from './AnimatedDashboard';

// Animated Streak Widget
export function AnimatedStreakWidget({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  longestStreak: number;
}) {
  if (currentStreak === 0) return null;

  return (
    <FadeIn delay={0.3}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.5,
              }}
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center"
            >
              <PulseGlow>
                <Flame className="w-5 h-5 text-white" />
              </PulseGlow>
            </motion.div>
            <div>
              <p className="text-sm text-text-secondary">Current Streak</p>
              <p className="text-2xl font-bold text-text-primary">
                <AnimatedNumber value={currentStreak} duration={1000} />{' '}
                {currentStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
          {longestStreak > currentStreak && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="text-right"
            >
              <p className="text-xs text-text-muted">Best</p>
              <p className="text-sm font-medium text-text-secondary">{longestStreak} days</p>
            </motion.div>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

// Animated Weekly Trend
export function AnimatedWeeklyTrend({
  avgScore,
  trend,
}: {
  avgScore: number;
  trend: number;
}) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-text-muted';

  return (
    <FadeIn delay={0.4}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">7-day average</p>
            <p className="text-2xl font-bold text-text-primary">
              <AnimatedNumber value={avgScore} duration={1200} />
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className={`flex items-center gap-1 ${trendColor}`}
          >
            <TrendIcon className="w-5 h-5" />
            <span className="font-medium">
              {trend > 0 ? '+' : ''}
              {trend}
            </span>
          </motion.div>
        </div>
      </div>
    </FadeIn>
  );
}

// Animated card wrapper for any content
export function AnimatedCard({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <FadeIn delay={delay}>
      <div className={className}>{children}</div>
    </FadeIn>
  );
}

// Animated list item for recent logs
export function AnimatedListItem({
  children,
  index = 0,
}: {
  children: React.ReactNode;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.5 + index * 0.1,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
