import type { ThemeKey } from '@portfolio/shared';
import type { ThemeComponent } from '@/components/themes/types';

// Loads one theme on demand. Each theme brings its own fonts (next/font), and importing only the
// theme in use means a public page preloads only those.
const loaders: Record<ThemeKey, () => Promise<{ default: ThemeComponent }>> = {
  editorial: () => import('@/components/themes/EditorialTheme'),
  bento: () => import('@/components/themes/BentoTheme'),
  creative: () => import('@/components/themes/CreativeTheme'),
  soft: () => import('@/components/themes/SoftTheme'),
  executive: () => import('@/components/themes/ExecutiveTheme'),
};

export async function loadTheme(key: ThemeKey): Promise<ThemeComponent> {
  return (await loaders[key]()).default;
}
