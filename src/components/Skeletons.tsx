import React from 'react';
import { motion } from 'framer-motion';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent';

export const MovieCardSkeleton: React.FC = () => (
  <div className="w-full max-w-[400px] aspect-[2/3] rounded-2xl border border-border bg-muted/30 overflow-hidden">
    <div className={`w-full h-[60%] bg-muted/50 ${shimmer}`} />
    <div className="p-5 space-y-3">
      <div className={`h-6 w-3/4 bg-muted/50 rounded-lg ${shimmer}`} />
      <div className={`h-4 w-1/2 bg-muted/40 rounded-lg ${shimmer}`} />
      <div className="flex gap-2">
        <div className={`h-6 w-16 bg-muted/40 rounded-md ${shimmer}`} />
        <div className={`h-6 w-16 bg-muted/40 rounded-md ${shimmer}`} />
        <div className={`h-6 w-20 bg-muted/40 rounded-md ${shimmer}`} />
      </div>
      <div className={`h-4 w-full bg-muted/30 rounded-lg ${shimmer}`} />
      <div className={`h-4 w-5/6 bg-muted/30 rounded-lg ${shimmer}`} />
    </div>
  </div>
);

export const WatchlistCardSkeleton: React.FC = () => (
  <div className="space-y-2">
    <div className={`aspect-[2/3] rounded-xl bg-muted/40 ${shimmer}`} />
    <div className={`h-4 w-3/4 bg-muted/40 rounded ${shimmer}`} />
    <div className="flex gap-1">
      <div className={`h-4 w-12 bg-muted/30 rounded ${shimmer}`} />
      <div className={`h-4 w-12 bg-muted/30 rounded ${shimmer}`} />
    </div>
  </div>
);

export const WatchlistSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08, duration: 0.3 }}
      >
        <WatchlistCardSkeleton />
      </motion.div>
    ))}
  </div>
);

export const DiscoverySkeleton: React.FC = () => (
  <div className="h-screen w-full flex flex-col bg-background">
    {/* Header skeleton */}
    <div className="flex items-center justify-between px-6 py-4">
      <div className={`size-10 rounded-full bg-muted/40 ${shimmer}`} />
      <div className="space-y-1.5 flex flex-col items-center">
        <div className={`h-5 w-24 bg-muted/40 rounded ${shimmer}`} />
        <div className={`h-3 w-16 bg-muted/30 rounded ${shimmer}`} />
      </div>
      <div className={`size-10 rounded-full bg-muted/40 ${shimmer}`} />
    </div>
    {/* Card skeleton */}
    <div className="flex-1 flex items-center justify-center px-4">
      <MovieCardSkeleton />
    </div>
    {/* Action buttons skeleton */}
    <div className="flex items-center justify-center gap-10 px-6 py-8">
      <div className={`size-16 rounded-full bg-muted/30 ${shimmer}`} />
      <div className={`size-12 rounded-full bg-muted/30 ${shimmer}`} />
      <div className={`size-16 rounded-full bg-muted/30 ${shimmer}`} />
    </div>
  </div>
);
