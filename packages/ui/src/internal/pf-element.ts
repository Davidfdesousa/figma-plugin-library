import { adoptPresetStylesheet, getActiveStylePreset } from '@plugin-factory/styles';
import { LitElement } from 'lit';

/**
 * Base class for every DS component. Adopts the active style preset's
 * stylesheet into the component's own shadow root (base reset only — a
 * component's own template still never references a preset's named
 * classes; see packages/styles/src/style-provider.ts).
 *
 * Silently does nothing if no preset has been registered yet, so components
 * still render correctly in isolated unit tests.
 */
export abstract class PfElement extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.shadowRoot) return;
    try {
      getActiveStylePreset();
    } catch {
      return;
    }
    adoptPresetStylesheet(this.shadowRoot);
  }
}
