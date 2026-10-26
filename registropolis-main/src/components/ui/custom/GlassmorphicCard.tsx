
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type GlassmorphicCardProps = {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  border?: boolean;
  animated?: boolean;
} & (
  | { animated: true } & HTMLMotionProps<"div">
  | { animated?: false } & React.HTMLAttributes<HTMLDivElement>
);

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  className,
  intensity = 'medium',
  border = true,
  animated = false,
  ...props
}) => {
  const blurIntensity = {
    low: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    high: 'backdrop-blur-lg',
  };

  const bgOpacity = {
    low: 'bg-white/30 dark:bg-black/20',
    medium: 'bg-white/50 dark:bg-black/30',
    high: 'bg-white/70 dark:bg-black/40',
  };

  const borderStyle = border 
    ? 'border border-white/20 dark:border-white/10' 
    : '';

  if (animated) {
    return (
      <motion.div
        className={cn(
          bgOpacity[intensity],
          blurIntensity[intensity],
          borderStyle,
          'shadow-lg rounded-2xl',
          className
        )}
        {...props as HTMLMotionProps<"div">}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div
      className={cn(
        bgOpacity[intensity],
        blurIntensity[intensity],
        borderStyle,
        'shadow-lg rounded-2xl',
        className
      )}
      {...props as React.HTMLAttributes<HTMLDivElement>}
    >
      {children}
    </div>
  );
};

export default GlassmorphicCard;
