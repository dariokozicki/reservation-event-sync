import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: false, skipComments: false }],
      'max-len': ['error', { code: 100, ignoreUrls: true }],
      'max-statements-per-line': ['error', { max: 1 }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-warning-comments': ['error', { terms: ['todo', 'fixme'] }],
    },
  },
  {
    files: ['src/components/**/*.tsx', 'src/app/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXText[value=/[A-Za-z]/]',
          message: 'Put user-facing copy in the next-intl message catalog.',
        },
        {
          selector: 'JSXAttribute[name.name=/^(title|placeholder|aria-label)$/] > Literal',
          message: 'Translate accessible labels and placeholders through next-intl.',
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'node_modules/**', 'drizzle/meta/**', 'artifacts/**']),
]);
