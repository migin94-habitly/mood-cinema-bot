export interface City {
  id: string;
  label: string;
  ticketonSlug?: string; // present = KZ city with cinema support
}

// KZ cities supported by Ticketon
export const KZ_CITIES: City[] = [
  { id: 'almaty', label: 'Алматы', ticketonSlug: 'almaty' },
  { id: 'astana', label: 'Астана', ticketonSlug: 'astana' },
  { id: 'shymkent', label: 'Шымкент', ticketonSlug: 'shymkent' },
  { id: 'karaganda', label: 'Караганда', ticketonSlug: 'karaganda' },
  { id: 'aktobe', label: 'Актобе', ticketonSlug: 'aktobe' },
  { id: 'atyrau', label: 'Атырау', ticketonSlug: 'atyrau' },
  { id: 'aktau', label: 'Актау', ticketonSlug: 'aktau' },
  { id: 'kostanay', label: 'Костанай', ticketonSlug: 'kostanay' },
  { id: 'oskemen', label: 'Усть-Каменогорск', ticketonSlug: 'oskemen' },
  { id: 'pavlodar', label: 'Павлодар', ticketonSlug: 'pavlodar' },
  { id: 'semey', label: 'Семей', ticketonSlug: 'semey' },
  { id: 'taraz', label: 'Тараз', ticketonSlug: 'taraz' },
  { id: 'kyzylorda', label: 'Кызылорда', ticketonSlug: 'kyzylorda' },
  { id: 'oral', label: 'Уральск', ticketonSlug: 'oral' },
  { id: 'taldykorgan', label: 'Талдыкорган', ticketonSlug: 'taldykorgan' },
];

// "Other" = any non-KZ country: AI-only mode, no cinema listings
export const OTHER_CITY: City = { id: 'other', label: 'Другая страна (только ИИ)' };

export const ALL_CITIES: City[] = [...KZ_CITIES, OTHER_CITY];

const STORAGE_KEY = 'cinemate.city';

export function getSavedCity(): City {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return ALL_CITIES.find(c => c.id === id) ?? KZ_CITIES[0];
  } catch {
    return KZ_CITIES[0];
  }
}

export function saveCity(city: City) {
  try { localStorage.setItem(STORAGE_KEY, city.id); } catch {}
}
