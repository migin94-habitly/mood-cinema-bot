import React from 'react';
import { Screen } from '@/types/movie';

interface Props {
  watchlistCount: number;
  onNavigate: (screen: Screen) => void;
}

export const ProfileScreen: React.FC<Props> = ({ watchlistCount, onNavigate }) => {
  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">movie_filter</span>
          <h1 className="text-lg font-bold tracking-tight">Movie Mood</h1>
        </div>
        <button className="size-10 rounded-full hover:bg-muted flex items-center justify-center">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <section className="flex flex-col items-center px-6 py-10">
          <div className="relative">
            <div className="size-28 rounded-full p-1 bg-gradient-to-tr from-primary to-purple-400">
              <div className="size-full rounded-full border-4 border-background bg-cover bg-center" style={{ backgroundImage: `url('https://picsum.photos/seed/user/200/200')` }} />
            </div>
            <div className="absolute bottom-1 right-1 bg-primary size-7 rounded-full border-2 border-background flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-primary-foreground">edit</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold">Александр</h2>
            <p className="text-primary font-medium">@alex_movie_mood</p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full mt-10">
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">420</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Свайпов</span>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">56</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Смотрел</span>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{watchlistCount}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-1 text-center">В списке</span>
            </div>
          </div>
        </section>

        <section className="mt-4 px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Достижения</h3>
            <span className="text-primary text-sm font-bold">Все</span>
          </div>
          <div className="bg-gradient-to-br from-surface to-background border border-border rounded-2xl p-5 relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="size-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-primary-foreground text-3xl">military_tech</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">Киноман 2-го уровня</p>
                <p className="text-[11px] text-muted-foreground mb-3">До следующего уровня осталось 4 фильма</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%] rounded-full shadow-[0_0_8px_hsla(272,90%,55%,0.4)]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-nav border-t border-border pb-10 pt-4 px-10 flex justify-between items-center">
        <button onClick={() => onNavigate('DISCOVERY')} className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="material-symbols-outlined text-2xl">explore</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Поиск</span>
        </button>
        <button onClick={() => onNavigate('WATCHLIST')} className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="material-symbols-outlined text-2xl">bookmark</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Список</span>
        </button>
        <button onClick={() => onNavigate('PROFILE')} className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined text-2xl fill-1">account_circle</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Профиль</span>
        </button>
      </nav>
    </div>
  );
};
