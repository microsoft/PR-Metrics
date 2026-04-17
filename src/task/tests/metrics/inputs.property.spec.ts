/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import * as fc from "fast-check";
import { deepEqual, instance, mock, when } from "ts-mockito";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { anyString } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";
import { maxPatternCount } from "../../src/utilities/constants.js";

const numRuns = 10;

interface InputOverrides {
  readonly alwaysCloseComment?: string;
  readonly baseSize?: string;
  readonly codeFileExtensions?: string;
  readonly fileMatchingPatterns?: string;
  readonly growthRate?: string;
  readonly testFactor?: string;
  readonly testMatchingPatterns?: string;
}

const createInputs = (overrides: InputOverrides = {}): Inputs => {
  const logger: Logger = mock(Logger);
  const runnerInvoker: RunnerInvoker = mock(RunnerInvoker);
  when(runnerInvoker.loc(anyString())).thenReturn("");
  when(runnerInvoker.loc(anyString(), anyString())).thenReturn("");
  when(runnerInvoker.getInput(deepEqual(["Base", "Size"]))).thenReturn(
    overrides.baseSize ?? null,
  );
  when(runnerInvoker.getInput(deepEqual(["Growth", "Rate"]))).thenReturn(
    overrides.growthRate ?? null,
  );
  when(runnerInvoker.getInput(deepEqual(["Test", "Factor"]))).thenReturn(
    overrides.testFactor ?? null,
  );
  when(
    runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
  ).thenReturn(overrides.alwaysCloseComment ?? null);
  when(
    runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
  ).thenReturn(overrides.fileMatchingPatterns ?? null);
  when(
    runnerInvoker.getInput(deepEqual(["Test", "Matching", "Patterns"])),
  ).thenReturn(overrides.testMatchingPatterns ?? null);
  when(
    runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
  ).thenReturn(overrides.codeFileExtensions ?? null);
  return new Inputs(instance(logger), instance(runnerInvoker));
};

