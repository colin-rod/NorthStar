import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type utilities for shadcn/svelte components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithElementRef<T extends Record<string, any>> = T & {
  ref?: HTMLElement | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T extends Record<string, any>> = Omit<T, 'child'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildrenOrChild<T extends Record<string, any>> = Omit<T, 'children' | 'child'>;
