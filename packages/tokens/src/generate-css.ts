#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cssVarName } from './css-var';
import { colorPrimitives } from './primitives/color';
import { radiusPrimitives } from './primitives/radius';
import { spacePrimitives } from './primitives/space';
import { typographyPrimitives } from './primitives/typography';
import { radiusTokens, type RadiusSemanticToken } from './semantics/radius';
import { spacingTokens, type SpacingSemanticToken } from './semantics/spacing';
import { typographyTokens, type TypographySemanticToken } from './semantics/typography';
import { THEME_ATTRIBUTE, themeColorTokens } from './themes';
import type { SemanticColorToken } from './semantics/color';

const TOKEN_PREFIX = 'pf';

// `ref` keeps primitives in a namespace that can never collide with a semantic
// token name (e.g. primitive `radius-full` vs. semantic `radius.full` both
// stringify to `radius-full` — without this prefix they'd emit the same
// custom property and the semantic one would become a self-reference).
function primitiveVarName(key: string): string {
  return `--${TOKEN_PREFIX}-ref-${key}`;
}

function declaration(name: string, value: string): string {
  return `  ${name}: ${value};`;
}

function buildPrimitiveDeclarations(): string[] {
  const primitives: Record<string, string> = {
    ...colorPrimitives,
    ...spacePrimitives,
    ...radiusPrimitives,
    ...typographyPrimitives,
  };
  return Object.entries(primitives).map(([key, value]) =>
    declaration(primitiveVarName(key), value),
  );
}

function buildThemeInvariantSemanticDeclarations(): string[] {
  const declarations: string[] = [];
  for (const [token, primitiveKey] of Object.entries(spacingTokens) as [
    SpacingSemanticToken,
    string,
  ][]) {
    declarations.push(declaration(cssVarName(token), `var(${primitiveVarName(primitiveKey)})`));
  }
  for (const [token, primitiveKey] of Object.entries(radiusTokens) as [
    RadiusSemanticToken,
    string,
  ][]) {
    declarations.push(declaration(cssVarName(token), `var(${primitiveVarName(primitiveKey)})`));
  }
  for (const [token, primitiveKey] of Object.entries(typographyTokens) as [
    TypographySemanticToken,
    string,
  ][]) {
    declarations.push(declaration(cssVarName(token), `var(${primitiveVarName(primitiveKey)})`));
  }
  return declarations;
}

function buildColorDeclarations(theme: keyof typeof themeColorTokens): string[] {
  return (Object.entries(themeColorTokens[theme]) as [SemanticColorToken, string][]).map(
    ([token, primitiveKey]) =>
      declaration(cssVarName(token), `var(${primitiveVarName(primitiveKey)})`),
  );
}

function generate(): string {
  const primitiveDeclarations = buildPrimitiveDeclarations();
  const invariantSemanticDeclarations = buildThemeInvariantSemanticDeclarations();
  const lightDeclarations = buildColorDeclarations('light');
  const darkDeclarations = buildColorDeclarations('dark');

  return `/**
 * GENERATED FILE — do not edit by hand.
 * Produced by packages/tokens/src/generate-css.ts from the TypeScript token
 * definitions in packages/tokens/src. Run \`nx run @plugin-factory/tokens:build-css\`.
 *
 * Load this once at the document root. Custom properties cross the Shadow DOM
 * boundary on their own, so components never need to re-import it.
 */

:root {
  /* primitives */
${primitiveDeclarations.join('\n')}

  /* semantic — theme-invariant (spacing, radius, typography) */
${invariantSemanticDeclarations.join('\n')}

  /* semantic — color, default theme (light) */
${lightDeclarations.join('\n')}
}

:root[${THEME_ATTRIBUTE}='dark'] {
  /* semantic — color, dark theme overrides */
${darkDeclarations.join('\n')}
}
`;
}

function main(): void {
  const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'tokens.css'), generate(), 'utf8');
  console.log(`wrote ${join(outDir, 'tokens.css')}`);
}

main();
