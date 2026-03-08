import React from 'react';

interface Props {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-between p-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsla(272,90%,55%,0.15),_transparent_60%)]" />
      
      <div className="relative z-10 flex flex-col items-center text-center mt-20">
        <div className="bg-primary/20 border border-primary/30 px-4 py-2 rounded-full mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
          <span className="text-xs font-semibold tracking-wider uppercase text-primary/80">AI Powered</span>
        </div>
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-primary/80 mb-8">Movie Mood</h1>
        <h2 className="text-4xl font-bold leading-tight mb-4">
          Найди <span className="text-primary">Идеальный</span> Фильм
        </h2>
        <p className="text-muted-foreground text-lg max-w-[280px]">
          ИИ-рекомендации на основе твоего настроения.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        <div className="flex justify-center gap-8 opacity-60">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">mood</span>
            <span className="text-[10px] uppercase tracking-widest">Настроение</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">swipe</span>
            <span className="text-[10px] uppercase tracking-widest">Свайп</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">psychology</span>
            <span className="text-[10px] uppercase tracking-widest">AI Подбор</span>
          </div>
        </div>
        <button 
          onClick={onStart}
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-14 rounded-xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
        >
          <span>Начать</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
