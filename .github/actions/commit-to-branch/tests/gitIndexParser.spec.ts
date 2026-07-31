/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "./testUtilities/assertExtensions.js";
import {
  buildAddition,
  buildDeletion,
  buildModification,
  buildOutput,
  buildRecord,
  emptyObjectId,
  objectIdOne,
  objectIdThree,
  objectIdTwo,
} from "./testUtilities/rawIndex.js";
import assert from "node:assert/strict";
import { parseStagedChanges } from "../src/gitIndexParser.js";

describe("gitIndexParser.ts", (): void => {
  describe("parseStagedChanges()", (): void => {
    it("should return no changes when the output is empty", (): void => {
      // Arrange
      const output: Buffer = Buffer.alloc(0);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, []);
    });

    it("should parse an addition", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildAddition(objectIdTwo, "dist/index.mjs"),
      ]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [
        { objectId: objectIdTwo, path: "dist/index.mjs" },
      ]);
    });

    it("should parse a modification", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildModification(objectIdTwo, "package.json"),
      ]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [
        { objectId: objectIdTwo, path: "package.json" },
      ]);
    });

    it("should parse a deletion", (): void => {
      // Arrange
      const output: Buffer = buildOutput([buildDeletion("obsolete.txt")]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [{ objectId: null, path: "obsolete.txt" }]);
    });

    it("should parse an executable file", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildRecord(
          `:100755 100755 ${objectIdOne} ${objectIdTwo} M`,
          "scripts/run.sh",
        ),
      ]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [
        { objectId: objectIdTwo, path: "scripts/run.sh" },
      ]);
    });

    it("should parse a mode change from a regular file to an executable file", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildRecord(
          `:100644 100755 ${objectIdOne} ${objectIdTwo} M`,
          "scripts/run.sh",
        ),
      ]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [
        { objectId: objectIdTwo, path: "scripts/run.sh" },
      ]);
    });

    it("should parse SHA-256 object IDs", (): void => {
      // Arrange
      const sourceObjectId: string = "a".repeat(64);
      const destinationObjectId: string = "b".repeat(64);
      const output: Buffer = buildOutput([
        buildRecord(
          `:100644 100644 ${sourceObjectId} ${destinationObjectId} M`,
          "package.json",
        ),
      ]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [
        { objectId: destinationObjectId, path: "package.json" },
      ]);
    });

    it("should parse multiple records", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildAddition(objectIdTwo, "added.txt"),
        buildModification(objectIdThree, "modified.txt"),
        buildDeletion("deleted.txt"),
      ]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [
        { objectId: objectIdTwo, path: "added.txt" },
        { objectId: objectIdThree, path: "modified.txt" },
        { objectId: null, path: "deleted.txt" },
      ]);
    });

    {
      const testCases: string[] = [
        "file with spaces.txt",
        "file\twith\ttabs.txt",
        "file\nwith\nnewlines.txt",
        "file\rwith\rcarriage-returns.txt",
        'file"with"double-quotes.txt',
        "file'with'single-quotes.txt",
        "-leading-dash.txt",
        "--force.txt",
        "$(rm -rf /).txt",
        // eslint-disable-next-line no-template-curly-in-string -- The value is a hostile file name rather than a template.
        "${IFS}.txt",
        "`whoami`.txt",
        "semicolon;echo pwned.txt",
        "ampersand && echo pwned.txt",
        "pipe | echo pwned.txt",
        "{braces}.txt",
        "<arrow>redirect.txt",
        "colon::separator.txt",
        "::set-output name=token::value.txt",
        "\n::error::injected.txt",
        "%SYSTEMROOT%.txt",
        "back\\slash.txt",
        "glob*star?.txt",
        "Ünïcödé-文件-🚀.txt",
        "\u0001control-character.txt",
        " leading-and-trailing-space ",
      ];

      testCases.forEach((value: string): void => {
        it(`should treat the hostile path ${JSON.stringify(value)} as data`, (): void => {
          // Arrange
          const output: Buffer = buildOutput([
            buildAddition(objectIdTwo, value),
          ]);

          // Act
          const result: unknown = parseStagedChanges(output);

          // Assert
          assert.deepEqual(result, [{ objectId: objectIdTwo, path: value }]);
        });
      });
    }

    it("should not split a path that embeds a complete record", (): void => {
      // Arrange
      const path = `evil.txt\n:100644 100644 ${objectIdOne} ${objectIdTwo} M\nnested.txt`;
      const output: Buffer = buildOutput([buildAddition(objectIdTwo, path)]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [{ objectId: objectIdTwo, path }]);
    });

    it("should preserve the byte order mark within a path", (): void => {
      // Arrange
      const path = "\uFEFFbom.txt";
      const output: Buffer = buildOutput([buildAddition(objectIdTwo, path)]);

      // Act
      const result: unknown = parseStagedChanges(output);

      // Assert
      assert.deepEqual(result, [{ objectId: objectIdTwo, path }]);
    });

    it("should throw when the output does not end with a NUL character", (): void => {
      // Arrange
      const output: Buffer = Buffer.from(
        `:000000 100644 ${emptyObjectId} ${objectIdTwo} A\0truncated.txt`,
        "utf8",
      );

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        "The Git index output is malformed as it does not end with a NUL character.",
      );
    });

    it("should throw when a record has no path", (): void => {
      // Arrange
      const output: Buffer = Buffer.from(
        `:000000 100644 ${emptyObjectId} ${objectIdTwo} A\0`,
        "utf8",
      );

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        `The Git index record ":000000 100644 ${emptyObjectId} ${objectIdTwo} A" has no associated path.`,
      );
    });

    it("should throw when the metadata cannot be parsed", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildRecord("100644 100644 M", "package.json"),
      ]);

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        'The Git index record "100644 100644 M" could not be parsed.',
      );
    });

    it("should throw when an object ID is truncated", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildRecord(`:100644 100644 ${objectIdOne} abc123 M`, "package.json"),
      ]);

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        `The Git index record ":100644 100644 ${objectIdOne} abc123 M" could not be parsed.`,
      );
    });

    it("should throw when the index contains unmerged entries", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildRecord(
          `:000000 000000 ${emptyObjectId} ${emptyObjectId} U`,
          "conflicted.txt",
        ),
      ]);

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        'The Git index contains the unmerged entry "conflicted.txt".',
      );
    });

    {
      const testCases: string[] = ["R100", "C90", "T", "X"];

      testCases.forEach((value: string): void => {
        it(`should throw for the unsupported change type '${value}'`, (): void => {
          // Arrange
          const output: Buffer = buildOutput([
            buildRecord(
              `:100644 100644 ${objectIdOne} ${objectIdTwo} ${value}`,
              "package.json",
            ),
          ]);

          // Act & Assert
          AssertExtensions.toThrow(
            (): unknown => parseStagedChanges(output),
            `The Git index record for "package.json" uses the unsupported change type '${value}'.`,
          );
        });
      });
    }

    {
      const testCases: string[] = ["120000", "160000", "040000", "100664"];

      testCases.forEach((value: string): void => {
        it(`should throw when a file is added with the unsupported mode '${value}'`, (): void => {
          // Arrange
          const output: Buffer = buildOutput([
            buildRecord(
              `:000000 ${value} ${emptyObjectId} ${objectIdTwo} A`,
              "unsupported",
            ),
          ]);

          // Act & Assert
          AssertExtensions.toThrow(
            (): unknown => parseStagedChanges(output),
            `The Git index record for "unsupported" uses the unsupported file mode '${value}'.`,
          );
        });

        it(`should throw when a file is deleted with the unsupported mode '${value}'`, (): void => {
          // Arrange
          const output: Buffer = buildOutput([
            buildRecord(
              `:${value} 000000 ${objectIdOne} ${emptyObjectId} D`,
              "unsupported",
            ),
          ]);

          // Act & Assert
          AssertExtensions.toThrow(
            (): unknown => parseStagedChanges(output),
            `The Git index record for "unsupported" uses the unsupported file mode '${value}'.`,
          );
        });
      });
    }

    it("should throw when a path is not valid UTF-8", (): void => {
      // Arrange
      const path: Buffer = Buffer.from([0x66, 0x6f, 0xff, 0xfe, 0x6f]);
      const output: Buffer = buildOutput([buildAddition(objectIdTwo, path)]);

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        "The Git index contains a path that is not valid UTF-8.",
      );
    });

    it("should throw when a path is empty", (): void => {
      // Arrange
      const output: Buffer = buildOutput([buildAddition(objectIdTwo, "")]);

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        "The Git index contains a record with an empty path.",
      );
    });

    it("should throw when a path is duplicated", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildAddition(objectIdTwo, "duplicate.txt"),
        buildModification(objectIdThree, "duplicate.txt"),
      ]);

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        'The Git index contains multiple records for the path "duplicate.txt".',
      );
    });

    it("should throw when an addition has no staged object ID", (): void => {
      // Arrange
      const output: Buffer = buildOutput([
        buildRecord(
          `:000000 100644 ${emptyObjectId} ${emptyObjectId} A`,
          "empty.txt",
        ),
      ]);

      // Act & Assert
      AssertExtensions.toThrow(
        (): unknown => parseStagedChanges(output),
        'The Git index record for "empty.txt" has no staged object ID.',
      );
    });
  });
});
