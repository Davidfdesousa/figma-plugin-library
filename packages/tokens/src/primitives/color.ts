/**
 * Raw color values. No naming intent here — that is the job of `semantics/color.ts`.
 * Keys are self-describing (`color-<ramp>-<step>`) so every primitive category maps
 * 1:1 to a CSS custom property (`--pf-<key>`) without special-casing at generation time.
 */
export const colorPrimitives = {
  'color-neutral-0': '#ffffff',
  'color-neutral-50': '#f8f9fb',
  'color-neutral-100': '#eef0f3',
  'color-neutral-200': '#dfe3e8',
  'color-neutral-300': '#c7cdd6',
  'color-neutral-400': '#a3acba',
  'color-neutral-500': '#7c8798',
  'color-neutral-600': '#5c6675',
  'color-neutral-700': '#454e5c',
  'color-neutral-800': '#2f3742',
  'color-neutral-900': '#1c212a',
  'color-neutral-950': '#101318',

  'color-accent-50': '#eef4ff',
  'color-accent-100': '#dce9ff',
  'color-accent-200': '#b3d1ff',
  'color-accent-300': '#85b6ff',
  'color-accent-400': '#5698ff',
  'color-accent-500': '#2f7dff',
  'color-accent-600': '#1c63e6',
  'color-accent-700': '#154db3',
  'color-accent-800': '#113c8a',
  'color-accent-900': '#0d2e69',

  'color-danger-100': '#fde8e8',
  'color-danger-300': '#f5a3a3',
  'color-danger-500': '#e64545',
  'color-danger-600': '#cc3333',
  'color-danger-700': '#a32626',
  'color-danger-800': '#7a1c1c',

  'color-success-100': '#e6f6ec',
  'color-success-300': '#93dcb0',
  'color-success-500': '#2fa561',
  'color-success-600': '#22894e',
  'color-success-700': '#1a6b3d',
  'color-success-800': '#134f2d',

  'color-warning-100': '#fff4e0',
  'color-warning-300': '#ffce80',
  'color-warning-500': '#e6941a',
  'color-warning-600': '#c67a0f',
  'color-warning-700': '#9c5f0a',
  'color-warning-800': '#7a4a08',
} as const;

export type ColorPrimitiveKey = keyof typeof colorPrimitives;
