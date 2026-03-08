import React, { useEffect, useState } from 'react';
import { MoodType } from '@/types/movie';

interface Props {
  mood: MoodType;
}

export const AIProcessingScreen: React.FC<Props> = ({ mood }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 5 : prev));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-6 bg-background text-center">
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

      <div className="relative w-full max-w-[160px] aspect-[3/4] opacity-60">
        <div className="absolute inset-0 bg-primary/5 rounded-xl border border-border translate-y-4 scale-90" />
        <div className="absolute inset-0 bg-primary/10 rounded-xl border border-border translate-y-2 scale-95" />
        <div className="absolute inset-0 bg-surface rounded-xl border border-primary/30 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-primary border-transparent animate-spin mb-3" />
          <p className="text-[10px] font-medium italic text-muted-foreground">"Подбираем идеальный вариант..."</p>
        </div>
      </div>
    </div>
  );
};
