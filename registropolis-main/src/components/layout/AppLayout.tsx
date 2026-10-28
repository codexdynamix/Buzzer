import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AnimatedTransition from '../common/AnimatedTransition';
import FloatingNavHub from './FloatingNavHub';
import BuzzerBadge from './BuzzerBadge';

interface AppLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  noAnimation?: boolean;
  withSidebar?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  fullWidth = false,
  maxWidth = '2xl',
  centered = false,
  noAnimation = false,
  withSidebar = true,
}) => {
  const location = useLocation();

  return (
    /*
     * Use 100dvh (dynamic viewport height) instead of h-screen (100vh).
     * On mobile browsers, 100vh includes the address bar and can be larger
     * than the visible area, pushing content off-screen.
     * 100dvh always equals the currently visible viewport.
     */
    <div
      className="flex overflow-hidden bg-background w-full"
      style={{ height: '100dvh' }}
      data-testid="app-layout"
    >
      <main
        className={[
          'flex-1 min-h-0 flex flex-col overflow-hidden w-full',
          centered ? 'items-center justify-center' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {noAnimation ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <AnimatedTransition key={location.pathname}>
              {children}
            </AnimatedTransition>
          </AnimatePresence>
        )}
      </main>

      {withSidebar && <FloatingNavHub />}
      <BuzzerBadge />
    </div>
  );
};

export default AppLayout;
