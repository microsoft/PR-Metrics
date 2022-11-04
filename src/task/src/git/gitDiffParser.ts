
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AddedFile, AnyFileChange, ChangedFile, GitDiff, RenamedFile } from 'parse-git-diff/build/types'
import { Octokit } from 'octokit'
import { singleton } from 'tsyringe'
import axios, { AxiosResponse } from 'axios'
import GetPullResponse from '../wrappers/octokitInterfaces/getPullResponse'
import Logger from '../utilities/logger'
import parseGitDiff from 'parse-git-diff'

/**
 * A parser for Git diffs.
 */
@singleton()
export default class GitDiffParser {
  private readonly _logger: Logger

  private _firstLineOfFiles: Map<string, number> | undefined

  /**
   * Initializes a new instance of the `GitDiffParser` class.
   * @param logger The logger.
   */
  public constructor (logger: Logger) {
    this._logger = logger
  }

  /**
   * Gets the first changed line of a specific files.
   * @param octokit The Octokit instance.
   * @param owner The owner of the repository.
   * @param repo The repository.
   * @param pullRequestId The pull request ID.
   * @param filePath The file path.
   */
  public async getFirstChangedLine (octokit: Octokit, owner: string, repo: string, pullRequestId: number, fileName: string): Promise<number> {
    this._logger.logDebug('* GitDiffParser.getFirstChangedLine()')

    const lineNumbers: Map<string, number> = await this.getFirstChangedLines(octokit, owner, repo, pullRequestId)
    const lineNumber: number | undefined = lineNumbers.get(fileName)
    if (lineNumber === undefined) {
      throw Error('Could not find the first line of file ' + fileName + '.')
    }

    return lineNumber
  }

  private async getFirstChangedLines (octokit: Octokit, owner: string, repo: string, pullRequestId: number): Promise<Map<string, number>> {
    this._logger.logDebug('* GitDiffParser.getFirstChangedLines()')

    if (this._firstLineOfFiles !== undefined) {
      return this._firstLineOfFiles
    }

    const pullRequestInfo: GetPullResponse = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullRequestId
    })

    const diffResponse: AxiosResponse<string, string> = await axios.get(pullRequestInfo.data.diff_url)
    const diffResponses: string[] = diffResponse.data.split(/^diff --git/gm)
    const parsableDiffResponses: string[] = []
    for (let i: number = 1; i < diffResponses.length; i++) {
      parsableDiffResponses.push('diff --git' + diffResponses[i])
    }

    const result: Map<string, number> = new Map<string, number>()
    parsableDiffResponses.forEach((parsableDiffResponse: string): void => {
      const diffParsed: GitDiff = parseGitDiff(parsableDiffResponse)
      if (diffParsed.files.length !== 1) {
        throw Error(diffParsed.files.length + ' files were located instead of the expected 1.')
      }

      const file: AnyFileChange = diffParsed.files[0]!
      if (file.type === 'AddedFile' || file.type === 'ChangedFile') {
        const fileCasted: AddedFile | ChangedFile = file as AddedFile | ChangedFile
        result.set(fileCasted.path, fileCasted.chunks[0]?.toFileRange.start!)
      } else if (file.type === 'RenamedFile') {
        const fileCasted: RenamedFile = file as RenamedFile
        result.set(fileCasted.pathAfter, fileCasted.chunks[0]?.toFileRange.start!)
      }
    })

    this._firstLineOfFiles = result
    return this._firstLineOfFiles
  }
}
