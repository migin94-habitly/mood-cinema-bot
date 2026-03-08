import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Screen } from '@/types/movie';
import { getTelegramWebApp, haptic } from '@/lib/telegram';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  watchlistCount: number;
  swipeCount: number;
  watchedCount: number;
  onNavigate: (screen: Screen) => void;
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

function getAchievements(swipes: number, watched: number, watchlist: number): Achievement[] {
  return [
    {
      id: 'first_swipe',
      icon: '👆',
      title: 'Первый свайп',
      description: 'Сделай свой первый свайп',
      unlocked: swipes >= 1,
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
      id: 'cinephile',
      icon: '🎬',
      title: 'Синефил',
      description: 'Свайпни 50 фильмов',
      unlocked: swipes >= 50,
      progress: Math.min(swipes / 50, 1),
      progressLabel: `${Math.min(swipes, 50)}/50`,
    },
    {
      id: 'first_like',
      icon: '❤️',
      title: 'Первая любовь',
      description: 'Добавь фильм в шортлист',
      unlocked: watched >= 1,
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
      id: 'addict',
      icon: '🏆',
      title: 'Киноман',
      description: 'Свайпни 100 фильмов',
      unlocked: swipes >= 100,
      progress: Math.min(swipes / 100, 1),
      progressLabel: `${Math.min(swipes, 100)}/100`,
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
  ];
}

function getLevel(watched: number): { level: number; current: number; needed: number } {
  const level = Math.floor(watched / 10) + 1;
  const current = watched % 10;
  return { level, current, needed: 10 };
}

export const ProfileScreen: React.FC<Props> = ({ watchlistCount, swipeCount, watchedCount, onNavigate }) => {
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
    () => getAchievements(swipeCount, watchedCount, watchlistCount),
    [swipeCount, watchedCount, watchlistCount]
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const { level, current, needed } = getLevel(watchedCount);

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
    </div>
  );
};
