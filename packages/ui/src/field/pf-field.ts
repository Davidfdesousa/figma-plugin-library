import { cssVar } from '@plugin-factory/tokens';
import { html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { PfElement } from '../internal/pf-element';

export type PfFieldType = 'text' | 'email' | 'password' | 'number';

let instanceCount = 0;

const styles = `
:host {
  display: block;
  font-family: ${cssVar('font.family.base')};
}

.field {
  display: flex;
  flex-direction: column;
  gap: ${cssVar('stack.xs')};
}

label {
  font-size: ${cssVar('font.size.sm')};
  font-weight: ${cssVar('font.weight.medium')};
  color: ${cssVar('content.default')};
}

input {
  font-family: inherit;
  font-size: ${cssVar('font.size.md')};
  color: ${cssVar('content.default')};
  background-color: ${cssVar('bg.surface')};
  border: 1px solid ${cssVar('border.default')};
  border-radius: ${cssVar('radius.control')};
  padding: ${cssVar('inset.sm')};
}

input:disabled {
  background-color: ${cssVar('bg.disabled')};
  color: ${cssVar('content.disabled')};
}

input:focus-visible {
  outline: 2px solid ${cssVar('focus.ring')};
  outline-offset: 2px;
}

input[aria-invalid='true'] {
  border-color: ${cssVar('border.danger')};
}

.help {
  font-size: ${cssVar('font.size.sm')};
  color: ${cssVar('content.muted')};
}

.error {
  font-size: ${cssVar('font.size.sm')};
  color: ${cssVar('content.danger')};
}
`;

/**
 * A native <input> with a label, optional help text, and optional error
 * message — wired together with real id/aria-describedby/aria-invalid, not
 * just visual proximity.
 */
@customElement('pf-field')
export class PfField extends PfElement {
  static override styles = unsafeCSS(styles);

  private readonly instanceId = `pf-field-${++instanceCount}`;

  @property() label = '';
  @property({ attribute: 'help-text' }) helpText = '';
  @property() error = '';
  @property() value = '';
  @property() type: PfFieldType = 'text';
  @property() placeholder = '';
  @property() name = '';
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  private handleInput = (event: Event): void => {
    this.value = (event.target as HTMLInputElement).value;
  };

  override render() {
    const inputId = `${this.instanceId}-input`;
    const helpId = `${this.instanceId}-help`;
    const errorId = `${this.instanceId}-error`;

    const describedBy =
      [this.helpText ? helpId : null, this.error ? errorId : null].filter(Boolean).join(' ') ||
      undefined;

    return html`
      <div class="field">
        <label for=${inputId}>${this.label}${this.required ? ' *' : ''}</label>
        <input
          id=${inputId}
          name=${this.name || nothing}
          type=${this.type}
          .value=${this.value}
          placeholder=${this.placeholder || nothing}
          ?required=${this.required}
          ?disabled=${this.disabled}
          aria-invalid=${this.error ? 'true' : 'false'}
          aria-describedby=${describedBy ?? nothing}
          @input=${this.handleInput}
        />
        ${this.helpText ? html`<div id=${helpId} class="help">${this.helpText}</div>` : null}
        ${this.error ? html`<div id=${errorId} class="error" role="alert">${this.error}</div>` : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pf-field': PfField;
  }
}
