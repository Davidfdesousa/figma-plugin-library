import type { Envelope, Listener, MessageMap, Unsubscribe } from './types';

/**
 * The plugin main-thread side of the bridge. Runs inside the Figma plugin
 * sandbox (has the `figma` global, no DOM).
 */
export interface MainBridge<ToUI extends MessageMap, ToMain extends MessageMap> {
  send<K extends keyof ToUI>(type: K, payload: ToUI[K]): void;
  onMessage(listener: Listener<ToMain>): Unsubscribe;
}

export function createMainBridge<
  ToUI extends MessageMap,
  ToMain extends MessageMap,
>(): MainBridge<ToUI, ToMain> {
  return {
    send(type, payload) {
      // TS can't prove a generic {type, payload} literal matches the distributed
      // conditional `Envelope<M>` from inside generic code — the shapes genuinely
      // match, this is a known limitation of conditional-type distribution.
      const envelope = { type, payload } as Envelope<ToUI, typeof type>;
      figma.ui.postMessage(envelope);
    },
    onMessage(listener) {
      const handler = (message: Envelope<ToMain>) => listener(message);
      figma.ui.on('message', handler);
      return () => figma.ui.off('message', handler);
    },
  };
}
