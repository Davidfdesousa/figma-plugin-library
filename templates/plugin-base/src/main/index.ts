import {
  createLogger,
  createMainBridge,
  getSelection,
  runIfAuthorized,
  type Envelope,
} from '@plugin-factory/core';

import { AUTHORIZED_USER_IDS } from './auth-config';
import type { ToMainMessages, ToUiMessages } from '../shared/messages';

const logger = createLogger({ name: 'plugin-base' });
const bridge = createMainBridge<ToUiMessages, ToMainMessages>();

figma.showUI(__html__, { width: 340, height: 420 });

// Enforced here, not just by the UI hiding the form — a message handler
// must never act on a message that arrived before (or despite) denial.
let isAuthorized = false;

bridge.onMessage((message) => {
  if (message.type === 'ui-ready') {
    void handleReady();
    return;
  }
  if (!isAuthorized) return;
  handleAuthorizedMessage(message);
});

async function handleReady(): Promise<void> {
  await runIfAuthorized(
    { allowedUserIds: AUTHORIZED_USER_IDS },
    () => {
      isAuthorized = true;
      bridge.send('auth-result', { authorized: true });
      bridge.send('selection-count', { count: getSelection().length });
      figma.on('selectionchange', () => {
        bridge.send('selection-count', { count: getSelection().length });
      });
    },
    (result) => {
      logger.warn('access denied', { reason: result.reason });
      bridge.send('auth-result', { authorized: false, reason: result.reason });
    },
  );
}

// Replace this with the plugin's real behavior. Delete the "say hello" demo,
// the AUTHORIZED_USER_IDS wiring above stays.
function handleAuthorizedMessage(message: Envelope<ToMainMessages>): void {
  if (message.type === 'submit-name') {
    logger.info('name submitted', { name: message.payload.name });
    bridge.send('echo', { text: `Hello, ${message.payload.name}!` });
  }
}
