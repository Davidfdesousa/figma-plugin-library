import type { StylePreset } from './contract';

let activePreset: StylePreset | undefined;
let activeSheet: CSSStyleSheet | undefined;

function isShadowRoot(root: Document | ShadowRoot): root is ShadowRoot {
  return 'host' in root;
}

function supportsConstructedStylesheets(root: Document | ShadowRoot): boolean {
  return (
    'adoptedStyleSheets' in root &&
    typeof CSSStyleSheet !== 'undefined' &&
    typeof CSSStyleSheet.prototype.replaceSync === 'function'
  );
}

function appendFallbackStyleTag(root: Document | ShadowRoot, preset: StylePreset): void {
  const style = document.createElement('style');
  style.textContent = preset.stylesheet;
  style.dataset.pluginFactoryPreset = preset.name;
  if (isShadowRoot(root)) {
    root.appendChild(style);
  } else {
    root.head.appendChild(style);
  }
}

/**
 * Sets the plugin's active style preset and injects its stylesheet at the
 * document level, for the plugin's own light-DOM layout. Call once, during
 * UI bootstrap, before any DS component renders.
 */
export function registerStylePreset(preset: StylePreset): void {
  activePreset = preset;
  activeSheet = undefined;
  adoptPresetStylesheet(document);
}

export function getActiveStylePreset(): StylePreset {
  if (!activePreset) {
    throw new Error(
      'No style preset registered — call registerStylePreset() during plugin UI bootstrap.',
    );
  }
  return activePreset;
}

/**
 * Adopts the active preset's stylesheet into `root` — the document, or a
 * component's shadow root that wants the preset's base reset. Falls back to
 * an injected `<style>` element where constructible stylesheets aren't
 * supported.
 */
export function adoptPresetStylesheet(root: Document | ShadowRoot): void {
  const preset = getActiveStylePreset();

  if (!supportsConstructedStylesheets(root)) {
    appendFallbackStyleTag(root, preset);
    return;
  }

  if (!activeSheet) {
    activeSheet = new CSSStyleSheet();
    activeSheet.replaceSync(preset.stylesheet);
  }
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, activeSheet];
}
