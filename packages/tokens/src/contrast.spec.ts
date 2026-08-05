import { describe, expect, it } from 'vitest';

import { contrastRatio, meetsWcagAaNormalText, WCAG_AA_UI_COMPONENT } from './contrast';
import { colorPrimitives } from './primitives/color';
import { darkColorTokens, lightColorTokens } from './semantics/color';

function resolve(theme: typeof lightColorTokens, token: keyof typeof lightColorTokens): string {
  return colorPrimitives[theme[token]];
}

describe('contrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('returns 1:1 for identical colors', () => {
    expect(contrastRatio('#2f7dff', '#2f7dff')).toBeCloseTo(1, 5);
  });
});

describe.each([
  ['light', lightColorTokens],
  ['dark', darkColorTokens],
] as const)('%s theme — critical pairs used by packages/ui', (_name, theme) => {
  it('content.default on bg.surface passes AA normal text', () => {
    expect(
      meetsWcagAaNormalText(resolve(theme, 'content.default'), resolve(theme, 'bg.surface')),
    ).toBe(true);
  });

  it('content.muted on bg.surface passes AA normal text', () => {
    expect(
      meetsWcagAaNormalText(resolve(theme, 'content.muted'), resolve(theme, 'bg.surface')),
    ).toBe(true);
  });

  it('content.onAccent on bg.accent passes AA normal text', () => {
    expect(
      meetsWcagAaNormalText(resolve(theme, 'content.onAccent'), resolve(theme, 'bg.accent')),
    ).toBe(true);
  });

  it('content.onAccent on bg.accent.hover passes AA normal text', () => {
    expect(
      meetsWcagAaNormalText(
        resolve(theme, 'content.onAccent'),
        resolve(theme, 'bg.accent.hover'),
      ),
    ).toBe(true);
  });

  it('content.onAccent on bg.danger passes AA normal text', () => {
    expect(
      meetsWcagAaNormalText(resolve(theme, 'content.onAccent'), resolve(theme, 'bg.danger')),
    ).toBe(true);
  });

  it('content.accent on bg.accent.subtle passes AA normal text', () => {
    expect(
      meetsWcagAaNormalText(resolve(theme, 'content.accent'), resolve(theme, 'bg.accent.subtle')),
    ).toBe(true);
  });

  it('focus.ring against bg.canvas passes the UI-component minimum (3:1)', () => {
    expect(contrastRatio(resolve(theme, 'focus.ring'), resolve(theme, 'bg.canvas'))).toBeGreaterThanOrEqual(
      WCAG_AA_UI_COMPONENT,
    );
  });
});
