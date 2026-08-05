import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StylePreset } from './contract';

const testPreset: StylePreset = {
  name: 'test-preset',
  stylesheet: '.pf-row { display: flex; }',
  utilityClasses: { row: 'pf-row', stack: 'pf-stack', container: 'pf-container' },
};

async function freshModule() {
  vi.resetModules();
  return import('./style-provider.js');
}

describe('style-provider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getActiveStylePreset throws before a preset is registered', async () => {
    vi.stubGlobal('document', { adoptedStyleSheets: [], createElement: vi.fn() });
    const { getActiveStylePreset } = await freshModule();
    expect(() => getActiveStylePreset()).toThrow(/No style preset registered/);
  });

  describe('with constructed stylesheet support', () => {
    let replaceSync: ReturnType<typeof vi.fn>;
    let documentStub: { adoptedStyleSheets: unknown[]; createElement: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      replaceSync = vi.fn();
      class FakeCSSStyleSheet {
        // no initializer -> TS emits nothing at runtime for this declaration,
        // so it won't shadow the prototype assignment below.
        declare replaceSync: typeof replaceSync;
      }
      // real CSSStyleSheet.prototype.replaceSync is a prototype method, not an
      // instance field — the production feature-detection checks the prototype.
      FakeCSSStyleSheet.prototype.replaceSync = replaceSync;
      documentStub = { adoptedStyleSheets: [], createElement: vi.fn() };
      vi.stubGlobal('CSSStyleSheet', FakeCSSStyleSheet);
      vi.stubGlobal('document', documentStub);
    });

    it('registerStylePreset adopts a constructed stylesheet onto document', async () => {
      const { registerStylePreset } = await freshModule();
      registerStylePreset(testPreset);

      expect(documentStub.adoptedStyleSheets).toHaveLength(1);
      expect(replaceSync).toHaveBeenCalledWith(testPreset.stylesheet);
    });

    it('adoptPresetStylesheet reuses the same constructed sheet across roots', async () => {
      const { registerStylePreset, adoptPresetStylesheet } = await freshModule();
      registerStylePreset(testPreset);

      const shadowRoot = { host: {}, adoptedStyleSheets: [] as unknown[] };
      adoptPresetStylesheet(shadowRoot as unknown as ShadowRoot);

      expect(shadowRoot.adoptedStyleSheets).toHaveLength(1);
      // once for the initial document registration, not again for the shadow root
      expect(replaceSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('without constructed stylesheet support (fallback)', () => {
    let appendedStyle: { textContent?: string; dataset: Record<string, string> } | undefined;
    let documentStub: {
      adoptedStyleSheets: unknown[];
      head: { appendChild: ReturnType<typeof vi.fn> };
      createElement: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      appendedStyle = undefined;
      documentStub = {
        adoptedStyleSheets: [],
        head: { appendChild: vi.fn((el) => (appendedStyle = el)) },
        createElement: vi.fn(() => ({ dataset: {} })),
      };
      vi.stubGlobal('document', documentStub);
      // no global CSSStyleSheet at all
    });

    it('falls back to an injected <style> element on the document', async () => {
      const { registerStylePreset } = await freshModule();
      registerStylePreset(testPreset);

      expect(documentStub.head.appendChild).toHaveBeenCalledTimes(1);
      expect(appendedStyle?.textContent).toBe(testPreset.stylesheet);
      expect(appendedStyle?.dataset.pluginFactoryPreset).toBe(testPreset.name);
    });

    it('falls back to appending on the shadow root itself, not document.head', async () => {
      const { registerStylePreset, adoptPresetStylesheet } = await freshModule();
      registerStylePreset(testPreset);

      const shadowAppendChild = vi.fn();
      const shadowRoot = { host: {}, appendChild: shadowAppendChild };
      adoptPresetStylesheet(shadowRoot as unknown as ShadowRoot);

      expect(shadowAppendChild).toHaveBeenCalledTimes(1);
    });
  });
});
