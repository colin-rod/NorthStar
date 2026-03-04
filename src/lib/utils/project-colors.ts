export const PROJECT_COLORS = {
  gray: { bg: 'bg-gray-500', text: 'text-gray-500', hex: '#6b7280' },
  red: { bg: 'bg-red-500', text: 'text-red-500', hex: '#ef4444' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', hex: '#f97316' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-500', hex: '#f59e0b' },
  green: { bg: 'bg-green-600', text: 'text-green-600', hex: '#16a34a' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-500', hex: '#14b8a6' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', hex: '#3b82f6' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-500', hex: '#8b5cf6' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-500', hex: '#ec4899' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', hex: '#f43f5e' },
} as const;

export type ProjectColor = keyof typeof PROJECT_COLORS;

export const DEFAULT_COLOR: ProjectColor = 'gray';

export function getProjectColor(color: string | null | undefined) {
  if (color && color in PROJECT_COLORS) {
    return PROJECT_COLORS[color as ProjectColor];
  }
  return PROJECT_COLORS[DEFAULT_COLOR];
}
