import { MoodType } from '@/types/movie';

export interface MoodItem {
  id: MoodType;
  label: string;
  emoji: string;
}

export const MOODS: MoodItem[] = [
  { id: 'Epic', label: 'Эпично', emoji: '💥' },
  { id: 'Romantic', label: 'Романтично', emoji: '❤️' },
  { id: 'Scared', label: 'Страшно', emoji: '😱' },
  { id: 'Funny', label: 'Весело', emoji: '😂' },
  { id: 'Mysterious', label: 'Загадочно', emoji: '🧐' },
  { id: 'Relaxed', label: 'Расслабленно', emoji: '🍿' },
];
