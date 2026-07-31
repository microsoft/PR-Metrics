/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type BranchStateInterface from "./interfaces/branchStateInterface.js";
import type CommitOptionsInterface from "./interfaces/commitOptionsInterface.js";
import type CommitResultInterface from "./interfaces/commitResultInterface.js";
import type FileAdditionInterface from "./interfaces/fileAdditionInterface.js";
import type GitClient from "./gitClient.js";
import type GitHubCommitApi from "./gitHubCommitApi.js";
import type LoggerInterface from "./interfaces/loggerInterface.js";
import type StagedChangeInterface from "./interfaces/stagedChangeInterface.js";
import { formatPath } from "./pathFormatter.js";

const branchExpression = /^[\w.\-/]+$/u;
const nameExpression = /^[\w.-]+$/u;
const beforeOrder = -1;
const afterOrder = 1;
const equalOrder = 0;

const compareStrings = (first: string, second: string): number => {
  if (first < second) {
    return beforeOrder;
  }

  return first > second ? afterOrder : equalOrder;
};

const isValidBranch = (branch: string): boolean =>
  branchExpression.test(branch) &&
  !branch.startsWith("-") &&
  !branch.startsWith("/") &&
  !branch.endsWith("/") &&
  !branch.endsWith(".lock") &&
  !branch.includes("//") &&
  !branch.includes("..");

const isValidName = (name: string): boolean =>
  nameExpression.test(name) && !name.startsWith("-");

const validateOptions = (options: CommitOptionsInterface): void => {
  if (!isValidBranch(options.branch)) {
    throw new Error(
      `The branch name ${formatPath(options.branch)} is invalid.`,
    );
  }

  if (!isValidName(options.owner)) {
    throw new Error(`The owner name ${formatPath(options.owner)} is invalid.`);
  }

  if (!isValidName(options.repository)) {
    throw new Error(
      `The repository name ${formatPath(options.repository)} is invalid.`,
    );
  }

  if (options.message.trim() === "") {
    throw new Error("The commit message must not be empty.");
  }
};

/**
 * A class for creating a commit from the contents of the Git index.
 */
export default class CommitCreator {
  private readonly _api: GitHubCommitApi;
  private readonly _gitClient: GitClient;
  private readonly _logger: LoggerInterface;

  /**
   * Initializes a new instance of the `CommitCreator` class.
   * @param gitClient The Git client.
   * @param api The GitHub commit API.
   * @param logger The logger.
   */
  public constructor(
    gitClient: GitClient,
    api: GitHubCommitApi,
    logger: LoggerInterface,
  ) {
    this._gitClient = gitClient;
    this._api = api;
    this._logger = logger;
  }

  /**
   * Creates a commit containing every change present in the Git index.
   * @param options The options controlling commit creation.
   * @returns A promise containing the outcome of commit creation.
   */
  public async create(
    options: CommitOptionsInterface,
  ): Promise<CommitResultInterface> {
    validateOptions(options);
    if (options.stageAll) {
      await this._gitClient.stageAll();
    }

    const headObjectId: string = await this._gitClient.getHeadObjectId();
    const changes: StagedChangeInterface[] =
      await this._gitClient.getStagedChanges();
    if (changes.length === 0) {
      this._logger.info(
        "No changes are present in the Git index, so no commit was created.",
      );
      return { committed: false, objectId: null };
    }

    const state: BranchStateInterface = await this._api.getBranchState(
      options.owner,
      options.repository,
      options.branch,
    );
    await this.resolveBranch(options, state, headObjectId);
    const additions: FileAdditionInterface[] =
      await this.buildAdditions(changes);
    const deletions: string[] = changes
      .filter(
        (value: StagedChangeInterface): boolean => value.objectId === null,
      )
      .map((value: StagedChangeInterface): string => value.path)
      .sort(compareStrings);
    this._logger.info(
      `Committing ${String(additions.length)} added or updated files and ${String(deletions.length)} deleted files to '${options.branch}'.`,
    );
    const objectId: string = await this._api.createCommit({
      additions,
      branch: options.branch,
      deletions,
      expectedHeadObjectId: headObjectId,
      message: options.message,
      nameWithOwner: `${options.owner}/${options.repository}`,
    });
    this._logger.info(`Created commit '${objectId}'.`);
    return { committed: true, objectId };
  }

  private async resolveBranch(
    options: CommitOptionsInterface,
    state: BranchStateInterface,
    headObjectId: string,
  ): Promise<void> {
    const { branchObjectId, repositoryId } = state;
    let currentObjectId: string | null = branchObjectId;
    if (currentObjectId === null) {
      if (!options.createBranch) {
        throw new Error(
          `The branch '${options.branch}' does not exist and branch creation was not requested.`,
        );
      }

      const created: boolean = await this._api.createBranch(
        repositoryId,
        options.branch,
        headObjectId,
      );
      if (created) {
        this._logger.info(
          `Created the branch '${options.branch}' at '${headObjectId}'.`,
        );
        return;
      }

      this._logger.info(
        `The branch '${options.branch}' was created concurrently, so its state is being reread.`,
      );
      const updated: BranchStateInterface = await this._api.getBranchState(
        options.owner,
        options.repository,
        options.branch,
      );
      if (updated.branchObjectId === null) {
        throw new Error(
          `The branch '${options.branch}' could not be created and does not exist.`,
        );
      }

      currentObjectId = updated.branchObjectId;
    }

    if (currentObjectId !== headObjectId) {
      throw new Error(
        `The branch '${options.branch}' points at '${currentObjectId}' but the checked out commit is '${headObjectId}'. No commit was created as the branch has moved.`,
      );
    }
  }

  private async buildAdditions(
    changes: readonly StagedChangeInterface[],
  ): Promise<FileAdditionInterface[]> {
    const additions: StagedChangeInterface[] = changes.filter(
      (value: StagedChangeInterface): boolean => value.objectId !== null,
    );
    const result: FileAdditionInterface[] = await Promise.all(
      additions.map(
        async (
          value: StagedChangeInterface,
        ): Promise<FileAdditionInterface> => {
          const contents: Buffer = await this._gitClient.readBlob(
            value.objectId ?? "",
          );
          this._logger.debug(
            `Read ${String(contents.length)} staged bytes for ${formatPath(value.path)}.`,
          );
          return { contents: contents.toString("base64"), path: value.path };
        },
      ),
    );
    return result.sort(
      (first: FileAdditionInterface, second: FileAdditionInterface): number =>
        compareStrings(first.path, second.path),
    );
  }
}
