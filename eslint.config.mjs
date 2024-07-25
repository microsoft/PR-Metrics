/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import typescriptParser from '@typescript-eslint/parser'

export default tseslint.config(
  {
    ignores: [
      'debug/**/*',
      'release/**/*',
    ],
  },
  eslint.configs.all,
  ...tseslint.configs.all,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.es2017,
        ...globals.node,
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2017,
        project: './src/task/tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          'selector': 'variable',
          'format': [
            'camelCase',
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_[^_]+',
        },
      ],

      // Full set
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-statements': 'off',
      'no-magic-numbers': 'off',
      'no-ternary': 'off',
      'no-undefined': 'off',
      'one-var': 'off'
    },
  },
  {
    files: [
      '**/*.spec.ts',
    ],
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
)
