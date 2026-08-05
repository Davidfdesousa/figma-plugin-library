/**
 * Raw spacing scale (4px base grid, expressed in rem against a 16px root).
 * Not usable directly by components — see `semantics/spacing.ts` for the
 * `stack` / `inset` categories that carry usage intent.
 */
export const spacePrimitives = {
  'space-0': '0rem',
  'space-1': '0.25rem',
  'space-2': '0.5rem',
  'space-3': '0.75rem',
  'space-4': '1rem',
  'space-5': '1.25rem',
  'space-6': '1.5rem',
  'space-8': '2rem',
  'space-10': '2.5rem',
  'space-12': '3rem',
  'space-16': '4rem',
} as const;

export type SpacePrimitiveKey = keyof typeof spacePrimitives;
