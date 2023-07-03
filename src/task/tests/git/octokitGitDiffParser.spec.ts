// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import 'reflect-metadata'
import { instance, mock, verify, when } from 'ts-mockito'
import OctokitGitDiffParser from '../../src/git/octokitGitDiffParser'
import Logger from '../../src/utilities/logger'
import AxiosWrapper from '../../src/wrappers/axiosWrapper'
import GetPullResponse from '../../src/wrappers/octokitInterfaces/getPullResponse'
import OctokitWrapper from '../../src/wrappers/octokitWrapper'

describe('octokitGitDiffParser.ts', (): void => {
  let axiosWrapper: AxiosWrapper
  let logger: Logger
  let octokitWrapper: OctokitWrapper

  beforeEach((): void => {
    axiosWrapper = mock(AxiosWrapper)
    logger = mock(Logger)
    octokitWrapper = mock(OctokitWrapper)
  })

  describe('getFirstChangedLine()', (): void => {
    {
      interface TestCaseType {
        fileCount: number
        diff: string
        lineNumber: number
      }

      const testCases: TestCaseType[] = [
        {
          fileCount: 1,
          diff: 'diff --git file.ts file.ts\n' +
            'index 6b76988..47f1131b 100646\n' +
            '--- file.ts\n' +
            '+++ file.ts\n' +
            '@@ -11,2 +11,3 @@ Line 1\n' +
            '+Line 2\n' +
            ' Line 3',
          lineNumber: 11
        },
        {
          fileCount: 2,
          diff: 'diff --git oldFile.ts oldFile.ts\n' +
            'index 6b76988..47f1131b 100646\n' +
            '--- oldFile.ts\n' +
            '+++ oldFile.ts\n' +
            '@@ -11,2 +11,3 @@ Line 1\n' +
            '+Line 2\n' +
            ' Line 3\n' +
            'diff --git oldFile.ts file.ts\n' +
            'index 6b76988..47f1131b 100646\n' +
            '--- file.ts\n' +
            '+++ file.ts\n' +
            '@@ -100,2 +100,3 @@ Line 1\n' +
            '+Line 2\n' +
            ' Line 3',
          lineNumber: 100
        },
        {
          fileCount: 3,
          diff: 'diff --git oldFile.ts oldFile.ts\n' +
            'index 6b76988..47f1131b 100646\n' +
            '--- oldFile.ts\n' +
            '+++ oldFile.ts\n' +
            '@@ -11,2 +11,3 @@ Line 1\n' +
            '+Line 2\n' +
            ' Line 3\n' +
            'diff --git file.ts file.ts\n' +
            'index 6b76988..47f1131b 100646\n' +
            '--- file.ts\n' +
            '+++ file.ts\n' +
            '@@ -100,2 +100,3 @@ Line 1\n' +
            '+Line 2\n' +
            ' Line 3\n' +
            'diff --git otherFile.ts otherFile.ts\n' +
            'index 6b76988..47f1131b 100646\n' +
            '--- otherFile.ts\n' +
            '+++ otherFile.ts\n' +
            '@@ -200,2 +200,3 @@ Line 1\n' +
            '+Line 2\n' +
            ' Line 3',
          lineNumber: 100
        }
      ]

      testCases.forEach(({ fileCount, diff, lineNumber }: TestCaseType): void => {
        it(`should return the correct line number when ${fileCount} changed files are present`, async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall((): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
          when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall((): Promise<string> => Promise.resolve(diff))
          const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

          // Act
          const result: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')

          // Assert
          expect(result).to.equal(lineNumber)
          verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).once()
          verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).once()
          verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
          verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
        })
      })
    }

    it('should return the correct line number when considering a renamed file', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall((): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall((): Promise<string> =>
        Promise.resolve('diff --git a/oldFile.ts b/file.ts\n' +
          'similarity index 99%\n' +
          'rename from oldFile.ts\n' +
          'rename to file.ts\n' +
          'index b2985bb0..54d73d2a 100754\n' +
          '--- a/oldFile.ts\n' +
          '+++ b/file.ts\n' +
            '@@ -11,2 +11,3 @@ Line 1\n' +
            '+Line 2\n' +
            ' Line 3'))
      const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

      // Act
      const result: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')

      // Assert
      expect(result).to.equal(11)
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
    })

    it('should return the correct line number when considering a renamed file with no changes', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall((): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall((): Promise<string> =>
        Promise.resolve('diff --git a/oldFile.ts b/file.ts\n' +
          'similarity index 100%\n' +
          'rename from oldFile.ts\n' +
          'rename to file.ts'))
      const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

      // Act
      const result: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
    })

    it('should return the correct line number when considering an added file', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall((): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall((): Promise<string> =>
        Promise.resolve('diff --git a/file.ts b/file.ts\n' +
          'new file mode 100754\n' +
          'index 00000000..8318c87e\n' +
          '--- /dev/null\n' +
          '+++ b/file.ts\n' +
          '@@ -0,0 +1 @@\n' +
          '+Line 1\n' +
          '\\ No newline at end of file'))
      const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

      // Act
      const result: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')

      // Assert
      expect(result).to.equal(1)
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
    })

    it('should return null when considering a deleted file', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall((): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall((): Promise<string> =>
        Promise.resolve('diff --git a/file.ts b/file.ts\n' +
          'deleted file mode 100754\n' +
          'index 68adfef0..00000000\n' +
          '--- a/file.ts\n' +
          '+++ /dev/null\n' +
          '@@ -1,1 +0,0 @@\n' +
          '-Line 1'))
      const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

      // Act
      const result: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
    })

    it('should return the correct line number when called twice', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall((): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall((): Promise<string> =>
        Promise.resolve('diff --git oldFile.ts file.ts\n' +
          'index 6b76988..47f1131b 100646\n' +
          '--- oldFile.ts\n' +
          '+++ file.ts\n' +
          '@@ -11,2 +11,3 @@ Line 1\n' +
          '+Line 2\n' +
          ' Line 3'))
      const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

      // Act
      const result1: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')
      const result2: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'file.ts')

      // Assert
      expect(result1).to.equal(11)
      expect(result2).to.equal(11)
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).twice()
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).twice()
      verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
    })

    it('should return null when an unknown file is specified', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getPull('owner', 'repo', 1)).thenCall((): Promise<GetPullResponse> => Promise.resolve({ data: { diff_url: 'https://github.com/microsoft/PR-Metrics' } } as GetPullResponse))
      when(axiosWrapper.getUrl('https://github.com/microsoft/PR-Metrics')).thenCall((): Promise<string> =>
        Promise.resolve('diff --git oldFile.ts file.ts\n' +
          'index 6b76988..47f1131b 100646\n' +
          '--- oldFile.ts\n' +
          '+++ file.ts\n' +
          '@@ -11,2 +11,3 @@ Line 1\n' +
          '+Line 2\n' +
          ' Line 3'))
      const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(instance(axiosWrapper), instance(logger))

      // Act
      const result: number | null = await octokitGitDiffParser.getFirstChangedLine(instance(octokitWrapper), 'owner', 'repo', 1, 'oldFile.ts')

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLine()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getFirstChangedLines()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.getDiffs()')).once()
      verify(logger.logDebug('* OctokitGitDiffParser.processDiffs()')).once()
    })
  })
})
