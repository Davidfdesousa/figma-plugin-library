import type { ColorPrimitiveKey } from '../primitives/color';

/**
 * Semantic color tokens. Naming rules (see docs/architecture.md):
 * - `bg` for background, never `background`.
 * - `content` for text/icon color, never `fg`/`foreground`.
 * - Variations used across the set: `subtle`, `muted`, `strong`, `intense`, `hover`, `pressed`.
 *
 * This is a flat union of dot-paths, not a nested object — `bg.accent` and
 * `bg.accent.subtle` can coexist as sibling keys without one being the parent of the other.
 */
export type SemanticColorToken =
  | 'bg.canvas'
  | 'bg.surface'
  | 'bg.surface.subtle'
  | 'bg.surface.strong'
  | 'bg.accent'
  | 'bg.accent.subtle'
  | 'bg.accent.hover'
  | 'bg.accent.pressed'
  | 'bg.accent.intense'
  | 'bg.danger'
  | 'bg.danger.subtle'
  | 'bg.danger.hover'
  | 'bg.danger.pressed'
  | 'bg.success.subtle'
  | 'bg.warning.subtle'
  | 'bg.disabled'
  | 'content.default'
  | 'content.muted'
  | 'content.subtle'
  | 'content.strong'
  | 'content.onAccent'
  | 'content.accent'
  | 'content.danger'
  | 'content.success'
  | 'content.warning'
  | 'content.disabled'
  | 'border.default'
  | 'border.subtle'
  | 'border.strong'
  | 'border.accent'
  | 'border.danger'
  | 'focus.ring';

/**
 * Every semantic token points at a primitive — never a raw color literal.
 * `Record<SemanticColorToken, ColorPrimitiveKey>` means TypeScript refuses to compile
 * if a theme is missing a token or a new token isn't implemented in both themes.
 */
export type SemanticColorMap = Record<SemanticColorToken, ColorPrimitiveKey>;

export const lightColorTokens: SemanticColorMap = {
  'bg.canvas': 'color-neutral-50',
  'bg.surface': 'color-neutral-0',
  'bg.surface.subtle': 'color-neutral-50',
  'bg.surface.strong': 'color-neutral-100',
  'bg.accent': 'color-accent-600',
  'bg.accent.subtle': 'color-accent-50',
  'bg.accent.hover': 'color-accent-700',
  'bg.accent.pressed': 'color-accent-800',
  'bg.accent.intense': 'color-accent-900',
  'bg.danger': 'color-danger-600',
  'bg.danger.subtle': 'color-danger-100',
  'bg.danger.hover': 'color-danger-700',
  'bg.danger.pressed': 'color-danger-800',
  'bg.success.subtle': 'color-success-100',
  'bg.warning.subtle': 'color-warning-100',
  'bg.disabled': 'color-neutral-100',

  'content.default': 'color-neutral-900',
  'content.muted': 'color-neutral-600',
  'content.subtle': 'color-neutral-500',
  'content.strong': 'color-neutral-950',
  'content.onAccent': 'color-neutral-0',
  'content.accent': 'color-accent-600',
  'content.danger': 'color-danger-600',
  'content.success': 'color-success-600',
  'content.warning': 'color-warning-700',
  'content.disabled': 'color-neutral-400',

  'border.default': 'color-neutral-200',
  'border.subtle': 'color-neutral-100',
  'border.strong': 'color-neutral-300',
  'border.accent': 'color-accent-600',
  'border.danger': 'color-danger-600',

  'focus.ring': 'color-accent-600',
};

export const darkColorTokens: SemanticColorMap = {
  'bg.canvas': 'color-neutral-950',
  'bg.surface': 'color-neutral-900',
  'bg.surface.subtle': 'color-neutral-950',
  'bg.surface.strong': 'color-neutral-800',
  'bg.accent': 'color-accent-600',
  'bg.accent.subtle': 'color-accent-900',
  'bg.accent.hover': 'color-accent-700',
  'bg.accent.pressed': 'color-accent-800',
  'bg.accent.intense': 'color-accent-900',
  'bg.danger': 'color-danger-600',
  'bg.danger.subtle': 'color-danger-700',
  'bg.danger.hover': 'color-danger-700',
  'bg.danger.pressed': 'color-danger-800',
  'bg.success.subtle': 'color-success-700',
  'bg.warning.subtle': 'color-warning-700',
  'bg.disabled': 'color-neutral-800',

  'content.default': 'color-neutral-50',
  'content.muted': 'color-neutral-400',
  'content.subtle': 'color-neutral-500',
  'content.strong': 'color-neutral-0',
  'content.onAccent': 'color-neutral-0',
  'content.accent': 'color-accent-400',
  'content.danger': 'color-danger-300',
  'content.success': 'color-success-300',
  'content.warning': 'color-warning-300',
  'content.disabled': 'color-neutral-600',

  'border.default': 'color-neutral-800',
  'border.subtle': 'color-neutral-900',
  'border.strong': 'color-neutral-700',
  'border.accent': 'color-accent-600',
  'border.danger': 'color-danger-600',

  'focus.ring': 'color-accent-500',
};
