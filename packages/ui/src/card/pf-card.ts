import { cssVar } from '@plugin-factory/tokens';
import { html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PfElement } from '../internal/pf-element';

const styles = `
:host {
  display: block;
}

.card {
  background-color: ${cssVar('bg.surface')};
  border: 1px solid ${cssVar('border.default')};
  border-radius: ${cssVar('radius.container')};
  overflow: hidden;
}

.header,
.footer {
  padding: ${cssVar('inset.md')};
}

.header {
  border-bottom: 1px solid ${cssVar('border.subtle')};
}

.footer {
  border-top: 1px solid ${cssVar('border.subtle')};
}

.body {
  padding: ${cssVar('inset.md')};
}

[hidden] {
  display: none;
}
`;

/**
 * A container with header/body/footer slots. The header and footer wrappers
 * collapse (no padding, no border) when nothing is slotted into them —
 * checked via slotchange, not just CSS, so an empty named slot doesn't leave
 * a stray padded strip.
 */
@customElement('pf-card')
export class PfCard extends PfElement {
  static override styles = unsafeCSS(styles);

  @state() private hasHeader = false;
  @state() private hasFooter = false;

  private handleHeaderSlotChange = (event: Event): void => {
    this.hasHeader = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  private handleFooterSlotChange = (event: Event): void => {
    this.hasFooter = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  override render() {
    return html`
      <div class="card">
        <div class="header" ?hidden=${!this.hasHeader}>
          <slot name="header" @slotchange=${this.handleHeaderSlotChange}></slot>
        </div>
        <div class="body">
          <slot></slot>
        </div>
        <div class="footer" ?hidden=${!this.hasFooter}>
          <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pf-card': PfCard;
  }
}
