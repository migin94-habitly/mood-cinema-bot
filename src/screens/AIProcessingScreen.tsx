import React, { useEffect, useState } from 'react';
import { MoodType } from '@/types/movie';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedClapperboard } from '@/components/AnimatedClapperboard';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  mood: MoodType;
}

type Poster = { title: string; poster: string; year?: string };

// Fallback gradient cards if TMDB fails — never block the UI.
const FALLBACK: Record<MoodType, Array<{ emoji: string; title: string; gradient: string }>> = {
  Epic: [
    { emoji: '🚀', title: 'Interstellar',  gradient: 'from-indigo-900 via-violet-900 to-black' },
    { emoji: '🏜️', title: 'Dune',          gradient: 'from-amber-900 via-orange-800 to-stone-900' },
    { emoji: '⚔️', title: 'Gladiator',     gradient: 'from-red-900 via-stone-800 to-black' },
    { emoji: '🌀', title: 'Inception',     gradient: 'from-slate-800 via-blue-950 to-black' },
  ],
  Romantic: [
    { emoji: '💃', title: 'La La Land',    gradient: 'from-pink-700 via-rose-800 to-purple-900' },
    { emoji: '💌', title: 'The Notebook',  gradient: 'from-rose-800 via-red-900 to-stone-900' },
    { emoji: '⏳', title: 'About Time',    gradient: 'from-fuchsia-800 via-purple-900 to-indigo-900' },
    { emoji: '🚢', title: 'Titanic',       gradient: 'from-blue-900 via-slate-800 to-black' },
  ],
  Scared: [
    { emoji: '🤡', title: 'IT',            gradient: 'from-red-950 via-stone-900 to-black' },
    { emoji: '🪓', title: 'The Shining',   gradient: 'from-stone-800 via-red-900 to-black' },
    { emoji: '👁️', title: 'Hereditary',    gradient: 'from-amber-950 via-stone-900 to-black' },
    { emoji: '👻', title: 'The Conjuring', gradient: 'from-zinc-900 via-stone-900 to-black' },
  ],
  Funny: [
    { emoji: '🎉', title: 'Hangover',      gradient: 'from-yellow-700 via-orange-700 to-red-800' },
    { emoji: '🍕', title: 'Superbad',      gradient: 'from-amber-700 via-yellow-800 to-orange-900' },
    { emoji: '🛎️', title: 'Grand Budapest',gradient: 'from-pink-600 via-rose-700 to-purple-800' },
    { emoji: '🏠', title: 'Home Alone',    gradient: 'from-emerald-800 via-red-800 to-stone-900' },
  ],
  Mysterious: [
    { emoji: '🏝️', title: 'Shutter Island',gradient: 'from-slate-800 via-stone-900 to-black' },
    { emoji: '🥊', title: 'Fight Club',    gradient: 'from-stone-800 via-amber-950 to-black' },
    { emoji: '🔪', title: 'Se7en',         gradient: 'from-zinc-900 via-stone-900 to-black' },
    { emoji: '🪜', title: 'Parasite',      gradient: 'from-emerald-900 via-stone-900 to-black' },
  ],
  Relaxed: [
    { emoji: '🪶', title: 'Forrest Gump',  gradient: 'from-sky-800 via-emerald-800 to-stone-800' },
    { emoji: '🎷', title: 'Soul',          gradient: 'from-indigo-700 via-violet-800 to-fuchsia-900' },
    { emoji: '🛼', title: 'Walter Mitty',  gradient: 'from-cyan-800 via-blue-900 to-slate-900' },
    { emoji: '🍳', title: 'Chef',          gradient: 'from-orange-700 via-amber-800 to-red-900' },
  ],
};

// In-memory + sessionStorage cache for TMDB posters per mood.
const memCache = new Map<string, Poster[]>();
const CACHE_KEY = (mood: string) => `mm_posters_${mood}`;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

function loadCachedPosters(mood: string): Poster[] | null {
  if (memCache.has(mood)) return memCache.get(mood)!;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY(mood));
    if (!raw) return null;
    const { ts, posters } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    memCache.set(mood, posters);
    return posters;
  } catch { return null; }
}

