import React from 'react';
import { motion } from 'framer-motion';

const BuzzerBadge: React.FC<{ hideOnDesktop?: boolean }> = ({ hideOnDesktop = false }) => (
  <motion.a
    href="/"
    aria-label="Buzzer platform"
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.2, duration: 0.5, ease: 'easeOut' }}
    className={`fixed bottom-5 left-5 z-40 flex items-center gap-2 select-none${hideOnDesktop ? ' md:hidden' : ''}`}
    style={{
      height: 32,
      paddingLeft: 10,
      paddingRight: 14,
      borderRadius: 999,
      background: 'rgba(15,25,35,0.88)',
      border: '1px solid rgba(201,169,110,0.25)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(8px)',
      textDecoration: 'none',
    }}
    whileHover={{
      borderColor: 'rgba(201,169,110,0.55)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.45), 0 0 10px rgba(201,169,110,0.12)',
      transition: { duration: 0.18 },
    }}
  >
    {/* Gold pulse dot */}
    <span className="relative flex items-center justify-center w-3 h-3">
      <motion.span
        className="absolute inline-flex w-full h-full rounded-full"
        style={{ backgroundColor: 'rgba(201,169,110,0.35)' }}
        animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative w-2 h-2 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
    </span>

    {/* Wordmark */}
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(250,250,247,0.7)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      Buzzer
    </span>
  </motion.a>
);

export default BuzzerBadge;
