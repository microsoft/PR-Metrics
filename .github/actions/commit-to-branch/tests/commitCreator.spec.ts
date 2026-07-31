/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "./testUtilities/assertExtensions.js";
import {
  blobArgs,
  headArgs,
  stageAllArgs,
  stagedChangesArgs,
} from "./testUtilities/gitArguments.js";
import {
  buildAddition,
  buildDeletion,
  buildModification,
  buildOutput,
  commitObjectId,
  headObjectId,
  objectIdThree,
  objectIdTwo,
} from "./testUtilities/rawIndex.js";
import CommitCreator from "../src/commitCreator.js";
import type CommitOptionsInterface from "../src/interfaces/commitOptionsInterface.js";
import FakeCommandRunner from "./testUtilities/fakeCommandRunner.js";
import FakeGraphQlClient from "./testUtilities/fakeGraphQlClient.js";
import FakeLogger from "./testUtilities/fakeLogger.js";
import GitClient from "../src/gitClient.js";
import GitHubCommitApi from "../src/gitHubCommitApi.js";
import assert from "node:assert/strict";

const repositoryId = "R_kgDOABCDEF";
const branchName = "release/v1.7.16";
const commitMessage = "feat: release v1.7.16";
const advancedObjectId = "d".repeat(40);

const defaultOptions: CommitOptionsInterface = {
  branch: branchName,
  createBranch: false,
  message: commitMessage,
  owner: "microsoft",
  repository: "PR-Metrics",
  stageAll: false,
};

const buildCreator = (
  commandRunner: FakeCommandRunner,
  client: FakeGraphQlClient,
  logger: FakeLogger,
): CommitCreator =>
  new CommitCreator(
    new GitClient(commandRunner),
    new GitHubCommitApi(client),
    logger,
  );

const buildBranchState = (objectId: string | null): unknown => ({
  repository: {
    id: repositoryId,
    ref: objectId === null ? null : { target: { oid: objectId } },
  },
});

const buildCommitResponse = (): unknown => ({
  createCommitOnBranch: { commit: { oid: commitObjectId } },
});

const buildCreateRefResponse = (): unknown => ({
  createRef: { ref: { name: `refs/heads/${branchName}` } },
});

