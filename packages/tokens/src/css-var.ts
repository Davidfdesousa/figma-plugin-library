import type { SemanticColorToken } from './semantics/color';
import type { RadiusSemanticToken } from './semantics/radius';
import type { SpacingSemanticToken } from './semantics/spacing';
import type { TypographySemanticToken } from './semantics/typography';

export const TOKEN_PREFIX = 'pf';

export type SemanticToken =
  | SemanticColorToken
  | SpacingSemanticToken
  | RadiusSemanticToken
  | TypographySemanticToken;

/**
 * Consumers (packages/styles, packages/ui) should only ever reference *semantic*
 * tokens, never primitives directly — this function's input type is the enforcement.
 */
export function cssVarName(token: SemanticToken): string {
  return `--${TOKEN_PREFIX}-${token.replace(/\./g, '-')}`;
}

export function cssVar(token: SemanticToken, fallback?: string): string {
  return fallback ? `var(${cssVarName(token)}, ${fallback})` : `var(${cssVarName(token)})`;
}
