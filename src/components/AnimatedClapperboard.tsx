import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  size?: number;
  className?: string;
  /** Speed (seconds per full clap cycle) */
  duration?: number;
}

/**
 * Animated clapperboard that "claps" like a real film slate:
 * the top stripe arm rotates down and snaps onto the body.
 */
export const AnimatedClapperboard: React.FC<Props> = ({
  size = 96,
  className = '',
  duration = 2.4,
}) => {
  // Snap timing: open → hold → SLAM closed → hold closed → open again
  const armKeyframes = {
    rotate: [-32, -32, 0, 0, -32],
  };
  const armTimes = [0, 0.35, 0.45, 0.85, 1];

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [1, 1.04, 1],
        opacity: 1,
        filter: [
          'drop-shadow(0 0 0px hsla(272,90%,55%,0))',
          'drop-shadow(0 0 18px hsla(272,90%,55%,0.55))',
          'drop-shadow(0 0 0px hsla(272,90%,55%,0))',
        ],
      }}
      transition={{
        scale: { duration, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] },
        filter: { duration, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] },
        opacity: { duration: 0.5 },
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <linearGradient id="clap-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(272 90% 60%)" />
            <stop offset="1" stopColor="hsl(272 70% 38%)" />
          </linearGradient>
          <linearGradient id="clap-arm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(272 95% 70%)" />
            <stop offset="1" stopColor="hsl(272 85% 50%)" />
          </linearGradient>
        </defs>

        {/* Body */}
        <rect x="10" y="42" width="80" height="48" rx="6" fill="url(#clap-body)" />
        {/* Body diagonal stripes */}
        <g opacity="0.25" fill="hsl(0 0% 100%)">
          <polygon points="14,90 30,90 60,42 44,42" />
          <polygon points="48,90 64,90 90,42 78,42 78,55" />
        </g>

        {/* Static base of the clapper (the bottom row of teeth) */}
        <rect x="10" y="34" width="80" height="10" rx="2" fill="hsl(272 30% 18%)" />
        {/* Bottom teeth (white triangles pointing up) */}
        <g fill="hsl(0 0% 98%)">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <polygon
              key={i}
              points={`${14 + i * 13},44 ${20 + i * 13},36 ${26 + i * 13},44`}
            />
          ))}
        </g>

        {/* Pivot dot */}
        <circle cx="14" cy="36" r="2.2" fill="hsl(272 95% 80%)" />

        {/* Animated TOP ARM — rotates around left pivot to "clap" */}
        <motion.g
          style={{ originX: '14px', originY: '36px' }}
          animate={armKeyframes}
          transition={{
            duration,
            repeat: Infinity,
            ease: [0.25, 1, 0.5, 1],
            times: armTimes,
          }}
        >
          <rect x="10" y="22" width="80" height="14" rx="3" fill="url(#clap-arm)" />
          {/* Top teeth (white triangles pointing down) */}
          <g fill="hsl(0 0% 98%)">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <polygon
                key={i}
                points={`${14 + i * 13},22 ${20 + i * 13},30 ${26 + i * 13},22`}
              />
            ))}
          </g>
        </motion.g>

        {/* Spark on slam */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0, 0] }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeOut',
            times: [0, 0.42, 0.46, 0.58, 1],
          }}
        >
          <circle cx="50" cy="38" r="3" fill="hsl(45 100% 70%)" />
          <circle cx="50" cy="38" r="6" fill="hsl(45 100% 70%)" opacity="0.4" />
        </motion.g>
      </svg>
    </motion.div>
  );
};
