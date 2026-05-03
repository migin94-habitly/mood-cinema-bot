import React, { useEffect, useState } from 'react';
import { MoodType } from '@/types/movie';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface Props {
  mood: MoodType;
}

const MOOD_POSTERS: Record<MoodType, string[]> = {
  Epic: [
    'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // Interstellar
    'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', // Dune
    'https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg', // Gladiator
    'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', // Inception
  ],
  Romantic: [
    'https://image.tmdb.org/t/p/w500/5kBO4mBLUJPojsJMYTGazMl8LQ8.jpg', // La La Land
    'https://image.tmdb.org/t/p/w500/rULWuutDcN5NvtiZi4FRPzRYWSh.jpg', // Notebook
    'https://image.tmdb.org/t/p/w500/3JnCL3EvL9g2Dv9RHLImwmBYXpv.jpg', // About Time
    'https://image.tmdb.org/t/p/w500/sdEOH0992YZ0QSxgXNIGLq1ToUi.jpg', // Titanic
  ],
  Scared: [
    'https://image.tmdb.org/t/p/w500/4LKhBFYBIEFCWIVDk2TtMLzTT0V.jpg', // It
    'https://image.tmdb.org/t/p/w500/lr3cYNDlJcpT1EWzFH42aSIvkab.jpg', // Shining
    'https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg', // Hereditary
    'https://image.tmdb.org/t/p/w500/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg', // Conjuring
  ],
  Funny: [
    'https://image.tmdb.org/t/p/w500/feSiISwgEpVzR1v3zv2n2AU4ANJ.jpg', // Hangover
    'https://image.tmdb.org/t/p/w500/bXGeGKdBLAL1n2BgLGsRniEhOjB.jpg', // Superbad
    'https://image.tmdb.org/t/p/w500/dTFnU3EQB8AplqFEJMgYfaqvpBj.jpg', // Grand Budapest
    'https://image.tmdb.org/t/p/w500/rR5ElJMn6kal7asLiNVNlXKTtbT.jpg', // Home Alone
  ],
  Mysterious: [
    'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', // Shutter Island
    'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club
    'https://image.tmdb.org/t/p/w500/dMOpdkrDC5dQxqNydgKxXjBKyAc.jpg', // Se7en
    'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
  ],
  Relaxed: [
    'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', // Forrest Gump
    'https://image.tmdb.org/t/p/w500/yPisjyLweCl1tbUwN1EpNnNlXJo.jpg', // Soul
    'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', // Secret Life Walter Mitty
    'https://image.tmdb.org/t/p/w500/sNert0FGMpWEGbnrGaRTyMOeKtI.jpg', // Chef
  ],
};

export const AIProcessingScreen: React.FC<Props> = ({ mood }) => {
  const [progress, setProgress] = useState(0);
  const [posterIndex, setPosterIndex] = useState(0);
  const posters = MOOD_POSTERS[mood] ?? MOOD_POSTERS.Epic;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 5 : prev));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPosterIndex(prev => (prev + 1) % posters.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [posters.length]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-6 bg-background text-center">
      <motion.img 
        src={logo} 
        alt="Movie Mood" 
        className="size-24 mb-4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: 360,
          opacity: 1,
          filter: [
            'drop-shadow(0 0 0px hsla(272,90%,55%,0))',
            'drop-shadow(0 0 22px hsla(272,90%,55%,0.7))',
            'drop-shadow(0 0 0px hsla(272,90%,55%,0))',
          ],
        }}
        transition={{
          rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
          filter: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.5 },
        }}
      />
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
        <div className="absolute inset-0 rounded-xl border border-primary/30 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={posterIndex}
              src={posters[posterIndex]}
              alt="Movie poster"
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              draggable={false}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30 flex items-end justify-center pb-4">
            <p className="text-[10px] font-medium italic text-foreground/70">"Подбираем идеальный вариант..."</p>
          </div>
        </div>
      </div>
    </div>
  );
};
