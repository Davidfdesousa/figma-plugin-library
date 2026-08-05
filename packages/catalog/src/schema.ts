import { z } from 'zod';

import { CAPABILITY_VOCABULARY } from './capabilities';

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

// Soft heuristic only — catches the most blatant compound-purpose phrasing.
// The full "should this be two plugins?" judgment call belongs to the scope-cohesion
// CI validator (deferred — see the polish-pass task) and to human PR review.
const COMPOUND_PURPOSE_MARKERS = [' and also ', ' as well as ', ' plus it '];

function hasUniqueEntries(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export const pluginIdSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(ID_PATTERN, 'id must be lowercase kebab-case, starting with a letter (e.g. "svg-batch-exporter")');

export const purposeSchema = z
  .string()
  .min(10, 'purpose must be a real sentence, not a placeholder')
  .max(160, 'purpose must stay to one sentence — split unrelated purposes into separate plugins')
  .refine((value) => (value.match(/\./g) ?? []).length <= 1, {
    message: 'purpose looks like more than one sentence — a plugin should have exactly one purpose',
  })
  .refine(
    (value) => !COMPOUND_PURPOSE_MARKERS.some((marker) => value.toLowerCase().includes(marker)),
    {
      message:
        'purpose reads like two purposes joined together — consider splitting into two plugins, or extending an existing one instead of adding a second purpose',
    },
  );

export const capabilitiesSchema = z
  .array(z.enum(CAPABILITY_VOCABULARY))
  .min(1, 'declare at least one capability')
  .refine(hasUniqueEntries, { message: 'capabilities must not repeat' });

export const keywordsSchema = z
  .array(z.string().min(1).max(40).toLowerCase())
  .min(1, 'declare at least one keyword')
  .refine(hasUniqueEntries, { message: 'keywords must not repeat' });

export const pluginStatusSchema = z.enum(['active', 'deprecated', 'sunset']);

export const pluginVisibilitySchema = z.enum(['org', 'internal']);

export const pluginMetadataSchema = z
  .object({
    id: pluginIdSchema,
    name: z.string().min(2).max(80),
    purpose: purposeSchema,
    capabilities: capabilitiesSchema,
    keywords: keywordsSchema,
    owner: z.string().min(1, 'every plugin needs a declared designer owner'),
    maintainer: z.string().min(1, 'every plugin needs a declared foundation-team maintainer'),
    status: pluginStatusSchema.default('active'),
    visibility: pluginVisibilitySchema,
    allowedGroups: z.array(z.string().min(1)).default([]),
    version: z.string().regex(SEMVER_PATTERN, 'version must be valid semver (e.g. "1.0.0")'),
  })
  .superRefine((metadata, ctx) => {
    if (metadata.visibility === 'internal' && metadata.allowedGroups.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['allowedGroups'],
        message: 'visibility "internal" requires at least one entry in allowedGroups',
      });
    }
  });

export type PluginMetadata = z.infer<typeof pluginMetadataSchema>;

export interface ParseMetadataSuccess {
  readonly success: true;
  readonly data: PluginMetadata;
}

export interface ParseMetadataFailure {
  readonly success: false;
  readonly issues: readonly string[];
}

export function parsePluginMetadata(
  json: unknown,
): ParseMetadataSuccess | ParseMetadataFailure {
  const result = pluginMetadataSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    issues: result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
  };
}
