/**
 * Utility classes a plugin author can use in their *own* light-DOM markup
 * (the layout shell around the DS components), not inside a component's
 * shadow DOM. Every preset must provide all of these — swapping presets
 * means these class names still exist, even though what they resolve to
 * (a Bootstrap flex utility vs. a hand-written one) changes completely.
 */
export interface StylePresetUtilityClasses {
  /** Horizontal flex layout. */
  readonly row: string;
  /** Vertical flex layout. */
  readonly stack: string;
  /** Page/panel padding wrapper. */
  readonly container: string;
}

export interface StylePreset {
  readonly name: string;
  /** Raw CSS text — a base reset plus whatever backs `utilityClasses`. */
  readonly stylesheet: string;
  readonly utilityClasses: StylePresetUtilityClasses;
}
