import { afterEach, describe, expect, it } from 'vitest';

import './pf-card';
import type { PfCard } from './pf-card';

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function mountCard(children: string): Promise<PfCard> {
  const el = document.createElement('pf-card') as PfCard;
  // Connect (and let the shadow root render its <slot> elements) before
  // assigning light-DOM children, so slotchange fires reliably instead of
  // depending on the test environment's fidelity for "already-slotted at
  // connect time" — a known engine-fidelity gap in DOM emulators.
  document.body.appendChild(el);
  await el.updateComplete;
  el.innerHTML = children;
  await nextTick();
  await el.updateComplete;
  return el;
}

describe('pf-card', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('always renders the default (body) slot content', async () => {
    const el = await mountCard('<p>Body content</p>');
    expect(el.textContent).toContain('Body content');
    const body = el.shadowRoot!.querySelector('.body')!;
    expect(body.hasAttribute('hidden')).toBe(false);
  });

  it('hides the header wrapper when nothing is slotted into it', async () => {
    const el = await mountCard('<p>Body only</p>');
    const header = el.shadowRoot!.querySelector('.header')!;
    expect(header.hasAttribute('hidden')).toBe(true);
  });

  it('hides the footer wrapper when nothing is slotted into it', async () => {
    const el = await mountCard('<p>Body only</p>');
    const footer = el.shadowRoot!.querySelector('.footer')!;
    expect(footer.hasAttribute('hidden')).toBe(true);
  });

  it('shows the header wrapper once content is slotted into it', async () => {
    const el = await mountCard('<h2 slot="header">Title</h2><p>Body</p>');
    const header = el.shadowRoot!.querySelector('.header')!;
    expect(header.hasAttribute('hidden')).toBe(false);
    expect(el.textContent).toContain('Title');
  });

  it('shows the footer wrapper once content is slotted into it', async () => {
    const el = await mountCard('<p>Body</p><div slot="footer">Actions</div>');
    const footer = el.shadowRoot!.querySelector('.footer')!;
    expect(footer.hasAttribute('hidden')).toBe(false);
    expect(el.textContent).toContain('Actions');
  });
});
