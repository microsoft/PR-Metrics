/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as fc from "fast-check";
import { deepEqual, instance, mock, when } from "ts-mockito";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { anyString } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";

describe("inputs.ts", (): void => {
  describe("Property-Based Tests", (): void => {
    describe("codeFileExtensions", (): void => {
      const createInputs = (codeFileExtensions: string): Inputs => {
        const logger: Logger = mock(Logger);
        const runnerInvoker: RunnerInvoker = mock(RunnerInvoker);
        when(runnerInvoker.loc(anyString())).thenReturn("");
        when(runnerInvoker.loc(anyString(), anyString())).thenReturn("");
        when(runnerInvoker.getInput(deepEqual(["Base", "Size"]))).thenReturn(
          null,
        );
        when(runnerInvoker.getInput(deepEqual(["Growth", "Rate"]))).thenReturn(
          null,
        );
        when(runnerInvoker.getInput(deepEqual(["Test", "Factor"]))).thenReturn(
          null,
        );
        when(
          runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
        ).thenReturn(null);
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn(null);
        when(
          runnerInvoker.getInput(deepEqual(["Test", "Matching", "Patterns"])),
        ).thenReturn(null);
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn(codeFileExtensions);
        return new Inputs(instance(logger), instance(runnerInvoker));
      };

      it("should normalize extensions with wildcard prefix '*.ext' to 'ext'", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs(`*.${ext}`);
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext));
            assert.equal(result.size, 1);
          }),
        );
      });

      it("should normalize extensions with dot prefix '.ext' to 'ext'", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs(`.${ext}`);
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext));
            assert.equal(result.size, 1);
          }),
        );
      });

      it("should accept extensions without any prefix", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs(ext);
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext));
            assert.equal(result.size, 1);
          }),
        );
      });

      it("should normalize all extension formats to the same result", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const formats: string[] = [`*.${ext}`, `.${ext}`, ext];
            const results: Set<string>[] = formats.map(
              (format: string) => createInputs(format).codeFileExtensions,
            );
            const [first, second, third] = results;
            assert.deepEqual(first, second);
            assert.deepEqual(second, third);
          }),
        );
      });

      it("should convert uppercase extensions to lowercase", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[A-Z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs(ext);
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext.toLowerCase()));
            assert.ok(!result.has(ext));
          }),
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
              const inputs: Inputs = createInputs(input);
              const result: Set<string> = inputs.codeFileExtensions;
              assert.equal(result.size, extensions.length);
              for (const ext of extensions) {
                assert.ok(result.has(ext));
              }
            },
          ),
        );
      });

      it("should deduplicate extensions with different formats", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-z]{1,10}$/u), (ext: string) => {
            const input = `*.${ext}\n.${ext}\n${ext}`;
            const inputs: Inputs = createInputs(input);
            const result: Set<string> = inputs.codeFileExtensions;
            assert.equal(result.size, 1);
            assert.ok(result.has(ext));
          }),
        );
      });

      it("should handle mixed case extensions consistently", (): void => {
        fc.assert(
          fc.property(fc.stringMatching(/^[a-zA-Z]{1,10}$/u), (ext: string) => {
            const inputs: Inputs = createInputs(ext);
            const result: Set<string> = inputs.codeFileExtensions;
            assert.ok(result.has(ext.toLowerCase()));
            assert.equal(result.size, 1);
          }),
        );
      });
    });
  });
});
