import { MoodType } from '@/types/movie';
import moodEpic from '@/assets/mood-epic.png';
import moodRomantic from '@/assets/mood-romantic.png';
import moodScared from '@/assets/mood-scared.png';
import moodFunny from '@/assets/mood-funny.png';
import moodMysterious from '@/assets/mood-mysterious.png';
import moodRelaxed from '@/assets/mood-relaxed.png';

export interface MoodItem {
  id: MoodType;
  label: string;
  emoji: string;
  image: string;
}

export const MOODS: MoodItem[] = [
  { id: 'Epic', label: 'Эпично', emoji: '💥', image: moodEpic },
  { id: 'Romantic', label: 'Романтично', emoji: '❤️', image: moodRomantic },
  { id: 'Scared', label: 'Страшно', emoji: '😱', image: moodScared },
  { id: 'Funny', label: 'Весело', emoji: '😂', image: moodFunny },
  { id: 'Mysterious', label: 'Загадочно', emoji: '🧐', image: moodMysterious },
  { id: 'Relaxed', label: 'Расслабленно', emoji: '🍿', image: moodRelaxed },
];
