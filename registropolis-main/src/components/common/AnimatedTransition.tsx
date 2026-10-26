import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTransitionProps {
  children: React.ReactNode;
  duration?: number;
}

const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  children,
  duration = 0.25,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      /*
       * flex-1 min-h-0: takes all remaining height in the flex-col main container.
       * flex flex-col: passes the flex context down so DashboardContentWrapper
       *   and its descendants can also use flex-1.
       * overflow-y-auto: allows standalone pages (listing detail, saved, etc.)
       *   to scroll within this container instead of clipping silently.
       * w-full: fills the main element's width.
       */
      className="w-full flex-1 min-h-0 flex flex-col overflow-y-auto"
    >
      {children}
    </motion.div>
  );
};

export default AnimatedTransition;
