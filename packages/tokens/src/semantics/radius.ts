import type { RadiusPrimitiveKey } from '../primitives/radius';

export type RadiusSemanticToken = 'radius.control' | 'radius.container' | 'radius.full';

export type RadiusSemanticMap = Record<RadiusSemanticToken, RadiusPrimitiveKey>;

export const radiusTokens: RadiusSemanticMap = {
  'radius.control': 'radius-50', // buttons, fields, inputs
  'radius.container': 'radius-100', // cards, panels
  'radius.full': 'radius-full', // pills, avatars
};
