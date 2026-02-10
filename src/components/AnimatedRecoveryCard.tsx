'use client';

import { motion } from 'framer-motion';
import { Clock, Star, Zap } from 'lucide-react';
import { AnimatedNumber, FadeIn, AnimatedProgress, StaggerContainer, StaggerItem } from './AnimatedDashboard';

interface AnimatedRecoveryCardProps {
  score: number;
  level: string;
  message: string;
  duration: string;
  quality: number;
  energy: number;
  colorClass: string;
  bgColorClass: string;
}

export function AnimatedRecoveryCard({
  score,
  level,
  message,
  duration,
  quality,
  energy,
  colorClass,
  bgColorClass,
}: AnimatedRecoveryCardProps) {
  const messageParts = message.split('—');

  return (
    <FadeIn delay={0.1}>
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="text-center mb-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary text-sm uppercase tracking-wide mb-2"
          >
            Recovery Score
          </motion.p>

          <div className={`text-7xl font-bold ${colorClass} mb-2`}>
            <AnimatedNumber value={score} duration={1500} />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-text-primary font-medium"
          >
            {messageParts[0]?.trim()}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-text-secondary text-sm"
          >
            {messageParts[1]?.trim()}
          </motion.p>
        </div>

        {/* Animated Progress bar */}
        <AnimatedProgress
          value={score}
          max={100}
          delay={0.5}
          className="h-2 bg-background rounded-full overflow-hidden mb-6"
          barClassName={`h-full ${bgColorClass}`}
        />

        {/* Stats grid with stagger */}
        <StaggerContainer staggerDelay={0.15} className="grid grid-cols-3 gap-4 text-center">
          <StaggerItem>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-text-muted" />
            </div>
            <p className="text-lg font-semibold text-text-primary">{duration}</p>
            <p className="text-xs text-text-muted">Duration</p>
          </StaggerItem>

          <StaggerItem>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-text-muted" />
            </div>
            <p className="text-lg font-semibold text-text-primary">{quality}/5</p>
            <p className="text-xs text-text-muted">Quality</p>
          </StaggerItem>

          <StaggerItem>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-text-muted" />
            </div>
            <p className="text-lg font-semibold text-text-primary">{energy}/5</p>
            <p className="text-xs text-text-muted">Energy</p>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </FadeIn>
  );
}
