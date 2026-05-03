import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Screen } from '@/types/movie';
import { getTelegramWebApp, haptic } from '@/lib/telegram';
import { motion, AnimatePresence } from 'framer-motion';
import type { EngagementStats } from '@/services/engagementService';

interface Props {
  watchlistCount: number;
  swipeCount: number;
  watchedCount: number;
  engagement?: EngagementStats | null;
  isPro?: boolean;
  proExpiresAt?: Date | null;
  onNavigate: (screen: Screen) => void;
  onOpenPaywall?: () => void;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number; // 0-1
  progressLabel?: string;
}

function getAchievements(swipes: number, watched: number, watchlist: number, e?: EngagementStats | null): Achievement[] {
  const streak = e?.currentStreak ?? 0;
  const totalDays = e?.totalDays ?? 0;
  const lateNight = e?.lateNightSessions ?? 0;
  const uniqueMoods = e?.uniqueMoods ?? 0;
  const cinema = e?.cinemaClicks ?? 0;
  const watchedDone = e?.watchedCount ?? 0;
  return [
    {
      id: 'first_swipe',
      icon: '👆',
      title: 'Первый свайп',
      description: 'Сделай свой первый свайп',
      unlocked: swipes >= 1,
    },
    {
      id: 'first_like',
      icon: '❤️',
      title: 'Первая любовь',
      description: 'Добавь фильм в шортлист',
      unlocked: watched >= 1,
    },
    {
      id: 'explorer',
      icon: '🧭',
      title: 'Исследователь',
      description: 'Свайпни 10 фильмов',
      unlocked: swipes >= 10,
      progress: Math.min(swipes / 10, 1),
      progressLabel: `${Math.min(swipes, 10)}/10`,
    },
    {
      id: 'streak_3', icon: '🔥', title: 'Огонёк',
      description: 'Заходи 3 дня подряд', unlocked: streak >= 3,
      progress: Math.min(streak / 3, 1), progressLabel: `${Math.min(streak, 3)}/3`,
    },
    {
      id: 'streak_7', icon: '🔥', title: 'Неделя огня',
      description: 'Заходи 7 дней подряд', unlocked: streak >= 7,
      progress: Math.min(streak / 7, 1), progressLabel: `${Math.min(streak, 7)}/7`,
    },
    {
      id: 'mood_master', icon: '🎭', title: 'Меломан настроений',
      description: 'Попробуй все 6 настроений', unlocked: uniqueMoods >= 6,
      progress: Math.min(uniqueMoods / 6, 1), progressLabel: `${Math.min(uniqueMoods, 6)}/6`,
    },
    {
      id: 'night_owl', icon: '🌙', title: 'Ночной киноман',
      description: '5 сессий после 23:00', unlocked: lateNight >= 5,
      progress: Math.min(lateNight / 5, 1), progressLabel: `${Math.min(lateNight, 5)}/5`,
    },
    {
      id: 'first_cinema', icon: '🎟️', title: 'В кино!',
      description: 'Открой Ticketon из приложения', unlocked: cinema >= 1,
    },
    {
      id: 'cinephile',
      icon: '🎬',
      title: 'Синефил',
      description: 'Свайпни 50 фильмов',
      unlocked: swipes >= 50,
      progress: Math.min(swipes / 50, 1),
      progressLabel: `${Math.min(swipes, 50)}/50`,
    },
    {
      id: 'collector',
      icon: '📚',
      title: 'Коллекционер',
      description: 'Собери 5 фильмов в шортлисте',
      unlocked: watchlist >= 5,
      progress: Math.min(watchlist / 5, 1),
      progressLabel: `${Math.min(watchlist, 5)}/5`,
    },
    {
      id: 'binge',
      icon: '🍿',
      title: 'Марафонец',
      description: 'Лайкни 10 фильмов подряд',
      unlocked: watched >= 10,
      progress: Math.min(watched / 10, 1),
      progressLabel: `${Math.min(watched, 10)}/10`,
    },
    {
      id: 'shortlist_pro', icon: '📝', title: 'Шортлист-эксперт',
      description: 'Посмотри 5 фильмов из шортлиста', unlocked: watchedDone >= 5,
      progress: Math.min(watchedDone / 5, 1), progressLabel: `${Math.min(watchedDone, 5)}/5`,
    },
    {
      id: 'streak_30', icon: '🏆', title: 'Месяц подряд',
      description: 'Streak 30 дней', unlocked: streak >= 30,
      progress: Math.min(streak / 30, 1), progressLabel: `${Math.min(streak, 30)}/30`,
    },
    {
      id: 'addict',
      icon: '🏆',
      title: 'Киноман',
      description: 'Свайпни 100 фильмов',
      unlocked: swipes >= 100,
      progress: Math.min(swipes / 100, 1),
      progressLabel: `${Math.min(swipes, 100)}/100`,
    },
    {
      id: 'swipe_500', icon: '🎯', title: 'Профи',
      description: 'Свайпни 500 фильмов', unlocked: swipes >= 500,
      progress: Math.min(swipes / 500, 1), progressLabel: `${Math.min(swipes, 500)}/500`,
    },
    {
      id: 'swipe_1000', icon: '👑', title: 'Легенда',
      description: 'Свайпни 1000 фильмов', unlocked: swipes >= 1000,
      progress: Math.min(swipes / 1000, 1), progressLabel: `${Math.min(swipes, 1000)}/1000`,
    },
    {
      id: 'curator',
      icon: '🎯',
      title: 'Куратор',
      description: 'Собери 20 фильмов в шортлисте',
      unlocked: watchlist >= 20,
      progress: Math.min(watchlist / 20, 1),
      progressLabel: `${Math.min(watchlist, 20)}/20`,
    },
    {
      id: 'collection_50', icon: '📚', title: 'Архивариус',
      description: '50 фильмов в шортлисте', unlocked: watchlist >= 50,
      progress: Math.min(watchlist / 50, 1), progressLabel: `${Math.min(watchlist, 50)}/50`,
    },
    {
      id: 'cinema_10', icon: '🎫', title: 'Кинозритель',
      description: '10 переходов на Ticketon', unlocked: cinema >= 10,
      progress: Math.min(cinema / 10, 1), progressLabel: `${Math.min(cinema, 10)}/10`,
    },
    {
      id: 'days_100', icon: '💎', title: '100 дней',
      description: 'Используй приложение 100 дней', unlocked: totalDays >= 100,
      progress: Math.min(totalDays / 100, 1), progressLabel: `${Math.min(totalDays, 100)}/100`,
    },
  ];
}

