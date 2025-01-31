/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import typescriptParser from "@typescript-eslint/parser";

export default tseslint.config(
  {
    ignores: ["**/*.js", "debug/**/*", "release/**/*"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.es2017,
        ...globals.mocha,
        ...globals.node,
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2017,
        project: "./src/task/tsconfig.json",
      },
    },
    rules: {
      //temp
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      //older
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/default-param-last": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/member-ordering": [
        "error",
        {
          default: [
            "signature",
            "call-signature",
            "public-static-field",
            "protected-static-field",
            "private-static-field",
            "#private-static-field",
            "public-decorated-field",
            "protected-decorated-field",
            "private-decorated-field",
            "public-instance-field",
            "protected-instance-field",
            "private-instance-field",
            "#private-instance-field",
            "public-abstract-field",
            "protected-abstract-field",
            "public-field",
            "protected-field",
            "private-field",
            "#private-field",
            "static-field",
            "instance-field",
            "abstract-field",
            "decorated-field",
            "field",
            "static-initialization",
            "public-constructor",
            "protected-constructor",
            "private-constructor",
            "constructor",
            "public-static-accessor",
            "protected-static-accessor",
            "private-static-accessor",
            "#private-static-accessor",
            "public-decorated-accessor",
            "protected-decorated-accessor",
            "private-decorated-accessor",
            "public-instance-accessor",
            "protected-instance-accessor",
            "private-instance-accessor",
            "#private-instance-accessor",
            "public-abstract-accessor",
            "protected-abstract-accessor",
            "public-accessor",
            "protected-accessor",
            "private-accessor",
            "#private-accessor",
            "static-accessor",
            "instance-accessor",
            "abstract-accessor",
            "decorated-accessor",
            "accessor",
            ["public-static-get", "public-static-set"],
            ["protected-static-get", "protected-static-set"],
            ["private-static-get", "private-static-set"],
            ["#private-static-get", "#private-static-set"],
            ["public-decorated-get", "private-decorated-set"],
            ["protected-decorated-get", "protected-decorated-set"],
            ["private-decorated-get", "private-decorated-set"],
            ["public-instance-get", "public-instance-set"],
            ["protected-instance-get", "protected-instance-set"],
            ["private-instance-get", "private-instance-set"],
            ["#private-instance-get", "#private-instance-set"],
            ["public-abstract-get", "public-abstract-set"],
            ["protected-abstract-get", "protected-abstract-set"],
            ["public-get", "public-set"],
            ["protected-get", "protected-set"],
            ["private-get", "private-set"],
            ["#private-get", "#private-set"],
            ["static-get", "static-set"],
            ["instance-get", "instance-set"],
            ["abstract-get", "abstract-set"],
            ["decorated-get", "decorated-set"],
            ["get", "set"],
            "public-static-method",
            "protected-static-method",
            "private-static-method",
            "#private-static-method",
            "public-decorated-method",
            "protected-decorated-method",
            "private-decorated-method",
            "public-instance-method",
            "protected-instance-method",
            "private-instance-method",
            "#private-instance-method",
            "public-abstract-method",
            "protected-abstract-method",
            "public-method",
            "protected-method",
            "private-method",
            "#private-method",
            "static-method",
            "instance-method",
            "abstract-method",
            "decorated-method",
            "method",
          ],
        },
      ],
      "@typescript-eslint/method-signature-style": "error",
      "@typescript-eslint/naming-convention": "error",
      "@typescript-eslint/no-array-constructor": "error",
      "@typescript-eslint/no-invalid-this": "error",
      "@typescript-eslint/no-loop-func": "error",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          enforceConst: true,
          ignore: [0, 1],
          ignoreArrayIndexes: true,
        },
      ],
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-mixed-enums": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-restricted-imports": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-this-alias": "error",
      "@typescript-eslint/no-unnecessary-parameter-property-assignment":
        "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
      "@typescript-eslint/no-unnecessary-type-parameters": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-unsafe-unary-minus": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/parameter-properties": "error",
      "@typescript-eslint/prefer-destructuring": "error",
      "@typescript-eslint/prefer-enum-initializers": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-reduce-type-parameter": "error",
      "@typescript-eslint/prefer-return-this-type": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      //"@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/typedef": "error",
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/unified-signatures": "error",
      "accessor-pairs": "error",
      "array-callback-return": "error",
      "arrow-body-style": "error",
      "block-scoped-var": "error",
      "capitalized-comments": "error",
      complexity: "error",
      "consistent-return": "error",
      "consistent-this": "error",
      curly: "error",
      "default-case": "error",
      "default-case-last": "error",
      "default-param-last": "error",
      eqeqeq: "error",
      "func-name-matching": "error",
      "func-names": "error",
      "func-style": "error",
      "grouped-accessor-pairs": "error",
      "guard-for-in": "error",
      "id-denylist": "error",
      "id-length": "error",
      "id-match": "error",
      "logical-assignment-operators": "error",
      "max-classes-per-file": "error",
      "max-depth": "error",
      "max-nested-callbacks": "error",
      "new-cap": "error",
      "no-alert": "error",
      "no-await-in-loop": "error",
      "no-bitwise": "error",
      "no-caller": "error",
      "no-console": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-constructor-return": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-div-regex": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-else-return": "error",
      "no-empty": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-eq-null": "error",
      "no-eval": "error",
      "no-ex-assign": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-extra-boolean-cast": "error",
      "no-extra-label": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-implicit-coercion": "error",
      "no-implicit-globals": "error",
      "no-import-assign": "error",
      "no-inline-comments": "error",
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-iterator": "error",
      "no-label-var": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-multi-assign": "error",
      "no-multi-str": "error",
      "no-negated-condition": "error",
      "no-nested-ternary": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-native-nonconstructor": "error",
      "no-new-wrappers": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-object-constructor": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-param-reassign": "error",
      "no-plusplus": "error",
      "no-promise-executor-return": "error",
      "no-proto": "error",
      "no-prototype-builtins": "error",
      "no-regex-spaces": "error",
      "no-restricted-exports": "error",
      "no-restricted-globals": "error",
      "no-restricted-properties": "error",
      "no-restricted-syntax": "error",
      "no-return-assign": "error",
      "no-script-url": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-setter-return": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-template-curly-in-string": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-undef-init": "error",
      "no-undefined": "error",
      "no-unexpected-multiline": "error",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-useless-backreference": "error",
      "no-useless-call": "error",
      "no-useless-catch": "error",
      "no-useless-computed-key": "error",
      "no-useless-concat": "error",
      "no-useless-escape": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "no-void": "error",
      "no-warning-comments": "error",
      "no-with": "error",
      "object-shorthand": "error",
      "one-var": ["error", "never"],
      "operator-assignment": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-exponentiation-operator": "error",
      "prefer-named-capture-group": "error",
      "prefer-numeric-literals": "error",
      "prefer-object-has-own": "error",
      "prefer-object-spread": "error",
      "prefer-regex-literals": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      radix: "error",
      "require-atomic-updates": "error",
      "require-unicode-regexp": "error",
      "require-yield": "error",
      "sort-imports": "error",
      "sort-keys": "error",
      "sort-vars": "error",
      strict: "error",
      "symbol-description": "error",
      "unicode-bom": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "vars-on-top": "error",
      yoda: "error",
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-magic-numbers": "off",
      "no-undefined": "off",
    },
  },
);
