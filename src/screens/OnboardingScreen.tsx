import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedClapperboard } from '@/components/AnimatedClapperboard';
import { haptic } from '@/lib/telegram';
import { trackEvent } from '@/services/analyticsService';

interface Props {
  onFinish: () => void;
}

const SLIDES = [
  {
    icon: 'mood',
    emoji: '🎭',
    title: 'Выбери настроение',
    description: 'Скажи, чего хочется сейчас — эпика, романтики, страха или смеха. Мы поймём.',
    color: 'hsla(272, 90%, 55%, 0.25)',
  },
  {
    icon: 'auto_awesome',
    emoji: '🤖',
    title: 'AI подберёт фильмы',
    description: 'Gemini анализирует тысячи фильмов и сериалов и собирает персональную подборку.',
    color: 'hsla(190, 90%, 55%, 0.25)',
  },
  {
    icon: 'swipe',
    emoji: '👆',
    title: 'Свайп: нравится / пропуск',
    description: 'Влево — пропустить, вправо — добавить в список. Tinder, но для кино.',
    color: 'hsla(330, 90%, 60%, 0.25)',
  },
  {
    icon: 'movie',
    emoji: '🎬',
    title: 'Кино рядом + стриминги',
    description: 'Сеансы в кинотеатрах Казахстана и ссылки на стриминги — всё в одном месте.',
    color: 'hsla(45, 95%, 55%, 0.25)',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  const next = () => {
    haptic.light();
    if (isLast) {
      trackEvent('onboarding_complete');
      onFinish();
    } else {
      trackEvent('onboarding_step', { step: step + 1 });
      setStep(s => s + 1);
    }
  };

  const skip = () => {
    haptic.light();
    trackEvent('onboarding_skip', { step });
    onFinish();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background relative overflow-hidden">
      <motion.div
        key={`bg-${step}`}
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ background: `radial-gradient(ellipse at top, ${slide.color}, transparent 65%)` }}
      />

      {/* Top: skip + progress dots */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full bg-muted overflow-hidden"
              animate={{ width: i === step ? 28 : 8 }}
              transition={{ duration: 0.3 }}
            >
              {i === step && (
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.4 }}
                />
              )}
              {i < step && <div className="h-full w-full bg-primary/60" />}
            </motion.div>
          ))}
        </div>
        {!isLast && (
          <button
            onClick={skip}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Пропустить
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center"
          >
            {step === 0 ? (
              <AnimatedClapperboard size={112} className="mb-8" duration={2.2} />
            ) : (
              <motion.div
                className="size-28 rounded-3xl glass border border-primary/30 flex items-center justify-center mb-8 shadow-2xl shadow-primary/10"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-6xl">{slide.emoji}</span>
              </motion.div>
            )}

            <h2 className="text-3xl font-extrabold leading-tight mb-4 max-w-[300px]">
              {slide.title}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-[300px]">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div
        className="relative z-10 px-6 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
      >
        <button
          onClick={next}
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-14 rounded-2xl transition-all shadow-xl shadow-primary/30 active:scale-[0.98]"
        >
          <span>{isLast ? 'Поехали!' : 'Далее'}</span>
          <span className="material-symbols-outlined">{isLast ? 'rocket_launch' : 'arrow_forward'}</span>
        </button>
      </div>
    </div>
  );
};
