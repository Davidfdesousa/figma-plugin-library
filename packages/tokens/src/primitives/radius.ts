export const radiusPrimitives = {
  'radius-0': '0rem',
  'radius-25': '0.125rem',
  'radius-50': '0.25rem',
  'radius-75': '0.375rem',
  'radius-100': '0.5rem',
  'radius-200': '0.75rem',
  'radius-full': '9999px',
} as const;

export type RadiusPrimitiveKey = keyof typeof radiusPrimitives;