describe("inputs.ts", (): void => {
  describe("Property-Based Tests", (): void => {
    describe("baseSize", (): void => {
      it("should use the parsed value for any positive integer string", (): void => {
        fc.assert(
          fc.property(
            fc.integer({ max: 1_000_000, min: 1 }),
            (value: number) => {
              const inputs: Inputs = createInputs({
                baseSize: String(value),
              });
              assert.equal(inputs.baseSize, value);
            },
          ),
          { numRuns },
        );
      });

      it("should use the default for any non-positive integer string", (): void => {
        fc.assert(
          fc.property(
            fc.integer({ max: 0, min: -1_000_000 }),
            (value: number) => {
              const inputs: Inputs = createInputs({
                baseSize: String(value),
              });
              assert.equal(inputs.baseSize, InputsDefault.baseSize);
            },
          ),
          { numRuns },
        );
      });

      it("should use the default for any non-numeric string", (): void => {
        fc.assert(
          fc.property(
            fc.stringMatching(/^[A-Za-z!?@#]{1,10}$/u),
            (text: string) => {
              const inputs: Inputs = createInputs({ baseSize: text });
              assert.equal(inputs.baseSize, InputsDefault.baseSize);
            },
          ),
          { numRuns },
        );
      });
    });

    describe("growthRate", (): void => {
      it("should use the parsed value for any number greater than 1.0", (): void => {
        fc.assert(
          fc.property(
            fc.double({
              max: 1_000_000,
              min: 1.01,
              noDefaultInfinity: true,
              noNaN: true,
            }),
            (value: number) => {
              const inputs: Inputs = createInputs({
                growthRate: String(value),
              });
              assert.equal(inputs.growthRate, parseFloat(String(value)));
            },
          ),
          { numRuns },
        );
      });

      it("should use the default for any number less than or equal to 1.0", (): void => {
        fc.assert(
          fc.property(
            fc.double({
              max: 1.0,
              min: -1_000_000,
              noDefaultInfinity: true,
              noNaN: true,
            }),
            (value: number) => {
              const inputs: Inputs = createInputs({
                growthRate: String(value),
              });
              assert.equal(inputs.growthRate, InputsDefault.growthRate);
            },
          ),
          { numRuns },
        );
      });
    });

    describe("testFactor", (): void => {
      it("should use the parsed value for any positive number", (): void => {
        fc.assert(
          fc.property(
            fc.double({
              max: 1_000_000,
              min: 0.001,
              noDefaultInfinity: true,
              noNaN: true,
            }),
            (value: number) => {
              const inputs: Inputs = createInputs({
                testFactor: String(value),
              });
              assert.equal(inputs.testFactor, parseFloat(String(value)));
            },
          ),
          { numRuns },
        );
      });

      it("should use the default for any negative number", (): void => {
        fc.assert(
          fc.property(
            fc.double({
              max: -0.001,
              min: -1_000_000,
              noDefaultInfinity: true,
              noNaN: true,
            }),
            (value: number) => {
              const inputs: Inputs = createInputs({
                testFactor: String(value),
              });
              assert.equal(inputs.testFactor, InputsDefault.testFactor);
            },
          ),
          { numRuns },
        );
      });
    });

    describe("fileMatchingPatterns", (): void => {
      it("should wrap any non-empty single-line pattern in a one-element array", (): void => {
        fc.assert(
          fc.property(
            fc.stringMatching(/^[a-z]{1,20}$/u),
            (pattern: string) => {
              const inputs: Inputs = createInputs({
                fileMatchingPatterns: pattern,
              });
              assert.deepEqual(inputs.fileMatchingPatterns, [pattern]);
            },
          ),
          { numRuns },
        );
      });

      it("should split any newline-separated string into its component patterns", (): void => {
        fc.assert(
          fc.property(
            fc.array(fc.stringMatching(/^[a-z]{1,20}$/u), {
              maxLength: 10,
              minLength: 2,
            }),
            (parts: string[]) => {
              const inputs: Inputs = createInputs({
                fileMatchingPatterns: parts.join("\n"),
              });
              assert.deepEqual(inputs.fileMatchingPatterns, parts);
            },
          ),
          { numRuns },
        );
      });

      it("should replace backslashes with forward slashes", (): void => {
        fc.assert(
          fc.property(
            fc.stringMatching(/^[a-z]{1,10}$/u),
            fc.stringMatching(/^[a-z]{1,10}$/u),
            (head: string, tail: string) => {
              const inputs: Inputs = createInputs({
                fileMatchingPatterns: `${head}\\${tail}`,
              });
              assert.deepEqual(inputs.fileMatchingPatterns, [`${head}/${tail}`]);
            },
          ),
          { numRuns },
        );
      });

      it("should cap the pattern count at the configured maximum", (): void => {
        fc.assert(
          fc.property(
            fc.integer({
              max: maxPatternCount + 100,
              min: maxPatternCount + 1,
            }),
            (count: number) => {
              const input: string = Array.from(
                { length: count },
                (_value: unknown, index: number) => `pattern${String(index)}`,
              ).join("\n");
              const inputs: Inputs = createInputs({
                fileMatchingPatterns: input,
              });
              assert.equal(inputs.fileMatchingPatterns.length, maxPatternCount);
            },
          ),
          { numRuns },
        );
      });
    });

    describe("testMatchingPatterns", (): void => {
      it("should wrap any non-empty single-line pattern in a one-element array", (): void => {
        fc.assert(
          fc.property(
            fc.stringMatching(/^[a-z]{1,20}$/u),
            (pattern: string) => {
              const inputs: Inputs = createInputs({
                testMatchingPatterns: pattern,
              });
              assert.deepEqual(inputs.testMatchingPatterns, [pattern]);
            },
          ),
          { numRuns },
        );
      });

      it("should split any newline-separated string into its component patterns", (): void => {
        fc.assert(
          fc.property(
            fc.array(fc.stringMatching(/^[a-z]{1,20}$/u), {
              maxLength: 10,
              minLength: 2,
            }),
            (parts: string[]) => {
              const inputs: Inputs = createInputs({
                testMatchingPatterns: parts.join("\n"),
              });
              assert.deepEqual(inputs.testMatchingPatterns, parts);
            },
          ),
          { numRuns },
        );
      });
    });

    describe("codeFileExtensions", (): void => {
      it("should normalize extensions with wildcard prefix '*.ext' to 'ext'", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs({
              codeFileExtensions: `*.${ext}`,
            });
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext));
            assert.equal(result.size, 1);
          }),
          { numRuns },
        );
      });

      it("should normalize extensions with dot prefix '.ext' to 'ext'", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs({
              codeFileExtensions: `.${ext}`,
            });
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext));
            assert.equal(result.size, 1);
          }),
          { numRuns },
        );
      });

      it("should accept extensions without any prefix", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs({ codeFileExtensions: ext });
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext));
            assert.equal(result.size, 1);
          }),
          { numRuns },
        );
      });

      it("should normalize all extension formats to the same result", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const formats: string[] = [`*.${ext}`, `.${ext}`, ext];
            const results: Set<string>[] = formats.map(
              (format: string) =>
                createInputs({ codeFileExtensions: format }).codeFileExtensions,
            );
            const [first, second, third] = results;
            assert.deepEqual(first, second);
            assert.deepEqual(second, third);
          }),
          { numRuns },
        );
      });

      it("should convert uppercase extensions to lowercase", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[A-Z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs({ codeFileExtensions: ext });
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext.toLowerCase()));
            assert.ok(!result.has(ext));
          }),
          { numRuns },
        );
      });

      it("should handle multiple extensions separated by newlines", (): void => {
        fc.assert(
          fc.property(
            fc.array(fc.stringMatching(/^[a-z]{1,10}$/u), {
              maxLength: 5,
              minLength: 2,
            }),
            (extensions: string[]) => {
              fc.pre(new Set(extensions).size === extensions.length);
              const input: string = extensions.join("\n");
              const inputs: Inputs = createInputs({
                codeFileExtensions: input,
              });
              const result: Set<string> = inputs.codeFileExtensions;
              assert.equal(result.size, extensions.length);
              for (const ext of extensions) {
                assert.ok(result.has(ext));
              }
            },
          ),
          { numRuns },
        );
      });

      it("should deduplicate extensions with different formats", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const input = `*.${ext}\n.${ext}\n${ext}`;
            const inputs: Inputs = createInputs({ codeFileExtensions: input });
            const result: Set<string> = inputs.codeFileExtensions;
            assert.equal(result.size, 1);
            assert.ok(result.has(ext));
          }),
          { numRuns },
        );
      });

      it("should handle mixed case extensions consistently", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-zA-Z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs({ codeFileExtensions: ext });
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext.toLowerCase()));
            assert.equal(result.size, 1);
          }),
          { numRuns },
        );
      });
    });
  });
});
