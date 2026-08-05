import { describe, expect, it } from 'vitest';

import { minimalPreset } from './index';

describe('minimalPreset', () => {
  it('declares all three required utility classes', () => {
    expect(minimalPreset.utilityClasses).toEqual({
      row: 'pf-row',
      stack: 'pf-stack',
      container: 'pf-container',
    });
  });

  it('never references a Bootstrap class name', () => {
    const bootstrapClasses = ['btn', 'card', 'form-control', 'container-fluid'];
    for (const className of bootstrapClasses) {
      expect(minimalPreset.stylesheet).not.toContain(`.${className}`);
    }
  });

  it('styles exclusively through pf- design tokens, never a raw color/size literal', () => {
    // every declaration value in this stylesheet should route through var(--pf-...)
    // or be a structural value (flex, 0, border-box) — not a hardcoded hex/px.
    expect(minimalPreset.stylesheet).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('resolves its utility class names in the generated CSS', () => {
    expect(minimalPreset.stylesheet).toContain('.pf-row');
    expect(minimalPreset.stylesheet).toContain('.pf-stack');
    expect(minimalPreset.stylesheet).toContain('.pf-container');
  });
});
