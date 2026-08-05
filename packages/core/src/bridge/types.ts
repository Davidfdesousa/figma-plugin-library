/**
 * A message map is defined per-plugin: keys are event names, values are payload types.
 * `createMainBridge`/`createUiBridge` are generic over two of these (one per direction),
 * so every plugin gets full compile-time type safety without touching this package.
 *
 * Bounded by `object`, not `Record<string, unknown>` — an `interface` (the natural
 * way to write one of these) has no index signature and would fail that stricter
 * constraint even though it's perfectly usable as a message map.
 */
export type MessageMap = object;

export type Envelope<M extends MessageMap, K extends keyof M = keyof M> = K extends keyof M
  ? { type: K; payload: M[K] }
  : never;

export type Listener<M extends MessageMap> = (message: Envelope<M>) => void;

export type Unsubscribe = () => void;
