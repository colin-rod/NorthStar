import type { IconProps } from '@lucide/svelte';
import Award from '@lucide/svelte/icons/award';
import Book from '@lucide/svelte/icons/book';
import Box from '@lucide/svelte/icons/box';
import Brain from '@lucide/svelte/icons/brain';
import Briefcase from '@lucide/svelte/icons/briefcase';
import Cloud from '@lucide/svelte/icons/cloud';
import Code from '@lucide/svelte/icons/code';
import Coffee from '@lucide/svelte/icons/coffee';
import Cpu from '@lucide/svelte/icons/cpu';
import Database from '@lucide/svelte/icons/database';
import Dumbbell from '@lucide/svelte/icons/dumbbell';
import Flag from '@lucide/svelte/icons/flag';
import Folder from '@lucide/svelte/icons/folder';
import Globe from '@lucide/svelte/icons/globe';
import GraduationCap from '@lucide/svelte/icons/graduation-cap';
import Hammer from '@lucide/svelte/icons/hammer';
import Heart from '@lucide/svelte/icons/heart';
import Home from '@lucide/svelte/icons/home';
import Layers from '@lucide/svelte/icons/layers';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import Map from '@lucide/svelte/icons/map';
import Music from '@lucide/svelte/icons/music';
import Package from '@lucide/svelte/icons/package';
import Palette from '@lucide/svelte/icons/palette';
import Rocket from '@lucide/svelte/icons/rocket';
import Server from '@lucide/svelte/icons/server';
import Settings from '@lucide/svelte/icons/settings';
import Shield from '@lucide/svelte/icons/shield';
import Smartphone from '@lucide/svelte/icons/smartphone';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Star from '@lucide/svelte/icons/star';
import Target from '@lucide/svelte/icons/target';
import Terminal from '@lucide/svelte/icons/terminal';
import Trophy from '@lucide/svelte/icons/trophy';
import Truck from '@lucide/svelte/icons/truck';
import User from '@lucide/svelte/icons/user';
import Video from '@lucide/svelte/icons/video';
import Zap from '@lucide/svelte/icons/zap';
import type { Component } from 'svelte';

export type LucideIcon = Component<IconProps>;

export const PROJECT_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  briefcase: Briefcase,
  star: Star,
  heart: Heart,
  home: Home,
  rocket: Rocket,
  target: Target,
  zap: Zap,
  sparkles: Sparkles,
  trophy: Trophy,
  code: Code,
  terminal: Terminal,
  cpu: Cpu,
  database: Database,
  server: Server,
  layers: Layers,
  globe: Globe,
  cloud: Cloud,
  smartphone: Smartphone,
  box: Box,
  package: Package,
  truck: Truck,
  hammer: Hammer,
  settings: Settings,
  shield: Shield,
  brain: Brain,
  lightbulb: Lightbulb,
  book: Book,
  graduation_cap: GraduationCap,
  palette: Palette,
  music: Music,
  video: Video,
  coffee: Coffee,
  dumbbell: Dumbbell,
  flag: Flag,
  map: Map,
  award: Award,
  user: User,
};

export type ProjectIconKey = keyof typeof PROJECT_ICONS;

export const DEFAULT_ICON: ProjectIconKey = 'folder';

export function getProjectIcon(icon: string | null | undefined): LucideIcon {
  if (icon && icon in PROJECT_ICONS) {
    return PROJECT_ICONS[icon];
  }
  return PROJECT_ICONS[DEFAULT_ICON];
}
