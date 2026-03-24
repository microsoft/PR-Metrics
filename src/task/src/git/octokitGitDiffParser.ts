/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { GetPullResponse, default as OctokitWrapper } from "../wrappers/octokitWrapper.js";
import HttpClientWrapper from "../wrappers/httpClient.js";
import Logger from "../utilities/logger.js";
import { decimalRadix } from "../utilities/constants.js";

/**
 * A parser for Git diffs read via Octokit.
 */
export default class OctokitGitDiffParser {
  private readonly _httpClient: HttpClientWrapper;
  private readonly _logger: Logger;

  private _firstLineOfFiles: Map<string, number> | null = null;

  /**
   * Initializes a new instance of the `OctokitGitDiffParser` class.
   * @param httpClient The HTTP client.
   * @param logger The logger.
   */
  public constructor(httpClient: HttpClientWrapper, logger: Logger) {
    this._httpClient = httpClient;
    this._logger = logger;
  }

  /**
   * Gets the first changed line of a specific files.
   * @param octokitWrapper The wrapper around the Octokit library.
   * @param owner The owner of the repository.
   * @param repo The repository.
   * @param pullRequestId The pull request ID.
   * @param fileName The file name for which to retrieve the line number.
   * @returns The first changed line of the specified file.
   */
  public async getFirstChangedLine(
    octokitWrapper: OctokitWrapper,
    owner: string,
    repo: string,
    pullRequestId: number,
    fileName: string,
  ): Promise<number | null> {
    this._logger.logDebug("* OctokitGitDiffParser.getFirstChangedLine()");

    const lineNumbers: Map<string, number> = await this.getFirstChangedLines(
      octokitWrapper,
      owner,
      repo,
      pullRequestId,
    );
    return lineNumbers.get(fileName) ?? null;
  }

  private async getFirstChangedLines(
    octokitWrapper: OctokitWrapper,
    owner: string,
    repo: string,
    pullRequestId: number,
  ): Promise<Map<string, number>> {
    this._logger.logDebug("* OctokitGitDiffParser.getFirstChangedLines()");

    // If the information has already been retrieved, return the cached response.
    if (this._firstLineOfFiles !== null) {
      return this._firstLineOfFiles;
    }

    // Otherwise, retrieve and process the diffs.
    const diffs: string[] = await this.getDiffs(
      octokitWrapper,
      owner,
      repo,
      pullRequestId,
    );
    this._firstLineOfFiles = this.processDiffs(diffs);
    return this._firstLineOfFiles;
  }

  private async getDiffs(
    octokitWrapper: OctokitWrapper,
    owner: string,
    repo: string,
    pullRequestId: number,
  ): Promise<string[]> {
    this._logger.logDebug("* OctokitGitDiffParser.getDiffs()");

    // Get the PR diff by extracting the URL from the Octokit response and downloading it.
    const pullRequestInfo: GetPullResponse = await octokitWrapper.getPull(
      owner,
      repo,
      pullRequestId,
    );
    const diffResponse: string = await this._httpClient.getUrl(
      pullRequestInfo.data.diff_url,
    );

    // Split the response so that each file in a diff becomes a separate diff.
    const diffResponseLines: string[] = diffResponse.split(/^diff --git/gmu);

    /*
     * For each diff, reinstate the "diff --git" prefix that was removed by the split. The first diff is excluded as it
     * will always be the empty string.
     */
    return diffResponseLines
      .slice(1)
      .map((line) => `diff --git ${line}`);
  }

  private processDiffs(diffs: string[]): Map<string, number> {
    this._logger.logDebug("* OctokitGitDiffParser.processDiffs()");

    const result: Map<string, number> = new Map<string, number>();

    for (const diff of diffs) {
      this.processSingleDiff(diff, result);
    }

    return result;
  }

  private processSingleDiff(
    diff: string,
    result: Map<string, number>,
  ): void {
    const isBinary: boolean = /^Binary files /mu.test(diff);
    const isDeleted: boolean =
      diff.includes("+++ /dev/null") || diff.includes("deleted file mode");
    const isAdded: boolean = diff.includes("new file mode");
    const renameMatch: RegExpExecArray | null =
      /^rename to (?<renamePath>.+)$/mu.exec(diff);
    const isRenamed: boolean = renameMatch !== null;

    if (isDeleted) {
      this._logger.logDebug(
        "Skipping file type 'DeletedFile' while performing diff parsing.",
      );
      return;
    }

    const filePath: string | null = this.extractFilePath(
      diff,
      isRenamed,
      renameMatch,
    );
    if (filePath === null) {
      return;
    }

    let fileType: string;
    if (isAdded) {
      fileType = "AddedFile";
    } else if (isRenamed) {
      fileType = "RenamedFile";
    } else {
      fileType = "ChangedFile";
    }

    if (isBinary) {
      this._logger.logDebug(
        `Skipping '${fileType}' '${filePath}' while performing diff parsing.`,
      );
      return;
    }

    const hunkMatch: RegExpExecArray | null =
      /@@ .+? \+(?<startLine>\d+)(?:,\d+)? @@/u.exec(diff);
    const startLine: string | undefined = hunkMatch?.groups?.startLine;
    if (typeof startLine !== "undefined") {
      result.set(filePath, parseInt(startLine, decimalRadix));
    }
  }

  private extractFilePath(
    diff: string,
    isRenamed: boolean,
    renameMatch: RegExpExecArray | null,
  ): string | null {
    if (isRenamed) {
      const renamePath: string | undefined = renameMatch?.groups?.renamePath;
      if (typeof renamePath !== "undefined") {
        return renamePath;
      }
    }

    // Try the +++ line first (present in text diffs).
    const plusMatch: RegExpExecArray | null =
      /^\+\+\+ (?:b\/)?(?<filePath>.+)$/mu.exec(diff);
    const filePath: string | undefined = plusMatch?.groups?.filePath;
    if (typeof filePath !== "undefined") {
      return filePath;
    }

    // Fall back to the diff --git header (needed for binary diffs which lack +++ lines).
    const headerMatch: RegExpExecArray | null =
      /^diff --git\s+(?:a\/)?\S+\s+(?:b\/)?(?<headerPath>\S+)$/mu.exec(diff);
    return headerMatch?.groups?.headerPath ?? null;
  }
}