function saveCachedPosters(mood: string, posters: Poster[]) {
  memCache.set(mood, posters);
  try { sessionStorage.setItem(CACHE_KEY(mood), JSON.stringify({ ts: Date.now(), posters })); } catch {}
}

export const AIProcessingScreen: React.FC<Props> = ({ mood }) => {
  const [progress, setProgress] = useState(0);
  const [posterIndex, setPosterIndex] = useState(0);
  const [posters, setPosters] = useState<Poster[]>(() => loadCachedPosters(mood) || []);
  const fallback = FALLBACK[mood] ?? FALLBACK.Epic;

  // Fetch TMDB posters via edge function (cached + sessionStorage). Preload imgs for smooth carousel.
  useEffect(() => {
    if (posters.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const base = import.meta.env.VITE_SUPABASE_URL;
        const url = `${base}/functions/v1/tmdb-posters?mood=${mood}&limit=12`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const j = await res.json();
        if (!cancelled && j?.posters?.length) {
          setPosters(j.posters);
          saveCachedPosters(mood, j.posters);
          j.posters.forEach((p: Poster) => { const img = new Image(); img.src = p.poster; });
        }
      } catch {/* ignore */}
    })();
    return () => { cancelled = true; };
  }, [mood, posters.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 5 : prev));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const total = posters.length || fallback.length;
    const timer = setInterval(() => {
      setPosterIndex(prev => (prev + 1) % total);
    }, 1400);
    return () => clearInterval(timer);
  }, [posters.length, fallback.length]);

  const useTmdb = posters.length > 0;
  const currentTmdb = useTmdb ? posters[posterIndex % posters.length] : null;
  const currentFb = !useTmdb ? fallback[posterIndex % fallback.length] : null;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-6 bg-background text-center">
      <AnimatedClapperboard size={96} className="mb-4" duration={1.6} />
      <div className="bg-primary/20 border border-primary/40 px-4 py-1.5 rounded-full mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
        <span className="text-xs font-semibold tracking-wide uppercase">Mood: {mood}</span>
      </div>

      <h2 className="text-xl font-bold mb-2">Анализируем настроение...</h2>
      <p className="text-muted-foreground text-xs mb-8">Подбираем идеальные фильмы для вашего настроения</p>

      <div className="w-full max-w-[200px] mb-10">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Processing</span>
          <span className="text-xs font-bold">{Math.floor(progress)}%</span>
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300" 
            style={{ width: `${progress}%`, boxShadow: '0 0 12px hsla(272, 90%, 55%, 0.5)' }} 
          />
        </div>
      </div>

      <div className="relative w-full max-w-[160px] aspect-[3/4]">
        <div className="absolute inset-0 bg-primary/5 rounded-xl border border-border translate-y-4 scale-90" />
        <div className="absolute inset-0 bg-primary/10 rounded-xl border border-border translate-y-2 scale-95" />
        <div className="absolute inset-0 rounded-xl border border-primary/30 overflow-hidden shadow-[0_8px_30px_hsla(272,90%,55%,0.2)]">
          <AnimatePresence mode="wait">
            {useTmdb && currentTmdb ? (
              <motion.img
                key={`t-${posterIndex}-${currentTmdb.poster}`}
                src={currentTmdb.poster}
                alt={currentTmdb.title}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45 }}
              />
            ) : (
              <motion.div
                key={`f-${posterIndex}`}
                className={`absolute inset-0 bg-gradient-to-br ${currentFb!.gradient} flex flex-col items-center justify-center gap-3`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-6xl drop-shadow-2xl">{currentFb!.emoji}</span>
                <span className="text-sm font-extrabold tracking-tight text-white/95 px-3 text-center">
                  {currentFb!.title}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent flex items-end justify-center pb-3 pointer-events-none">
            <p className="text-[10px] font-medium italic text-foreground/80 truncate max-w-[140px]">
              {useTmdb && currentTmdb ? `«${currentTmdb.title}»` : 'Подбираем идеальный вариант...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
