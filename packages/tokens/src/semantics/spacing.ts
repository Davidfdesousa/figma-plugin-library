import type { SpacePrimitiveKey } from '../primitives/space';

/**
 * Spacing is organized by usage category, not exposed as a raw numeric scale:
 * - `stack`  — vertical space *between* sibling elements.
 * - `inset`  — padding *inside* a container.
 */
export type SpacingSemanticToken =
  | 'stack.xs'
  | 'stack.sm'
  | 'stack.md'
  | 'stack.lg'
  | 'stack.xl'
  | 'inset.xs'
  | 'inset.sm'
  | 'inset.md'
  | 'inset.lg'
  | 'inset.xl';

export type SpacingSemanticMap = Record<SpacingSemanticToken, SpacePrimitiveKey>;

export const spacingTokens: SpacingSemanticMap = {
  'stack.xs': 'space-1',
  'stack.sm': 'space-2',
  'stack.md': 'space-4',
  'stack.lg': 'space-6',
  'stack.xl': 'space-10',

  'inset.xs': 'space-1',
  'inset.sm': 'space-2',
  'inset.md': 'space-4',
  'inset.lg': 'space-6',
  'inset.xl': 'space-8',
};
