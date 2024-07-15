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
      'release/**/*'
    ]
  },
  eslint.configs.all,
  ...tseslint.configs.all,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.es2017,
        ...globals.node
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2017,
        project: './src/task/tsconfig.json'
      }
    },
    rules: {
      'no-console': 'error',
      'sort-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_[^_]+'
        }
      ],
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',

      // Full set
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'camelcase': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-statements': 'off',
      'no-await-in-loop': 'off',
      'no-continue': 'off',
      'no-implicit-coercion': 'off',
      'no-implicit-globals': 'off',
      'no-implicit-this': 'off',
      'no-magic-numbers': 'off',
      'no-negated-condition': 'off',
      'no-ternary': 'off',
      'no-undef-init': 'off',
      'no-undef': 'off',
      'no-undefined': 'off',
      'no-underscore-dangle': 'off',
      'one-var': 'off',
      'prefer-named-capture-group': 'off',
      'sort-keys': 'off'
    }
  },
  {
    files: [
      '**/*.spec.ts',
    ],
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off'
    }
  }
)