function getLevel(watched: number): { level: number; current: number; needed: number } {
  const level = Math.floor(watched / 10) + 1;
  const current = watched % 10;
  return { level, current, needed: 10 };
}

// Confetti particle component
const PARTICLE_COLORS = [
  'hsl(272, 90%, 55%)', // primary
  'hsl(280, 80%, 65%)', // purple
  'hsl(45, 100%, 60%)', // gold
  'hsl(340, 80%, 55%)', // pink
  'hsl(200, 90%, 55%)', // blue
  'hsl(140, 70%, 50%)', // green
];

const ConfettiParticle: React.FC<{ delay: number; x: number }> = ({ delay, x }) => {
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  const size = 4 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size * (0.5 + Math.random() * 0.8),
        backgroundColor: color,
        left: `${x}%`,
        top: '50%',
      }}
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -80 - Math.random() * 120, 60 + Math.random() * 80],
        x: [-20 + Math.random() * 40, -40 + Math.random() * 80],
        rotate: [0, rotation, rotation * 2],
        scale: [0, 1.2, 0.5],
      }}
      transition={{
        duration: 1.2 + Math.random() * 0.6,
        delay: delay,
        ease: 'easeOut',
      }}
    />
  );
};

const CelebrationOverlay: React.FC<{ achievement: Achievement; onDone: () => void }> = ({ achievement, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.3,
      x: 20 + Math.random() * 60,
    })), []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <motion.div
        className="relative flex flex-col items-center z-10"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
      >
        {/* Confetti particles */}
        <div className="absolute inset-0 overflow-visible">
          {particles.map(p => (
            <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
          ))}
        </div>

        {/* Glow ring */}
        <motion.div
          className="size-24 rounded-full flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, hsl(272, 90%, 55%), hsl(280, 80%, 65%))',
            boxShadow: '0 0 40px hsla(272, 90%, 55%, 0.5), 0 0 80px hsla(272, 90%, 55%, 0.2)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.5, times: [0, 0.6, 1] }}
        >
          <span className="text-4xl">{achievement.icon}</span>
        </motion.div>

        <motion.p
          className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Достижение разблокировано!
        </motion.p>

        <motion.h3
          className="text-xl font-black text-foreground mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {achievement.title}
        </motion.h3>

        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {achievement.description}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export const ProfileScreen: React.FC<Props> = ({ watchlistCount, swipeCount, watchedCount, engagement, isPro, proExpiresAt, onNavigate, onOpenPaywall }) => {
  const tgUser = useMemo(() => {
    const tg = getTelegramWebApp();
    return tg?.initDataUnsafe?.user ?? null;
  }, []);

  const displayName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    : 'Киноман';
  const username = tgUser?.username ? `@${tgUser.username}` : '@movie_mood_user';
  const avatarUrl = tgUser?.photo_url || 'https://picsum.photos/seed/user/200/200';

  const achievements = useMemo(
    () => getAchievements(swipeCount, watchedCount, watchlistCount, engagement),
    [swipeCount, watchedCount, watchlistCount, engagement]
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const { level, current, needed } = getLevel(watchedCount);

  // Track newly unlocked achievements
  const [celebratingAch, setCelebratingAch] = useState<Achievement | null>(null);
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const storageKey = 'seen_achievements';
    const seen = new Set<string>(JSON.parse(localStorage.getItem(storageKey) || '[]'));
    const newlyUnlocked = achievements.filter(a => a.unlocked && !seen.has(a.id));

    if (newlyUnlocked.length > 0 && prevUnlockedRef.current.size > 0) {
      // Only celebrate if we've initialized before (not first load)
      haptic.success();
      setCelebratingAch(newlyUnlocked[0]);
    }

    // Save current state
    const currentUnlocked = achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem(storageKey, JSON.stringify(currentUnlocked));
    prevUnlockedRef.current = new Set(currentUnlocked);
  }, [achievements]);

  // On first mount, seed prevUnlockedRef
  useEffect(() => {
    const storageKey = 'seen_achievements';
    const seen = JSON.parse(localStorage.getItem(storageKey) || '[]');
    prevUnlockedRef.current = new Set(seen);
  }, []);

  const handleCelebrationDone = useCallback(() => setCelebratingAch(null), []);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-y-auto">
      {/* Compact header */}
      <header className="sticky top-0 z-30 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => onNavigate('DISCOVERY')} className="size-9 rounded-full hover:bg-muted flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="text-base font-bold flex-1">Профиль</h1>
      </header>

      <div className="px-4 pb-6">
        {/* Profile card — compact row */}
        <motion.div
          className="flex items-center gap-4 py-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative shrink-0">
            <div className="size-16 rounded-full p-0.5 bg-gradient-to-tr from-primary to-purple-400">
              <div
                className="size-full rounded-full border-2 border-background bg-cover bg-center"
                style={{ backgroundImage: `url('${avatarUrl}')` }}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{displayName}</h2>
            <p className="text-primary text-sm font-medium">{username}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">Уровень</div>
            <div className="text-2xl font-black text-primary">{level}</div>
          </div>
        </motion.div>

        {/* Level progress */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-muted-foreground font-bold uppercase tracking-widest">Прогресс уровня</span>
            <span className="font-bold">{current}/{needed}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(current / needed) * 100}%` }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ boxShadow: '0 0 8px hsla(272, 90%, 55%, 0.4)' }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Лайкни ещё {needed - current} фильмов до уровня {level + 1}
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-3 gap-2 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {[
            { value: swipeCount, label: 'Свайпов', icon: 'swipe' },
            { value: watchedCount, label: 'Лайков', icon: 'favorite' },
            { value: watchlistCount, label: 'В списке', icon: 'bookmark' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface/50 border border-border rounded-xl p-3 text-center">
              <span className="material-symbols-outlined text-primary text-lg mb-0.5 block">{stat.icon}</span>
              <span className="text-xl font-black block">{stat.value}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          className="flex gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => onNavigate('WATCHLIST')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-lg">bookmark</span>
            Шортлист
          </button>
          <button
            onClick={() => onNavigate('MOOD_GRID')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface/50 border border-border text-sm font-bold active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-lg">movie_filter</span>
            Новый подбор
          </button>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold">Достижения</h3>
            <span className="text-xs text-primary font-bold">{unlockedCount}/{achievements.length}</span>
          </div>

          <div className="space-y-2">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  ach.unlocked
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-surface/30 border-border opacity-60'
                }`}
              >
                <div
                  className={`size-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    ach.unlocked
                      ? 'bg-gradient-to-br from-primary to-purple-500 shadow-md shadow-primary/20'
                      : 'bg-muted'
                  }`}
                >
                  {ach.unlocked ? (
                    <span>{ach.icon}</span>
                  ) : (
                    <span className="material-symbols-outlined text-muted-foreground text-lg">lock</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{ach.title}</p>
                    {ach.unlocked && (
                      <span className="material-symbols-outlined text-primary text-sm fill-1">verified</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{ach.description}</p>
                  {!ach.unlocked && ach.progress !== undefined && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/50 rounded-full"
                          style={{ width: `${ach.progress * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">{ach.progressLabel}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebratingAch && (
          <CelebrationOverlay achievement={celebratingAch} onDone={handleCelebrationDone} />
        )}
      </AnimatePresence>
    </div>
  );
};
