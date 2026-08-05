import { afterEach, describe, expect, it, vi } from 'vitest';

import './pf-field';
import type { PfField } from './pf-field';

async function mountField(setup?: (el: PfField) => void): Promise<PfField> {
  const el = document.createElement('pf-field');
  setup?.(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('pf-field', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('associates the label with the input via for/id', async () => {
    const el = await mountField((node) => {
      node.label = 'Export name';
    });
    const label = el.shadowRoot?.querySelector('label');
    const input = el.shadowRoot?.querySelector('input');
    expect(label?.getAttribute('for')).toBe(input?.id);
    expect(label?.textContent).toContain('Export name');
  });

  it('updates the value property and fires an input event on user input', async () => {
    const el = await mountField();
    const handler = vi.fn();
    el.addEventListener('input', handler);

    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'my-plugin';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.value).toBe('my-plugin');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('renders help text and links it via aria-describedby', async () => {
    const el = await mountField((node) => {
      node.helpText = 'Lowercase, kebab-case';
    });
    const input = el.shadowRoot!.querySelector('input')!;
    const helpEl = el.shadowRoot!.querySelector('.help')!;
    expect(helpEl.textContent).toBe('Lowercase, kebab-case');
    expect(input.getAttribute('aria-describedby')).toBe(helpEl.id);
  });

  it('renders an error with role=alert, sets aria-invalid, and includes it in aria-describedby', async () => {
    const el = await mountField((node) => {
      node.error = 'Name is required';
    });
    const input = el.shadowRoot!.querySelector('input')!;
    const errorEl = el.shadowRoot!.querySelector('.error')!;

    expect(errorEl.getAttribute('role')).toBe('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(errorEl.id);
  });

  it('links both help and error ids when both are present', async () => {
    const el = await mountField((node) => {
      node.helpText = 'help';
      node.error = 'error';
    });
    const input = el.shadowRoot!.querySelector('input')!;
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ')).toHaveLength(2);
  });

  it('omits aria-describedby entirely when there is no help or error', async () => {
    const el = await mountField();
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('sets aria-invalid=false when there is no error', async () => {
    const el = await mountField();
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });
});
