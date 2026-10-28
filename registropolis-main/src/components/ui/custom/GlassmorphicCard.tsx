
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type GlassmorphicCardProps = {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
  animated?: boolean;
} & (
  | { animated: true } & HTMLMotionProps<"div">
  | { animated?: false } & React.HTMLAttributes<HTMLDivElement>
);

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  className,
  border = true,
  animated = false,
  ...props
}) => {
  const borderStyle = border ? 'border border-border' : '';

  if (animated) {
    return (
      <motion.div
        className={cn(
          'bg-card text-card-foreground',
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
        'bg-card text-card-foreground',
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
