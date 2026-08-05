import { darkColorTokens, lightColorTokens, type SemanticColorMap } from './semantics/color';

/**
 * Themes switch via a data attribute on the root element (`<html data-theme="dark">`),
 * never via a class name or a media query. See docs/architecture.md.
 */
export type ThemeName = 'light' | 'dark';

export const THEME_ATTRIBUTE = 'data-theme';

export const DEFAULT_THEME: ThemeName = 'light';

export const themeColorTokens: Record<ThemeName, SemanticColorMap> = {
  light: lightColorTokens,
  dark: darkColorTokens,
};
