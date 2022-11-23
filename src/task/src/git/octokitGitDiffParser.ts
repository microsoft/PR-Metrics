
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AddedFile, AnyFileChange, ChangedFile, GitDiff, RenamedFile } from 'parse-git-diff/build/types'
import { singleton } from 'tsyringe'
import AxiosWrapper from '../wrappers/axiosWrapper'
import GetPullResponse from '../wrappers/octokitInterfaces/getPullResponse'
import Logger from '../utilities/logger'
import OctokitWrapper from '../wrappers/octokitWrapper'
import parseGitDiff from 'parse-git-diff'

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

    if (this._firstLineOfFiles !== undefined) {
      return this._firstLineOfFiles
    }

    const pullRequestInfo: GetPullResponse = await octokitWrapper.getPull(owner, repo, pullRequestId)
    const diffResponse: string = await this._axiosWrapper.getUrl(pullRequestInfo.data.diff_url)
    const diffResponses: string[] = diffResponse.split(/^diff --git/gm)
    const parsableDiffResponses: string[] = []
    for (let i: number = 1; i < diffResponses.length; i++) {
      parsableDiffResponses.push('diff --git' + diffResponses[i])
    }

    const result: Map<string, number> = new Map<string, number>()
    parsableDiffResponses.forEach((parsableDiffResponse: string): void => {
      const diffParsed: GitDiff = parseGitDiff(parsableDiffResponse)
      diffParsed.files.forEach((file: AnyFileChange): void => {
        if (file.type === 'AddedFile' || file.type === 'ChangedFile') {
          const fileCasted: AddedFile | ChangedFile = file as AddedFile | ChangedFile
          result.set(fileCasted.path, fileCasted.chunks[0]!.toFileRange.start)
        } else if (file.type === 'RenamedFile') {
          const fileCasted: RenamedFile = file as RenamedFile
          result.set(fileCasted.pathAfter, fileCasted.chunks[0]?.toFileRange.start!)
        }
      })
    })

    this._firstLineOfFiles = result
    return this._firstLineOfFiles
  }
}
