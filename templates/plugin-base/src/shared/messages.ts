/**
 * The bridge's message contract for this plugin. Every plugin defines its
 * own pair of these — see @plugin-factory/core's bridge (packages/core/src/bridge).
 */
export interface ToUiMessages {
  'auth-result': { authorized: boolean; reason?: string };
  'selection-count': { count: number };
  echo: { text: string };
}

export interface ToMainMessages {
  'ui-ready': undefined;
  'submit-name': { name: string };
}
