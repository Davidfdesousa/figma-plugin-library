import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUiBridge } from './ui';

interface ToUI {
  greeting: { text: string };
}

interface ToMain {
  ready: undefined;
}

describe('createUiBridge', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('send() posts a {pluginMessage: {type, payload}} envelope to parent', () => {
    const postMessage = vi.fn();
    vi.stubGlobal('parent', { postMessage });

    const bridge = createUiBridge<ToUI, ToMain>();
    bridge.send('ready', undefined);

    expect(postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'ready', payload: undefined } },
      '*',
    );
  });

  it('onMessage() only reacts to events carrying a pluginMessage envelope', () => {
    const listeners: Record<string, (event: unknown) => void> = {};
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, handler: (event: unknown) => void) => {
        listeners[type] = handler;
      }),
      removeEventListener: vi.fn(),
    });

    const bridge = createUiBridge<ToUI, ToMain>();
    const listener = vi.fn();
    const unsubscribe = bridge.onMessage(listener);

    listeners.message({ data: { irrelevant: true } });
    expect(listener).not.toHaveBeenCalled();

    listeners.message({ data: { pluginMessage: { type: 'greeting', payload: { text: 'hi' } } } });
    expect(listener).toHaveBeenCalledWith({ type: 'greeting', payload: { text: 'hi' } });

    unsubscribe();
    expect((window as unknown as { removeEventListener: ReturnType<typeof vi.fn> })
      .removeEventListener).toHaveBeenCalledWith('message', listeners.message);
  });
});