describe("commitCreator.ts", (): void => {
  describe("create()", (): void => {
    it("should report that nothing was committed when the index is empty", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(stagedChangesArgs, Buffer.alloc(0));
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      const result: unknown = await creator.create(defaultOptions);

      // Assert
      assert.deepEqual(result, { committed: false, objectId: null });
      assert.deepEqual(client.requests, []);
    });

    it("should stage all changes through the argument vector when requested", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(stageAllArgs, "");
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(stagedChangesArgs, Buffer.alloc(0));
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      await creator.create({ ...defaultOptions, stageAll: true });

      // Assert
      assert.deepEqual(commandRunner.invocations[0], [...stageAllArgs]);
    });

    it("should not stage changes when staging is not requested", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(stagedChangesArgs, Buffer.alloc(0));
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      await creator.create(defaultOptions);

      // Assert
      assert.deepEqual(
        commandRunner.invocations.filter(
          (value: string[]): boolean => value[0] === "add",
        ),
        [],
      );
    });

    it("should commit additions and deletions read from the index", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([
          buildModification(objectIdThree, "package.json"),
          buildDeletion("obsolete.txt"),
          buildAddition(objectIdTwo, "dist/index.mjs"),
        ]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "bundle");
      commandRunner.setResponse(blobArgs(objectIdThree), "manifest");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(headObjectId));
      client.enqueue(buildCommitResponse());
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      const result: unknown = await creator.create(defaultOptions);

      // Assert
      assert.deepEqual(result, { committed: true, objectId: commitObjectId });
      assert.equal(client.requests.length, 2);
      assert.deepEqual(client.requests[1]?.variables, {
        input: {
          branch: {
            branchName,
            repositoryNameWithOwner: "microsoft/PR-Metrics",
          },
          expectedHeadOid: headObjectId,
          fileChanges: {
            additions: [
              {
                contents: Buffer.from("bundle", "utf8").toString("base64"),
                path: "dist/index.mjs",
              },
              {
                contents: Buffer.from("manifest", "utf8").toString("base64"),
                path: "package.json",
              },
            ],
            deletions: [{ path: "obsolete.txt" }],
          },
          message: { headline: commitMessage },
        },
      });
    });

    it("should encode binary and empty blobs without alteration", async (): Promise<void> => {
      // Arrange
      const binary: Buffer = Buffer.from([0x00, 0xff, 0xfe, 0x80, 0x0a]);
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([
          buildAddition(objectIdTwo, "binary.bin"),
          buildAddition(objectIdThree, "empty.txt"),
        ]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), binary);
      commandRunner.setResponse(blobArgs(objectIdThree), Buffer.alloc(0));
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(headObjectId));
      client.enqueue(buildCommitResponse());
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      await creator.create(defaultOptions);

      // Assert
      const { variables } = client.requests[1] ?? { variables: {} };
      assert.deepEqual(variables, {
        input: {
          branch: {
            branchName,
            repositoryNameWithOwner: "microsoft/PR-Metrics",
          },
          expectedHeadOid: headObjectId,
          fileChanges: {
            additions: [
              { contents: binary.toString("base64"), path: "binary.bin" },
              { contents: "", path: "empty.txt" },
            ],
            deletions: [],
          },
          message: { headline: commitMessage },
        },
      });
    });

    it("should pass hostile paths through as data", async (): Promise<void> => {
      // Arrange
      const addedPath = "$(rm -rf /)\n::error::injected\t`whoami`.txt";
      const deletedPath = "deleted; echo pwned {}.txt";
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([
          buildAddition(objectIdTwo, addedPath),
          buildDeletion(deletedPath),
        ]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(headObjectId));
      client.enqueue(buildCommitResponse());
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      await creator.create(defaultOptions);

      // Assert
      assert.deepEqual(client.requests[1]?.variables, {
        input: {
          branch: {
            branchName,
            repositoryNameWithOwner: "microsoft/PR-Metrics",
          },
          expectedHeadOid: headObjectId,
          fileChanges: {
            additions: [
              {
                contents: Buffer.from("contents", "utf8").toString("base64"),
                path: addedPath,
              },
            ],
            deletions: [{ path: deletedPath }],
          },
          message: { headline: commitMessage },
        },
      });
      assert.deepEqual(commandRunner.invocations, [
        [...headArgs],
        [...stagedChangesArgs],
        [...blobArgs(objectIdTwo)],
      ]);
    });

    it("should never write a hostile path directly into the log output", async (): Promise<void> => {
      // Arrange
      const addedPath = "\n::add-mask::secret\nevil.txt";
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, addedPath)]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(headObjectId));
      client.enqueue(buildCommitResponse());
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      await creator.create(defaultOptions);

      // Assert
      logger.messages.forEach((value: string): void => {
        assert.equal(value.includes("\n"), false);
        assert.equal(value.includes("\r"), false);
      });
      assert.equal(
        logger.messages.some((value: string): boolean =>
          value.includes('"\\n::add-mask::secret\\nevil.txt"'),
        ),
        true,
      );
    });

    it("should read content from the index rather than the working tree", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildModification(objectIdTwo, "diverged.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "staged contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(headObjectId));
      client.enqueue(buildCommitResponse());
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      await creator.create(defaultOptions);

      // Assert
      assert.deepEqual(client.requests[1]?.variables, {
        input: {
          branch: {
            branchName,
            repositoryNameWithOwner: "microsoft/PR-Metrics",
          },
          expectedHeadOid: headObjectId,
          fileChanges: {
            additions: [
              {
                contents: Buffer.from("staged contents", "utf8").toString(
                  "base64",
                ),
                path: "diverged.txt",
              },
            ],
            deletions: [],
          },
          message: { headline: commitMessage },
        },
      });
      assert.deepEqual(
        commandRunner.invocations.filter(
          (value: string[]): boolean => value[0] === "cat-file",
        ),
        [[...blobArgs(objectIdTwo)]],
      );
    });

    it("should throw when the remote branch has advanced beyond the checked out commit", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, "added.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(advancedObjectId));
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => creator.create(defaultOptions),
        `The branch 'release/v1.7.16' points at '${advancedObjectId}' but the checked out commit is '${headObjectId}'. No commit was created as the branch has moved.`,
      );
      assert.equal(client.requests.length, 1);
    });

    it("should throw when the branch does not exist and creation is not permitted", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, "added.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(null));
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => creator.create(defaultOptions),
        "The branch 'release/v1.7.16' does not exist and branch creation was not requested.",
      );
      assert.equal(client.requests.length, 1);
    });

    it("should create the branch from the checked out commit when permitted", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, "added.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(null));
      client.enqueue(buildCreateRefResponse());
      client.enqueue(buildCommitResponse());
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      const result: unknown = await creator.create({
        ...defaultOptions,
        createBranch: true,
      });

      // Assert
      assert.deepEqual(result, { committed: true, objectId: commitObjectId });
      assert.equal(client.requests.length, 3);
      assert.deepEqual(client.requests[1]?.variables, {
        input: {
          name: `refs/heads/${branchName}`,
          oid: headObjectId,
          repositoryId,
        },
      });
      assert.deepEqual(client.requests[2]?.variables, {
        input: {
          branch: {
            branchName,
            repositoryNameWithOwner: "microsoft/PR-Metrics",
          },
          expectedHeadOid: headObjectId,
          fileChanges: {
            additions: [
              {
                contents: Buffer.from("contents", "utf8").toString("base64"),
                path: "added.txt",
              },
            ],
            deletions: [],
          },
          message: { headline: commitMessage },
        },
      });
    });

    it("should continue when a racing branch creation produced the same commit", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, "added.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(null));
      client.enqueue(
        new Error(
          "A ref named 'refs/heads/release/v1.7.16' already exists in the repository.",
        ),
      );
      client.enqueue(buildBranchState(headObjectId));
      client.enqueue(buildCommitResponse());
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act
      const result: unknown = await creator.create({
        ...defaultOptions,
        createBranch: true,
      });

      // Assert
      assert.deepEqual(result, { committed: true, objectId: commitObjectId });
      assert.equal(client.requests.length, 4);
      assert.equal(
        client.requests[3]?.query.includes(
          "createCommitOnBranch(input: $input)",
        ),
        true,
      );
    });

    it("should throw when a racing branch creation produced a different commit", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, "added.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(null));
      client.enqueue(
        new Error(
          "A ref named 'refs/heads/release/v1.7.16' already exists in the repository.",
        ),
      );
      client.enqueue(buildBranchState(advancedObjectId));
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> =>
          creator.create({ ...defaultOptions, createBranch: true }),
        `The branch 'release/v1.7.16' points at '${advancedObjectId}' but the checked out commit is '${headObjectId}'. No commit was created as the branch has moved.`,
      );
      assert.equal(client.requests.length, 3);
    });

    it("should throw when a racing branch creation removed the branch again", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, "added.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(null));
      client.enqueue(
        new Error(
          "A ref named 'refs/heads/release/v1.7.16' already exists in the repository.",
        ),
      );
      client.enqueue(buildBranchState(null));
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> =>
          creator.create({ ...defaultOptions, createBranch: true }),
        "The branch 'release/v1.7.16' could not be created and does not exist.",
      );
    });

    it("should not retry when the head has advanced during commit creation", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([buildAddition(objectIdTwo, "added.txt")]),
      );
      commandRunner.setResponse(blobArgs(objectIdTwo), "contents");
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(buildBranchState(headObjectId));
      client.enqueue(
        new Error(
          "Expected branch to point to specific commit but it did not.",
        ),
      );
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => creator.create(defaultOptions),
        "Expected branch to point to specific commit but it did not.",
      );
      assert.equal(client.requests.length, 2);
    });

    {
      const testCases: string[] = [
        "",
        "-dangerous",
        "/leading-slash",
        "trailing-slash/",
        "double//slash",
        "with space",
        "with\nnewline",
        "with..dots",
        "with~tilde",
        "with^caret",
        "with:colon",
        "with?question",
        "with*star",
        "with[bracket",
        "with\\backslash",
        "refs/heads/../../evil",
        "release.lock",
      ];

      testCases.forEach((value: string): void => {
        it(`should throw without contacting Git or GitHub for the invalid branch ${JSON.stringify(value)}`, async (): Promise<void> => {
          // Arrange
          const commandRunner: FakeCommandRunner = new FakeCommandRunner();
          const client: FakeGraphQlClient = new FakeGraphQlClient();
          const logger: FakeLogger = new FakeLogger();
          const creator: CommitCreator = buildCreator(
            commandRunner,
            client,
            logger,
          );

          // Act & Assert
          await AssertExtensions.toThrowAsync(
            async (): Promise<unknown> =>
              creator.create({ ...defaultOptions, branch: value }),
            `The branch name ${JSON.stringify(value)} is invalid.`,
          );
          assert.deepEqual(commandRunner.invocations, []);
          assert.deepEqual(client.requests, []);
        });
      });
    }

    {
      const testCases: string[] = ["", "owner/repository", "with space", "-x"];

      testCases.forEach((value: string): void => {
        it(`should throw for the invalid repository name ${JSON.stringify(value)}`, async (): Promise<void> => {
          // Arrange
          const commandRunner: FakeCommandRunner = new FakeCommandRunner();
          const client: FakeGraphQlClient = new FakeGraphQlClient();
          const logger: FakeLogger = new FakeLogger();
          const creator: CommitCreator = buildCreator(
            commandRunner,
            client,
            logger,
          );

          // Act & Assert
          await AssertExtensions.toThrowAsync(
            async (): Promise<unknown> =>
              creator.create({ ...defaultOptions, repository: value }),
            `The repository name ${JSON.stringify(value)} is invalid.`,
          );
          assert.deepEqual(client.requests, []);
        });
      });
    }

    it("should throw when the commit message is empty", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      const logger: FakeLogger = new FakeLogger();
      const creator: CommitCreator = buildCreator(
        commandRunner,
        client,
        logger,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> =>
          creator.create({ ...defaultOptions, message: "  " }),
        "The commit message must not be empty.",
      );
      assert.deepEqual(client.requests, []);
    });
  });
});
