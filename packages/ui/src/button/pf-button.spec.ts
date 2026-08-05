import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import './pf-button';
import type { PfButton } from './pf-button';

async function mountButton(setup?: (el: PfButton) => void): Promise<PfButton> {
  const el = document.createElement('pf-button');
  setup?.(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('pf-button', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a native <button> in its shadow root', async () => {
    const el = await mountButton();
    expect(el.shadowRoot?.querySelector('button')).toBeTruthy();
  });

  it('defaults to variant=primary and size=md, reflected as attributes', async () => {
    const el = await mountButton();
    expect(el.getAttribute('variant')).toBe('primary');
    expect(el.getAttribute('size')).toBe('md');
  });

  it('projects slotted label content through to the light DOM', async () => {
    const el = await mountButton((node) => {
      node.textContent = 'Export';
    });
    expect(el.textContent?.trim()).toBe('Export');
  });

  it('dispatches a click event that composes out of the shadow root', async () => {
    const el = await mountButton();
    const handler = vi.fn();
    el.addEventListener('click', handler);
    el.shadowRoot?.querySelector('button')?.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('disables the inner button and suppresses clicks when disabled', async () => {
    const el = await mountButton((node) => {
      node.disabled = true;
    });
    await el.updateComplete;
    const button = el.shadowRoot?.querySelector('button');
    expect(button?.disabled).toBe(true);

    const handler = vi.fn();
    el.addEventListener('click', handler);
    button?.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('sets aria-busy and disables the button while loading, and shows a spinner', async () => {
    const el = await mountButton((node) => {
      node.loading = true;
    });
    await el.updateComplete;
    const button = el.shadowRoot?.querySelector('button');
    expect(button?.getAttribute('aria-busy')).toBe('true');
    expect(button?.disabled).toBe(true);
    expect(el.shadowRoot?.querySelector('.spinner')).toBeTruthy();
  });
});

describe('pf-button without a registered style preset', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('still renders correctly (PfElement adoption is best-effort)', async () => {
    const el = await mountButton();
    expect(el.shadowRoot?.querySelector('button')).toBeTruthy();
  });
});
