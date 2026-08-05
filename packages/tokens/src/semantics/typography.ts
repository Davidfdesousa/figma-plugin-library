import type { TypographyPrimitiveKey } from '../primitives/typography';

export type TypographySemanticToken =
  | 'font.family.base'
  | 'font.family.mono'
  | 'font.size.sm'
  | 'font.size.md'
  | 'font.size.lg'
  | 'font.size.xl'
  | 'font.weight.regular'
  | 'font.weight.medium'
  | 'font.weight.semibold'
  | 'font.lineHeight.tight'
  | 'font.lineHeight.normal'
  | 'font.lineHeight.relaxed';

export type TypographySemanticMap = Record<TypographySemanticToken, TypographyPrimitiveKey>;

export const typographyTokens: TypographySemanticMap = {
  'font.family.base': 'font-family-base',
  'font.family.mono': 'font-family-mono',

  'font.size.sm': 'font-size-75',
  'font.size.md': 'font-size-100',
  'font.size.lg': 'font-size-200',
  'font.size.xl': 'font-size-300',

  'font.weight.regular': 'font-weight-regular',
  'font.weight.medium': 'font-weight-medium',
  'font.weight.semibold': 'font-weight-semibold',

  'font.lineHeight.tight': 'line-height-tight',
  'font.lineHeight.normal': 'line-height-normal',
  'font.lineHeight.relaxed': 'line-height-relaxed',
};
