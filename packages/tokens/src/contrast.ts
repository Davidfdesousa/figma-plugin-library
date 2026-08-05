/**
 * WCAG 2.x relative-luminance contrast ratio between two hex colors.
 * Used to guard the palette itself (see contrast.spec.ts) and reusable by
 * packages/ui to assert a component's foreground/background pairing passes AA.
 */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function channelLuminance(channel: number): number {
  const fraction = channel / 255;
  return fraction <= 0.03928 ? fraction / 12.92 : Math.pow((fraction + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3;
export const WCAG_AA_UI_COMPONENT = 3;

export function meetsWcagAaNormalText(hexA: string, hexB: string): boolean {
  return contrastRatio(hexA, hexB) >= WCAG_AA_NORMAL_TEXT;
}
