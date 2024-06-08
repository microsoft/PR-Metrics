/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */
import Logger from '../../src/utilities/logger'
import OctokitGitDiffParser from '../../src/git/octokitGitDiffParser'
import assert from 'node:assert/strict'

/* eslint-disable camelcase -- Required for alignment with Octokit. */
          when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
          when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> => Promise.resolve(diff))
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> =>
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> =>
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> =>
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> =>
      verify(logger.logDebug('Skipping file type \'DeletedFile\' while performing diff parsing.')).once()
    })

    it('should return null when considering an added binary file', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> =>
        Promise.resolve('diff --git a/file.png b/file.png\n' +
          'new file mode 100644\n' +
          'index 00000000..8318c87e'))
          const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

          // Act
          const result: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')

          // Assert
          assert.equal(result, null)
          verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).once()
          verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).once()
          verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
          verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
          verify(logger.logDebug('Skipping file type \'DeletedFile\' while performing diff parsing.')).once()
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> =>
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall(async (): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall(async (): Promise<string> =>