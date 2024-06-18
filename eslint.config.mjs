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
      '**/*.js',
      'debug/**/*',
      'release/**/*'
    ]
  },
  eslint.configs.all,
  ...tseslint.configs.all,
  {
    languageOptions: {
      globals: {
        ...globals.es2017,
        ...globals.node
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2017,
        project: './src/task/tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'id-length': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-statements': 'off',
      'no-negated-condition': 'off',
      'no-ternary': 'off',
      'no-undefined': 'off',
      'no-underscore-dangle': 'off',
      'one-var': 'off',
      'prefer-named-capture-group': 'off',
      'sort-keys': 'off'
    }
  },
  {
    files: [
      '**/*.mjs'
    ],
    extends: [
      tseslint.configs.disableTypeChecked
    ],
  },
)
