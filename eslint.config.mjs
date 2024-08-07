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
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/member-ordering': [
        'error',
        {
          // Update the default order to group getters and setters.
          'default': [
            // Index signature
            'signature',
            'call-signature',

            // Fields
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            '#private-static-field',

            'public-decorated-field',
            'protected-decorated-field',
            'private-decorated-field',

            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            '#private-instance-field',

            'public-abstract-field',
            'protected-abstract-field',

            'public-field',
            'protected-field',
            'private-field',
            '#private-field',

            'static-field',
            'instance-field',
            'abstract-field',

            'decorated-field',

            'field',

            // Static initialization
            'static-initialization',

            // Constructors
            'public-constructor',
            'protected-constructor',
            'private-constructor',

            'constructor',

            // Accessors
            'public-static-accessor',
            'protected-static-accessor',
            'private-static-accessor',
            '#private-static-accessor',

            'public-decorated-accessor',
            'protected-decorated-accessor',
            'private-decorated-accessor',

            'public-instance-accessor',
            'protected-instance-accessor',
            'private-instance-accessor',
            '#private-instance-accessor',

            'public-abstract-accessor',
            'protected-abstract-accessor',

            'public-accessor',
            'protected-accessor',
            'private-accessor',
            '#private-accessor',

            'static-accessor',
            'instance-accessor',
            'abstract-accessor',

            'decorated-accessor',

            'accessor',

            // Getters & Setters
            ['public-static-get', 'public-static-set'],
            ['protected-static-get', 'protected-static-set'],
            ['private-static-get', 'private-static-set'],
            ['#private-static-get', '#private-static-set'],

            ['public-decorated-get', 'private-decorated-set'],
            ['protected-decorated-get', 'protected-decorated-set'],
            ['private-decorated-get', 'private-decorated-set'],

            ['public-instance-get', 'public-instance-set'],
            ['protected-instance-get', 'protected-instance-set'],
            ['private-instance-get', 'private-instance-set'],
            ['#private-instance-get', '#private-instance-set'],

            ['public-abstract-get', 'public-abstract-set'],
            ['protected-abstract-get', 'protected-abstract-set'],

            ['public-get', 'public-set'],
            ['protected-get', 'protected-set'],
            ['private-get', 'private-set'],
            ['#private-get', '#private-set'],

            ['static-get', 'static-set'],
            ['instance-get', 'instance-set'],
            ['abstract-get', 'abstract-set'],

            ['decorated-get', 'decorated-set'],

            ['get', 'set'],

            // Methods
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            '#private-static-method',

            'public-decorated-method',
            'protected-decorated-method',
            'private-decorated-method',

            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
            '#private-instance-method',

            'public-abstract-method',
            'protected-abstract-method',

            'public-method',
            'protected-method',
            'private-method',
            '#private-method',

            'static-method',
            'instance-method',
            'abstract-method',

            'decorated-method',

            'method',
          ],
        },
      ],
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
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'no-ternary': 'off',
      'one-var': [
        'error',
        {
          'initialized': 'never',
        },
      ],

      // Full set
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          'ignore': [0, 1],
        },
      ],
      'no-undefined': 'off',
    },
  },
  {
    files: [
      '**/*.spec.ts',
    ],
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off',

      // Full set
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },
)
