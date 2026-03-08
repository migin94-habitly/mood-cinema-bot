// Platform brand colors (HSL format for consistency)
const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'netflix': { bg: 'rgba(229, 9, 20, 0.15)', text: '#E50914', border: 'rgba(229, 9, 20, 0.3)' },
  'apple tv+': { bg: 'rgba(255, 255, 255, 0.1)', text: '#A1A1A6', border: 'rgba(255, 255, 255, 0.2)' },
  'hbo max': { bg: 'rgba(88, 34, 180, 0.15)', text: '#9B6BFF', border: 'rgba(88, 34, 180, 0.3)' },
  'hbo': { bg: 'rgba(88, 34, 180, 0.15)', text: '#9B6BFF', border: 'rgba(88, 34, 180, 0.3)' },
  'amazon prime video': { bg: 'rgba(0, 168, 225, 0.15)', text: '#00A8E1', border: 'rgba(0, 168, 225, 0.3)' },
  'amazon prime': { bg: 'rgba(0, 168, 225, 0.15)', text: '#00A8E1', border: 'rgba(0, 168, 225, 0.3)' },
  'disney+': { bg: 'rgba(17, 60, 207, 0.15)', text: '#6B9FFF', border: 'rgba(17, 60, 207, 0.3)' },
  'hdrezka': { bg: 'rgba(76, 175, 80, 0.15)', text: '#4CAF50', border: 'rgba(76, 175, 80, 0.3)' },
  'кинопоиск hd': { bg: 'rgba(255, 102, 0, 0.15)', text: '#FF6600', border: 'rgba(255, 102, 0, 0.3)' },
  'кинопоиск': { bg: 'rgba(255, 102, 0, 0.15)', text: '#FF6600', border: 'rgba(255, 102, 0, 0.3)' },
  'okko': { bg: 'rgba(148, 103, 255, 0.15)', text: '#9467FF', border: 'rgba(148, 103, 255, 0.3)' },
  'ivi': { bg: 'rgba(234, 51, 96, 0.15)', text: '#EA3360', border: 'rgba(234, 51, 96, 0.3)' },
  'wink': { bg: 'rgba(108, 92, 231, 0.15)', text: '#6C5CE7', border: 'rgba(108, 92, 231, 0.3)' },
  'hulu': { bg: 'rgba(28, 231, 131, 0.15)', text: '#1CE783', border: 'rgba(28, 231, 131, 0.3)' },
  'paramount+': { bg: 'rgba(0, 100, 255, 0.15)', text: '#4D94FF', border: 'rgba(0, 100, 255, 0.3)' },
};

export function getPlatformStyle(platform: string): React.CSSProperties {
  const key = platform.toLowerCase();
  const colors = PLATFORM_COLORS[key] || { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' };
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    borderColor: colors.border,
  };
}

// IMDB brand: gold/yellow
export const IMDB_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(245, 197, 24, 0.15)',
  color: '#F5C518',
  borderColor: 'rgba(245, 197, 24, 0.3)',
};

// Kinopoisk brand: orange
export const KP_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(255, 102, 0, 0.15)',
  color: '#FF6600',
  borderColor: 'rgba(255, 102, 0, 0.3)',
};
