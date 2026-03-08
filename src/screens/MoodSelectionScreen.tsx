import React, { useState } from 'react';
import { MOODS } from '@/constants/moods';
import { MoodType } from '@/types/movie';

interface Props {
  onSelectMood: (mood: MoodType) => void;
}

export const MoodSelectionScreen: React.FC<Props> = ({ onSelectMood }) => {
  const [selected, setSelected] = useState<MoodType | null>(null);

  return (
    <div className="h-screen w-full flex flex-col bg-background p-6 pt-4">
      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold mb-2">Как вы себя чувствуете сейчас?</h2>
        <p className="text-muted-foreground text-sm">Выберите настроение для идеального кино</p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pb-32 hide-scrollbar">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => setSelected(mood.id)}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all active:scale-95 border-2 ${
              selected === mood.id 
              ? 'bg-primary/10 border-primary shadow-[0_0_20px_hsla(272,90%,55%,0.2)]' 
              : 'bg-surface/40 border-primary/10 hover:border-primary/40'
            }`}
          >
            <img src={mood.image} alt={mood.label} className="size-16 object-contain mb-1" draggable={false} />
            <span className="font-semibold text-sm">{mood.label}</span>
          </button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background pt-10">
        <button 
          disabled={!selected}
          onClick={() => selected && onSelectMood(selected)}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
            selected 
            ? 'bg-primary text-primary-foreground shadow-primary/20 active:scale-[0.98]' 
            : 'bg-surface text-muted-foreground cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          <span>Подобрать фильм на базе ИИ</span>
        </button>
      </div>
    </div>
  );
};
