import type { Envelope, Listener, MessageMap, Unsubscribe } from './types';

/**
 * The UI (iframe) side of the bridge. Runs in a regular browser context
 * (DOM available, no `figma` global) — talks to the main thread via
 * `window.postMessage`, following Figma's `pluginMessage` envelope contract.
 */
export interface UiBridge<ToUI extends MessageMap, ToMain extends MessageMap> {
  send<K extends keyof ToMain>(type: K, payload: ToMain[K]): void;
  onMessage(listener: Listener<ToUI>): Unsubscribe;
}

export function createUiBridge<
  ToUI extends MessageMap,
  ToMain extends MessageMap,
>(): UiBridge<ToUI, ToMain> {
  return {
    send(type, payload) {
      // See the equivalent cast in bridge/main.ts for why this needs `as`.
      const envelope = { type, payload } as Envelope<ToMain, typeof type>;
      parent.postMessage({ pluginMessage: envelope }, '*');
    },
    onMessage(listener) {
      const handler = (event: MessageEvent) => {
        const envelope = (event.data as { pluginMessage?: Envelope<ToUI> } | undefined)
          ?.pluginMessage;
        if (envelope) listener(envelope);
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    },
  };
}
