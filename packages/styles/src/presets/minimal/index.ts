import { cssVar } from '@plugin-factory/tokens';

import type { StylePreset } from '../../contract';

/**
 * Zero-dependency preset. Exists as proof that the abstraction in
 * contract.ts / style-provider.ts actually works — swapping this for the
 * Bootstrap preset later should mean changing one registration call, not
 * touching a single component. See docs/swapping-style-preset.md.
 */
const stylesheet = `
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: ${cssVar('font.family.base')};
  font-size: ${cssVar('font.size.md')};
  line-height: ${cssVar('font.lineHeight.normal')};
  color: ${cssVar('content.default')};
  background-color: ${cssVar('bg.canvas')};
}

.pf-container {
  padding: ${cssVar('inset.md')};
}

.pf-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${cssVar('stack.sm')};
}

.pf-stack {
  display: flex;
  flex-direction: column;
  gap: ${cssVar('stack.sm')};
}
`;

export const minimalPreset: StylePreset = {
  name: 'minimal',
  stylesheet,
  utilityClasses: {
    row: 'pf-row',
    stack: 'pf-stack',
    container: 'pf-container',
  },
};
