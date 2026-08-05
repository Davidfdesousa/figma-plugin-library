import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['**/out-tsc', '**/dist'],
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      // Querying the shadow root right after rendering a fixture is a safe,
      // standard test pattern — asserting non-null there isn't a code smell.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
