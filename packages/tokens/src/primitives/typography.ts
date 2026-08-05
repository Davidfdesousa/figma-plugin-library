export const typographyPrimitives = {
  'font-family-base':
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  'font-family-mono':
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", monospace',

  'font-size-75': '0.75rem',
  'font-size-100': '0.875rem',
  'font-size-200': '1rem',
  'font-size-300': '1.25rem',
  'font-size-400': '1.5rem',

  'font-weight-regular': '400',
  'font-weight-medium': '500',
  'font-weight-semibold': '600',

  'line-height-tight': '1.2',
  'line-height-normal': '1.5',
  'line-height-relaxed': '1.7',
} as const;

export type TypographyPrimitiveKey = keyof typeof typographyPrimitives;
