import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  size?: number;
  className?: string;
  duration?: number;
}

/**
 * Premium animated clapperboard logo.
 * Soft glassy body, gold accent, smooth clap with subtle bounce + shimmer.
 */
export const AnimatedClapperboard: React.FC<Props> = ({
  size = 96,
  className = '',
  duration = 2.8,
}) => {
  // Smooth clap: open -> hold -> close (with tiny bounce) -> hold -> open
  const armRotate = [-38, -38, -2, 0, -2, -38];
  const armTimes = [0, 0.35, 0.46, 0.5, 0.55, 1];

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      initial={{ scale: 0.6, opacity: 0, y: 8 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: [0, -3, 0],
        filter: [
          'drop-shadow(0 6px 18px hsla(272,90%,55%,0.25))',
          'drop-shadow(0 10px 28px hsla(272,90%,60%,0.55))',
          'drop-shadow(0 6px 18px hsla(272,90%,55%,0.25))',
        ],
      }}
      transition={{
        scale: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
        opacity: { duration: 0.5 },
        y: { duration, repeat: Infinity, ease: 'easeInOut' },
        filter: { duration, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
          {/* Body — deep violet glass */}
          <linearGradient id="cb-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(275 75% 28%)" />
            <stop offset="0.5" stopColor="hsl(272 80% 22%)" />
            <stop offset="1" stopColor="hsl(268 70% 16%)" />
          </linearGradient>
          {/* Arm — vibrant violet with highlight */}
          <linearGradient id="cb-arm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(280 100% 78%)" />
            <stop offset="0.5" stopColor="hsl(272 95% 62%)" />
            <stop offset="1" stopColor="hsl(268 85% 45%)" />
          </linearGradient>
          {/* Teeth — pearl */}
          <linearGradient id="cb-tooth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(0 0% 100%)" />
            <stop offset="1" stopColor="hsl(270 30% 88%)" />
          </linearGradient>
          {/* Play icon gold */}
          <linearGradient id="cb-play" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(45 100% 75%)" />
            <stop offset="1" stopColor="hsl(36 100% 55%)" />
          </linearGradient>
          {/* Body sheen */}
          <linearGradient id="cb-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
            <stop offset="0.5" stopColor="hsl(0 0% 100%)" stopOpacity="0.18" />
            <stop offset="1" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
          </linearGradient>
          {/* Glow */}
          <radialGradient id="cb-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="hsl(272 95% 65%)" stopOpacity="0.35" />
            <stop offset="1" stopColor="hsl(272 95% 65%)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        <circle cx="60" cy="64" r="56" fill="url(#cb-glow)" />

        {/* Body */}
        <rect x="14" y="48" width="92" height="56" rx="10" fill="url(#cb-body)" />
        {/* Inner highlight border */}
        <rect x="15" y="49" width="90" height="54" rx="9" fill="none" stroke="hsl(280 90% 70%)" strokeOpacity="0.35" strokeWidth="0.8" />

        {/* Play triangle */}
        <g transform="translate(60 78)">
          <circle r="14" fill="hsl(0 0% 0%)" opacity="0.25" />
          <polygon points="-5,-7 -5,7 7,0" fill="url(#cb-play)" />
        </g>

        {/* Body sheen sweep */}
        <motion.rect
          x="14" y="48" width="92" height="56" rx="10"
          fill="url(#cb-sheen)"
          initial={{ x: -90 }}
          animate={{ x: [-90, 100] }}
          transition={{ duration: duration * 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
          style={{ mixBlendMode: 'overlay' as any }}
        />

        {/* Static base bar where teeth sit */}
        <rect x="14" y="40" width="92" height="10" rx="3" fill="hsl(272 35% 14%)" />
        {/* Bottom teeth */}
        <g fill="url(#cb-tooth)">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <polygon
              key={i}
              points={`${18 + i * 13},50 ${24.5 + i * 13},41 ${31 + i * 13},50`}
            />
          ))}
        </g>

        {/* Pivot rivet */}
        <circle cx="18" cy="42" r="2.4" fill="hsl(45 100% 70%)" />
        <circle cx="18" cy="42" r="1" fill="hsl(36 90% 40%)" />

        {/* Animated TOP ARM */}
        <motion.g
          style={{ originX: '18px', originY: '42px' }}
          animate={{ rotate: armRotate }}
          transition={{
            duration,
            repeat: Infinity,
            ease: [0.45, 0, 0.2, 1],
            times: armTimes,
          }}
        >
          <rect x="14" y="24" width="92" height="16" rx="4" fill="url(#cb-arm)" />
          <rect x="14" y="24" width="92" height="3" rx="2" fill="hsl(0 0% 100%)" opacity="0.35" />
          <g fill="url(#cb-tooth)">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <polygon
                key={i}
                points={`${18 + i * 13},24 ${24.5 + i * 13},33 ${31 + i * 13},24`}
              />
            ))}
          </g>
        </motion.g>

        {/* Spark on slam */}
        <motion.g
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0, 1, 0, 0],
            scale: [0.4, 0.4, 1.4, 1.8, 0.4],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeOut',
            times: [0, 0.44, 0.5, 0.62, 1],
          }}
          style={{ originX: '60px', originY: '46px' }}
        >
          <circle cx="60" cy="46" r="3" fill="hsl(45 100% 80%)" />
          <circle cx="60" cy="46" r="8" fill="hsl(45 100% 70%)" opacity="0.35" />
        </motion.g>
      </svg>
    </motion.div>
  );
};
