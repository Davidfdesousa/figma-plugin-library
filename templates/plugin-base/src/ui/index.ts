import { createUiBridge } from '@plugin-factory/core';
import { minimalPreset, registerStylePreset } from '@plugin-factory/styles';
import type { PfField } from '@plugin-factory/ui';

// Consumes the DS components — swap this one import (and the line below) for
// another preset to change the visual library. See docs/swapping-style-preset.md.
import '@plugin-factory/ui';
import type { ToMainMessages, ToUiMessages } from '../shared/messages';

registerStylePreset(minimalPreset);

const bridge = createUiBridge<ToUiMessages, ToMainMessages>();

// Fails loudly at load time if index.html and this file ever drift apart,
// instead of crashing later on a null property access.
function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`index.html is missing an element matching "${selector}"`);
  return el;
}

const app = mustFind<HTMLElement>('#app');
const restricted = mustFind<HTMLElement>('#restricted');
const selectionCountEl = mustFind<HTMLElement>('#selection-count');
const nameField = mustFind<PfField>('#name-field');
const submitButton = mustFind<HTMLElement>('#submit');
const echoEl = mustFind<HTMLElement>('#echo');

bridge.onMessage((message) => {
  switch (message.type) {
    case 'auth-result':
      app.hidden = !message.payload.authorized;
      restricted.hidden = message.payload.authorized;
      break;
    case 'selection-count':
      selectionCountEl.textContent = String(message.payload.count);
      break;
    case 'echo':
      echoEl.textContent = message.payload.text;
      break;
  }
});

submitButton.addEventListener('click', () => {
  bridge.send('submit-name', { name: nameField.value });
});

bridge.send('ui-ready', undefined);
