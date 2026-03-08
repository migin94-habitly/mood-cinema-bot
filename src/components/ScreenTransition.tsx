import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types/movie';

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

interface Props {
  screenKey: Screen;
  children: React.ReactNode;
}

export const ScreenTransition: React.FC<Props> = ({ screenKey, children }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={screenKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
