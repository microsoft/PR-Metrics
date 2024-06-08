/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import parseGitDiff, { AddedFile, AnyFileChange, ChangedFile, Chunk, GitDiff, RenamedFile } from 'parse-git-diff'
import AxiosWrapper from '../wrappers/axiosWrapper'
import GetPullResponse from '../wrappers/octokitInterfaces/getPullResponse'
import Logger from '../utilities/logger'
import OctokitWrapper from '../wrappers/octokitWrapper'
import { singleton } from 'tsyringe'

/**
 * A parser for Git diffs read via Octokit.
 */
@singleton()
export default class OctokitGitDiffParser {
  private readonly _axiosWrapper: AxiosWrapper
  private readonly _logger: Logger

  private _firstLineOfFiles: Map<string, number> | undefined

  /**
   * Initializes a new instance of the `OctokitGitDiffParser` class.
   * @param axiosWrapper The Axios wrapper.
   * @param logger The logger.
   */
  public constructor (axiosWrapper: AxiosWrapper, logger: Logger) {
    this._axiosWrapper = axiosWrapper
    this._logger = logger
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
  public async getFirstChangedLine (octokitWrapper: OctokitWrapper, owner: string, repo: string, pullRequestId: number, fileName: string): Promise<number | null> {
    this._logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')

    const lineNumbers: Map<string, number> = await this.getFirstChangedLines(octokitWrapper, owner, repo, pullRequestId)
    return lineNumbers.get(fileName) ?? null
  }

  private async getFirstChangedLines (octokitWrapper: OctokitWrapper, owner: string, repo: string, pullRequestId: number): Promise<Map<string, number>> {
    this._logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')

    // If the information has already been retrieved, return the cached response.
    if (this._firstLineOfFiles !== undefined) {
      return this._firstLineOfFiles
    }

    // Otherwise, retrieve and process the diffs.
    const diffs: string[] = await this.getDiffs(octokitWrapper, owner, repo, pullRequestId)
    this._firstLineOfFiles = this.processDiffs(diffs)
    return this._firstLineOfFiles
  }

  private async getDiffs (octokitWrapper: OctokitWrapper, owner: string, repo: string, pullRequestId: number): Promise<string[]> {
    this._logger.logDebug('* OctokitGitDiffParser.getDiffs()')

    // Get the PR diff by extracting the URL from the Octokit response and downloading it.
    const pullRequestInfo: GetPullResponse = await octokitWrapper.getPull(owner, repo, pullRequestId)
    const diffResponse: string = await this._axiosWrapper.getUrl(pullRequestInfo.data.diff_url)

    // Split the response so that each file in a diff becomes a separate diff.
    const diffResponses: string[] = diffResponse.split(/^diff --git/gmu)

    /**
     * For each diff, reinstate the "diff --git" prefix that was removed by the split. The first diff is excluded as it
     * will always be the empty string.
     */
    const result: string[] = []
    for (let iteration: number = 1; iteration < diffResponses.length; iteration += 1) {
      result.push(`diff --git${  diffResponses[iteration]}`)
    }

    return result
  }

  private processDiffs (diffs: string[]): Map<string, number> {
    this._logger.logDebug('* OctokitGitDiffParser.processDiffs()')

    const result: Map<string, number> = new Map<string, number>()

    // Process the diff for each file.
    diffs.forEach((diff: string): void => {
      const diffParsed: GitDiff = parseGitDiff(diff)

      // Process the diff for a single file.
      diffParsed.files.forEach((file: AnyFileChange): void => {
        switch (file.type) {
          case 'AddedFile':
          case 'ChangedFile':
          {
            // For an added or changed file, add the file path and the first changed line.
            const fileCasted: AddedFile | ChangedFile = file
            result.set(fileCasted.path, (fileCasted.chunks[0] as Chunk).toFileRange.start)
            break
          }
          case 'RenamedFile':
          {
            // For a renamed file, add the new file path and the first changed line.
            const fileCasted: RenamedFile = file
            result.set(fileCasted.pathAfter, (fileCasted.chunks[0] as Chunk)?.toFileRange.start)
            break
          }
          default:
            this._logger.logDebug(`Skipping file type '${file.type}' when performing diff parsing.`)
            break
        }
      })
    })

    return result
  }
}
