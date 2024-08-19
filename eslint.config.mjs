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
  eslint.configs.recommended,
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
        project: './src/task/tsconfig.json',
      },
    },
    rules: {
      // 2
      '@typescript-eslint/no-unsafe-call': 'off',
      // 3
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      // 4
      '@typescript-eslint/no-non-null-assertion': 'off',
      // 7
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // 11
      '@typescript-eslint/no-unsafe-assignment': 'off',
      // 19
      '@typescript-eslint/no-unused-vars': 'off',
      // 36
      '@typescript-eslint/restrict-template-expressions': 'off',
      // 50
      '@typescript-eslint/no-explicit-any': 'off',
      // 71
      '@typescript-eslint/no-inferrable-types': 'off',
      // 160
      '@typescript-eslint/no-unsafe-argument': 'off',
      // 202
      '@typescript-eslint/no-unsafe-member-access': 'off',
      // 1464
      '@typescript-eslint/no-confusing-void-expression': 'off',

      //'@typescript-eslint/no-unnecessary-type-parameters': 'error', – 1
      //'@typescript-eslint/explicit-module-boundary-types': 'error', – 2
      //'@typescript-eslint/prefer-destructuring': 'error', – 4
      //'no-negated-condition': 'error', – 4
      //'id-length': 'error', – 5
      //'@typescript-eslint/strict-boolean-expressions': 'error', – 6
      //'prefer-named-capture-group': 'error', – 6
      //'prefer-destructuring': 'error', – 9
      //'max-lines': 'error', – 15
      //'@typescript-eslint/max-params': 'error', – 17
      //'max-params': 'error', – 17
      //'@typescript-eslint/member-ordering': 'error', – 19
      //'no-ternary': 'error', – 20
      //'@typescript-eslint/class-methods-use-this': 'error', – 28
      //'class-methods-use-this': 'error', – 28
      //'@typescript-eslint/init-declarations': 'error', – 59
      //'init-declarations': 'error', – 59
      //'@typescript-eslint/consistent-type-imports': 'error', – 61
      //'max-lines-per-function': 'error', – 67
      //'no-undefined': 'error', – 96
      //'@typescript-eslint/prefer-readonly-parameter-types': 'error', – 115
      //'max-statements': 'error', – 155
      //'@typescript-eslint/naming-convention': 'error', – 349
      //'one-var': 'error', – 365
      //'no-undef': 'error', – 545
      //'no-underscore-dangle': 'error', – 593
      //'sort-keys': 'error', – 616
      //'@typescript-eslint/no-magic-numbers': 'error', – 1050
      //'no-magic-numbers': 'error', – 1050
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-invalid-this': 'error',
      '@typescript-eslint/no-loop-func': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-restricted-imports': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-unsafe-unary-minus': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/parameter-properties': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/prefer-return-this-type': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/typedef': 'error',
      '@typescript-eslint/unbound-method': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      'accessor-pairs': 'error',
      'array-callback-return': 'error',
      'arrow-body-style': 'error',
      'block-scoped-var': 'error',
      'camelcase': 'error',
      'capitalized-comments': 'error',
      'complexity': 'error',
      'consistent-return': 'error',
      'consistent-this': 'error',
      'curly': 'error',
      'default-case': 'error',
      'default-case-last': 'error',
      'default-param-last': 'error',
      'eqeqeq': 'error',
      'func-name-matching': 'error',
      'func-names': 'error',
      'func-style': 'error',
      'grouped-accessor-pairs': 'error',
      'guard-for-in': 'error',
      'id-denylist': 'error',
      'id-match': 'error',
      'logical-assignment-operators': 'error',
      'max-classes-per-file': 'error',
      'max-depth': 'error',
      'max-nested-callbacks': 'error',
      'new-cap': 'error',
      'no-alert': 'error',
      'no-await-in-loop': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': 'error',
      'no-const-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-constant-condition': 'error',
      'no-constructor-return': 'error',
      'no-continue': 'error',
      'no-control-regex': 'error',
      'no-debugger': 'error',
      'no-div-regex': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'error',
      'no-empty': 'error',
      'no-empty-character-class': 'error',
      'no-empty-pattern': 'error',
      'no-empty-static-block': 'error',
      'no-eq-null': 'error',
      'no-eval': 'error',
      'no-ex-assign': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-extra-boolean-cast': 'error',
      'no-extra-label': 'error',
      'no-fallthrough': 'error',
      'no-func-assign': 'error',
      'no-global-assign': 'error',
      'no-implicit-coercion': 'error',
      'no-implicit-globals': 'error',
      'no-import-assign': 'error',
      'no-inline-comments': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-regexp': 'error',
      'no-invalid-this': 'error',
      'no-irregular-whitespace': 'error',
      'no-iterator': 'error',
      'no-label-var': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-loop-func': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-nested-ternary': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-new-wrappers': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-obj-calls': 'error',
      'no-object-constructor': 'error',
      'no-octal': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'error',
      'no-plusplus': 'error',
      'no-promise-executor-return': 'error',
      'no-proto': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'error',
      'no-regex-spaces': 'error',
      'no-restricted-exports': 'error',
      'no-restricted-globals': 'error',
      'no-restricted-imports': 'error',
      'no-restricted-properties': 'error',
      'no-restricted-syntax': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-self-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-setter-return': 'error',
      'no-shadow': 'error',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      'no-template-curly-in-string': 'error',
      'no-this-before-super': 'error',
      'no-undef-init': 'error',
      'no-unexpected-multiline': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-labels': 'error',
      'no-unused-private-class-members': 'error',
      'no-use-before-define': 'error',
      'no-useless-backreference': 'error',
      'no-useless-call': 'error',
      'no-useless-catch': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-escape': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'no-void': 'error',
      'no-warning-comments': 'error',
      'no-with': 'error',
      'object-shorthand': 'error',
      'operator-assignment': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-exponentiation-operator': 'error',
      'prefer-numeric-literals': 'error',
      'prefer-object-has-own': 'error',
      'prefer-object-spread': 'error',
      'prefer-regex-literals': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'radix': 'error',
      'require-atomic-updates': 'error',
      'require-unicode-regexp': 'error',
      'require-yield': 'error',
      'sort-imports': 'error',
      'sort-vars': 'error',
      'strict': 'error',
      'symbol-description': 'error',
      'unicode-bom': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'vars-on-top': 'error',
      'yoda': 'error',
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
