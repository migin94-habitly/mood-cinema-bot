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
    <div className="h-screen w-full flex flex-col items-center px-8 pt-20 bg-background text-center">
      <div className="bg-primary/20 border border-primary/40 px-5 py-2 rounded-full mb-10 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
        <span className="text-sm font-semibold tracking-wide uppercase">Mood: {mood}</span>
      </div>

      <h2 className="text-2xl font-bold mb-3">Анализируем настроение...</h2>
      <p className="text-muted-foreground text-sm mb-12">Подбираем идеальные фильмы для вашего настроения</p>

      <div className="w-full max-w-xs mb-16">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Processing</span>
          <span className="text-sm font-bold">{Math.floor(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300" 
            style={{ width: `${progress}%`, boxShadow: '0 0 15px hsla(272, 90%, 55%, 0.5)' }} 
          />
        </div>
      </div>

      <div className="relative w-full max-w-[240px] aspect-[2/3] opacity-60">
        <div className="absolute inset-0 bg-primary/5 rounded-2xl border border-border translate-y-6 scale-90" />
        <div className="absolute inset-0 bg-primary/10 rounded-2xl border border-border translate-y-3 scale-95" />
        <div className="absolute inset-0 bg-surface rounded-2xl border border-primary/30 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-full border-2 border-t-primary border-transparent animate-spin mb-4" />
          <p className="text-xs font-medium italic text-muted-foreground">"Подбираем идеальный вариант..."</p>
        </div>
      </div>
    </div>
  );
};
