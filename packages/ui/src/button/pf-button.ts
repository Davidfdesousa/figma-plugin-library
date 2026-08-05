import { cssVar } from '@plugin-factory/tokens';
import { html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { PfElement } from '../internal/pf-element';

export type PfButtonVariant = 'primary' | 'secondary' | 'danger';
export type PfButtonSize = 'sm' | 'md' | 'lg';
export type PfButtonType = 'button' | 'submit' | 'reset';

const styles = `
:host {
  display: inline-block;
}

button {
  font-family: ${cssVar('font.family.base')};
  font-weight: ${cssVar('font.weight.medium')};
  line-height: ${cssVar('font.lineHeight.normal')};
  border-radius: ${cssVar('radius.control')};
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: ${cssVar('stack.xs')};
}

button:disabled {
  cursor: not-allowed;
  background-color: ${cssVar('bg.disabled')};
  color: ${cssVar('content.disabled')};
  border-color: transparent;
}

button:focus-visible {
  outline: 2px solid ${cssVar('focus.ring')};
  outline-offset: 2px;
}

:host([size='sm']) button {
  padding: ${cssVar('inset.xs')} ${cssVar('inset.sm')};
  font-size: ${cssVar('font.size.sm')};
}

:host([size='md']) button {
  padding: ${cssVar('inset.sm')} ${cssVar('inset.md')};
  font-size: ${cssVar('font.size.md')};
}

:host([size='lg']) button {
  padding: ${cssVar('inset.md')} ${cssVar('inset.lg')};
  font-size: ${cssVar('font.size.lg')};
}

:host([variant='primary']) button:not(:disabled) {
  background-color: ${cssVar('bg.accent')};
  color: ${cssVar('content.onAccent')};
}
:host([variant='primary']) button:not(:disabled):hover {
  background-color: ${cssVar('bg.accent.hover')};
}
:host([variant='primary']) button:not(:disabled):active {
  background-color: ${cssVar('bg.accent.pressed')};
}

:host([variant='secondary']) button:not(:disabled) {
  background-color: ${cssVar('bg.surface')};
  color: ${cssVar('content.default')};
  border-color: ${cssVar('border.default')};
}
:host([variant='secondary']) button:not(:disabled):hover {
  background-color: ${cssVar('bg.surface.strong')};
}

:host([variant='danger']) button:not(:disabled) {
  background-color: ${cssVar('bg.danger')};
  color: ${cssVar('content.onAccent')};
}
:host([variant='danger']) button:not(:disabled):hover {
  background-color: ${cssVar('bg.danger.hover')};
}
:host([variant='danger']) button:not(:disabled):active {
  background-color: ${cssVar('bg.danger.pressed')};
}

.spinner {
  width: 1em;
  height: 1em;
  border-radius: ${cssVar('radius.full')};
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: pf-spin 0.6s linear infinite;
}

@keyframes pf-spin {
  to {
    transform: rotate(360deg);
  }
}
`;

/**
 * Renders a native <button> internally so keyboard interaction, click
 * behavior, and disabled semantics come from the platform, not from
 * hand-rolled ARIA. Never emits a Bootstrap class name — every visual rule
 * here reads from a design token.
 */
@customElement('pf-button')
export class PfButton extends PfElement {
  static override styles = unsafeCSS(styles);

  @property({ reflect: true }) variant: PfButtonVariant = 'primary';
  @property({ reflect: true }) size: PfButtonSize = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property() type: PfButtonType = 'button';

  override render() {
    const isDisabled = this.disabled || this.loading;
    return html`
      <button type=${this.type} ?disabled=${isDisabled} aria-busy=${this.loading ? 'true' : 'false'}>
        ${this.loading ? html`<span class="spinner" aria-hidden="true"></span>` : null}
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pf-button': PfButton;
  }
}
