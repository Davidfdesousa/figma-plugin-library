import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*', '**/*.d.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          // Every package here is consumed straight from src/index.ts (see each
          // package.json's "main"), never from a pre-built dist/ — there's no
          // "must be built first" constraint to enforce.
          enforceBuildableLibDependency: false,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // packages/tokens has no internal dependencies: it is the visual source of truth.
            {
              sourceTag: 'scope:tokens',
              onlyDependOnLibsWithTags: [],
            },
            // packages/styles may only depend on tokens (CSS custom properties), never on ui or core.
            {
              sourceTag: 'scope:styles',
              onlyDependOnLibsWithTags: ['scope:tokens'],
            },
            // packages/ui may depend on tokens and styles (the contract, not a specific preset), never on core.
            {
              sourceTag: 'scope:ui',
              onlyDependOnLibsWithTags: ['scope:tokens', 'scope:styles'],
            },
            // packages/core is plugin-runtime infrastructure: no visual dependencies.
            {
              sourceTag: 'scope:core',
              onlyDependOnLibsWithTags: [],
            },
            // packages/catalog only knows about metadata, not runtime or visual layers.
            {
              sourceTag: 'scope:catalog',
              onlyDependOnLibsWithTags: [],
            },
            // templates and plugins may depend on any foundation package.
            {
              sourceTag: 'scope:plugin',
              onlyDependOnLibsWithTags: [
                'scope:tokens',
                'scope:styles',
                'scope:ui',
                'scope:core',
                'scope:catalog',
              ],
            },
            // tooling (generators, validators, the MCP server) may depend on catalog
            // (metadata/search) and core (GitHubClient, for the MCP server's open_pr tool).
            {
              sourceTag: 'scope:tooling',
              onlyDependOnLibsWithTags: ['scope:catalog', 'scope:core'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];
