import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMainBridge } from './main';

interface ToUI {
  greeting: { text: string };
}

interface ToMain {
  ready: undefined;
}

describe('createMainBridge', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('send() posts a {type, payload} envelope via figma.ui.postMessage', () => {
    const postMessage = vi.fn();
    vi.stubGlobal('figma', { ui: { postMessage, on: vi.fn(), off: vi.fn() } });

    const bridge = createMainBridge<ToUI, ToMain>();
    bridge.send('greeting', { text: 'hi' });

    expect(postMessage).toHaveBeenCalledWith({ type: 'greeting', payload: { text: 'hi' } });
  });

  it('onMessage() registers via figma.ui.on and unsubscribe calls figma.ui.off', () => {
    const on = vi.fn();
    const off = vi.fn();
    vi.stubGlobal('figma', { ui: { postMessage: vi.fn(), on, off } });

    const bridge = createMainBridge<ToUI, ToMain>();
    const listener = vi.fn();
    const unsubscribe = bridge.onMessage(listener);

    expect(on).toHaveBeenCalledWith('message', expect.any(Function));
    const registeredHandler = on.mock.calls[0][1];
    registeredHandler({ type: 'ready', payload: undefined });
    expect(listener).toHaveBeenCalledWith({ type: 'ready', payload: undefined });

    unsubscribe();
    expect(off).toHaveBeenCalledWith('message', registeredHandler);
  });
});
