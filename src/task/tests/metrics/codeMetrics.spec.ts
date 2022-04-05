// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import * as InputsDefault from '../../src/metrics/inputsDefault'
import CodeMetrics from '../../src/metrics/codeMetrics'
import CodeMetricsData from '../../src/metrics/codeMetricsData'
import GitInvoker from '../../src/git/gitInvoker'
import Inputs from '../../src/metrics/inputs'
import Logger from '../../src/utilities/logger'
import RunnerInvoker from '../../src/runners/runnerInvoker'

describe('codeMetrics.ts', (): void => {
  let gitInvoker: GitInvoker
  let inputs: Inputs
  let logger: Logger
  let runnerInvoker: RunnerInvoker

  beforeEach((): void => {
    gitInvoker = mock(GitInvoker)

    inputs = mock(Inputs)
    when(inputs.baseSize).thenReturn(InputsDefault.baseSize)
    when(inputs.growthRate).thenReturn(InputsDefault.growthRate)
    when(inputs.testFactor).thenReturn(InputsDefault.testFactor)
    when(inputs.fileMatchingPatterns).thenReturn(InputsDefault.fileMatchingPatterns)
    when(inputs.codeFileExtensions).thenReturn(new Set<string>(InputsDefault.codeFileExtensions))

    logger = mock(Logger)

    runnerInvoker = mock(RunnerInvoker)
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeXS')).thenReturn('XS')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeS')).thenReturn('S')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeM')).thenReturn('M')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeL')).thenReturn('L')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', '')).thenReturn('XL')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', '2')).thenReturn('2XL')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', '3')).thenReturn('3XL')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', '10')).thenReturn('10XL')
    when(runnerInvoker.loc('metrics.codeMetrics.titleTestsSufficient')).thenReturn('✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleTestsInsufficient')).thenReturn('⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XS', '✔')).thenReturn('XS✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XS', '⚠️')).thenReturn('XS⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'S', '✔')).thenReturn('S✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'S', '⚠️')).thenReturn('S⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'M', '✔')).thenReturn('M✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'M', '⚠️')).thenReturn('M⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'L', '✔')).thenReturn('L✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'L', '⚠️')).thenReturn('L⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XL', '✔')).thenReturn('XL✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XL', '⚠️')).thenReturn('XL⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '2XL', '✔')).thenReturn('2XL✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '2XL', '⚠️')).thenReturn('2XL⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '3XL', '✔')).thenReturn('3XL✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '3XL', '⚠️')).thenReturn('3XL⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '10XL', '✔')).thenReturn('10XL✔')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '10XL', '⚠️')).thenReturn('10XL⚠️')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XS', '')).thenReturn('XS')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'S', '')).thenReturn('S')
    when(runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'M', '')).thenReturn('M')
  })

  {
    const testCases: Array<{ git: string, size: string, tests: boolean, metrics: CodeMetricsData }> = [
      { git: '0\t0\tfile.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0) },
      { git: '1\t0\tfile.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(1, 0, 0) },
      { git: '1\t0\tfile.ts\n1\t0\ttest.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(1, 1, 0) },
      { git: '199\t0\tfile.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(199, 0, 0) },
      { git: '199\t0\tfile.ts\n198\t0\ttest.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(199, 198, 0) },
      { git: '199\t0\tfile.ts\n199\t0\ttest.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(199, 199, 0) },
      { git: '200\t0\tfile.ts', size: 'S', tests: false, metrics: new CodeMetricsData(200, 0, 0) },
      { git: '200\t0\tfile.ts\n199\t0\ttest.ts', size: 'S', tests: false, metrics: new CodeMetricsData(200, 199, 0) },
      { git: '200\t0\tfile.ts\n200\t0\ttest.ts', size: 'S', tests: true, metrics: new CodeMetricsData(200, 200, 0) },
      { git: '399\t0\tfile.ts', size: 'S', tests: false, metrics: new CodeMetricsData(399, 0, 0) },
      { git: '399\t0\tfile.ts\n398\t0\ttest.ts', size: 'S', tests: false, metrics: new CodeMetricsData(399, 398, 0) },
      { git: '399\t0\tfile.ts\n399\t0\ttest.ts', size: 'S', tests: true, metrics: new CodeMetricsData(399, 399, 0) },
      { git: '400\t0\tfile.ts', size: 'M', tests: false, metrics: new CodeMetricsData(400, 0, 0) },
      { git: '400\t0\tfile.ts\n399\t0\ttest.ts', size: 'M', tests: false, metrics: new CodeMetricsData(400, 399, 0) },
      { git: '400\t0\tfile.ts\n400\t0\ttest.ts', size: 'M', tests: true, metrics: new CodeMetricsData(400, 400, 0) },
      { git: '799\t0\tfile.ts', size: 'M', tests: false, metrics: new CodeMetricsData(799, 0, 0) },
      { git: '799\t0\tfile.ts\n798\t0\ttest.ts', size: 'M', tests: false, metrics: new CodeMetricsData(799, 798, 0) },
      { git: '799\t0\tfile.ts\n799\t0\ttest.ts', size: 'M', tests: true, metrics: new CodeMetricsData(799, 799, 0) },
      { git: '800\t0\tfile.ts', size: 'L', tests: false, metrics: new CodeMetricsData(800, 0, 0) },
      { git: '800\t0\tfile.ts\n799\t0\ttest.ts', size: 'L', tests: false, metrics: new CodeMetricsData(800, 799, 0) },
      { git: '800\t0\tfile.ts\n800\t0\ttest.ts', size: 'L', tests: true, metrics: new CodeMetricsData(800, 800, 0) },
      { git: '1599\t0\tfile.ts', size: 'L', tests: false, metrics: new CodeMetricsData(1599, 0, 0) },
      { git: '1599\t0\tfile.ts\n1598\t0\ttest.ts', size: 'L', tests: false, metrics: new CodeMetricsData(1599, 1598, 0) },
      { git: '1599\t0\tfile.ts\n1599\t0\ttest.ts', size: 'L', tests: true, metrics: new CodeMetricsData(1599, 1599, 0) },
      { git: '1600\t0\tfile.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(1600, 0, 0) },
      { git: '1600\t0\tfile.ts\n1599\t0\ttest.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(1600, 1599, 0) },
      { git: '1600\t0\tfile.ts\n1600\t0\ttest.ts', size: 'XL', tests: true, metrics: new CodeMetricsData(1600, 1600, 0) },
      { git: '3199\t0\tfile.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(3199, 0, 0) },
      { git: '3199\t0\tfile.ts\n3198\t0\ttest.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(3199, 3198, 0) },
      { git: '3199\t0\tfile.ts\n3199\t0\ttest.ts', size: 'XL', tests: true, metrics: new CodeMetricsData(3199, 3199, 0) },
      { git: '3200\t0\tfile.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(3200, 0, 0) },
      { git: '3200\t0\tfile.ts\n3199\t0\ttest.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(3200, 3199, 0) },
      { git: '3200\t0\tfile.ts\n3200\t0\ttest.ts', size: '2XL', tests: true, metrics: new CodeMetricsData(3200, 3200, 0) },
      { git: '6399\t0\tfile.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(6399, 0, 0) },
      { git: '6399\t0\tfile.ts\n6398\t0\ttest.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(6399, 6398, 0) },
      { git: '6399\t0\tfile.ts\n6399\t0\ttest.ts', size: '2XL', tests: true, metrics: new CodeMetricsData(6399, 6399, 0) },
      { git: '6400\t0\tfile.ts', size: '3XL', tests: false, metrics: new CodeMetricsData(6400, 0, 0) },
      { git: '6400\t0\tfile.ts\n6399\t0\ttest.ts', size: '3XL', tests: false, metrics: new CodeMetricsData(6400, 6399, 0) },
      { git: '6400\t0\tfile.ts\n6400\t0\ttest.ts', size: '3XL', tests: true, metrics: new CodeMetricsData(6400, 6400, 0) },
      { git: '819200\t0\tfile.ts', size: '10XL', tests: false, metrics: new CodeMetricsData(819200, 0, 0) },
      { git: '819200\t0\tfile.ts\n819199\t0\ttest.ts', size: '10XL', tests: false, metrics: new CodeMetricsData(819200, 819199, 0) },
      { git: '819200\t0\tfile.ts\n819200\t0\ttest.ts', size: '10XL', tests: true, metrics: new CodeMetricsData(819200, 819200, 0) },
      { git: '1\t0\tfile.TS', size: 'XS', tests: false, metrics: new CodeMetricsData(1, 0, 0) },
      { git: '0\t1\tfile.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0) },
      { git: '1\t0\tfile.ignored', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1) },
      { git: '1\t0\tfile', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1) },
      { git: '1\t0\tfile.ts.ignored', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1) },
      { git: '1\t0\tfile.ignored.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(1, 0, 0) },
      { git: '1\t0\ttest.ignored', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1) },
      { git: '1\t0\ttasb.cc => test.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tt{a => e}s{b => t}.t{c => s}', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tt{a => est.ts}', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\t{a => test.ts}', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tfolder/test.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tfolder/Test.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tfolder/file.spec.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tfolder/file.Spec.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tfolder.spec.ts/file.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(1, 0, 0) },
      { git: '1\t0\ttest/file.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\ttests/file.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\ttests/file.spec.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t0\tfolder/tests/file.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t1\tfa/b => folder/test.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '1\t1\tf{a => older}/{b => test.ts}', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 1, 0) },
      { git: '0\t0\tfile.ts\n', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0) },
      { git: '-\t-\tfile.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0) },
      { git: '0\t0\tfile.ts\r\nrc:0\r\nsuccess:true', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0) }
    ]

    testCases.forEach(({ git, size, tests, metrics }: { git: string, size: string, tests: boolean, metrics: CodeMetricsData }): void => {
      it(`with default inputs and git diff '${git.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}', returns '${size}' size and '${tests.toString()}' test coverage`, async (): Promise<void> => {
        // Arrange
        when(gitInvoker.getDiffSummary()).thenResolve(git)

        // Act
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))

        // Assert
        expect(await codeMetrics.getFilesNotRequiringReview()).to.deep.equal([])
        expect(await codeMetrics.getDeletedFilesNotRequiringReview()).to.deep.equal([])
        expect(await codeMetrics.getSize()).to.equal(size)
        expect(await codeMetrics.getSizeIndicator()).to.equal(`${size}${tests ? '✔' : '⚠️'}`)
        expect(await codeMetrics.getMetrics()).to.deep.equal(metrics)
        expect(await codeMetrics.isSmall()).to.equal(size === 'XS' || size === 'S')
        expect(await codeMetrics.isSufficientlyTested()).to.equal(tests)
        verify(logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')).once()
        verify(logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
        verify(logger.logDebug('* CodeMetrics.getSize()')).once()
        verify(logger.logDebug('* CodeMetrics.initialize()')).times(7)
        verify(logger.logDebug('* CodeMetrics.initializeMetrics()')).once()
        verify(logger.logDebug('* CodeMetrics.matchFileExtension()')).times((git.replace(/\r\n/g, '').match(/\n/g) ?? []).length + 1 - (git.endsWith('\n') ? 1 : 0))
        verify(logger.logDebug('* CodeMetrics.constructMetrics()')).once()
        verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
        verify(logger.logDebug('* CodeMetrics.initializeIsSufficientlyTested()')).once()
        verify(logger.logDebug('* CodeMetrics.initializeSizeIndicator()')).once()
        verify(logger.logDebug('* CodeMetrics.calculateSize()')).once()
      })
    })
  }

  {
    const testCases: Array<{ git: string, size: string, tests: boolean, metrics: CodeMetricsData, files: string[], deletedFiles: string[] }> = [
      { git: '0\t0\tfile.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: [], deletedFiles: [] },
      { git: '1\t0\tfile.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(1, 0, 0), files: [], deletedFiles: [] },
      { git: '1\t0\tfile.ts\n1\t0\ttest.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(1, 1, 0), files: [], deletedFiles: [] },
      { git: '1\t0\tfile.ts\n2\t0\ttest.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(1, 2, 0), files: [], deletedFiles: [] },
      { git: '99\t0\tfile.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(99, 0, 0), files: [], deletedFiles: [] },
      { git: '99\t0\tfile.ts\n197\t0\ttest.ts', size: 'XS', tests: false, metrics: new CodeMetricsData(99, 197, 0), files: [], deletedFiles: [] },
      { git: '99\t0\tfile.ts\n198\t0\ttest.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(99, 198, 0), files: [], deletedFiles: [] },
      { git: '100\t0\tfile.ts', size: 'S', tests: false, metrics: new CodeMetricsData(100, 0, 0), files: [], deletedFiles: [] },
      { git: '100\t0\tfile.ts\n199\t0\ttest.ts', size: 'S', tests: false, metrics: new CodeMetricsData(100, 199, 0), files: [], deletedFiles: [] },
      { git: '100\t0\tfile.ts\n200\t0\ttest.ts', size: 'S', tests: true, metrics: new CodeMetricsData(100, 200, 0), files: [], deletedFiles: [] },
      { git: '149\t0\tfile.ts', size: 'S', tests: false, metrics: new CodeMetricsData(149, 0, 0), files: [], deletedFiles: [] },
      { git: '149\t0\tfile.ts\n297\t0\ttest.ts', size: 'S', tests: false, metrics: new CodeMetricsData(149, 297, 0), files: [], deletedFiles: [] },
      { git: '149\t0\tfile.ts\n298\t0\ttest.ts', size: 'S', tests: true, metrics: new CodeMetricsData(149, 298, 0), files: [], deletedFiles: [] },
      { git: '150\t0\tfile.ts', size: 'M', tests: false, metrics: new CodeMetricsData(150, 0, 0), files: [], deletedFiles: [] },
      { git: '150\t0\tfile.ts\n299\t0\ttest.ts', size: 'M', tests: false, metrics: new CodeMetricsData(150, 299, 0), files: [], deletedFiles: [] },
      { git: '150\t0\tfile.ts\n300\t0\ttest.ts', size: 'M', tests: true, metrics: new CodeMetricsData(150, 300, 0), files: [], deletedFiles: [] },
      { git: '224\t0\tfile.ts', size: 'M', tests: false, metrics: new CodeMetricsData(224, 0, 0), files: [], deletedFiles: [] },
      { git: '224\t0\tfile.ts\n447\t0\ttest.ts', size: 'M', tests: false, metrics: new CodeMetricsData(224, 447, 0), files: [], deletedFiles: [] },
      { git: '224\t0\tfile.ts\n448\t0\ttest.ts', size: 'M', tests: true, metrics: new CodeMetricsData(224, 448, 0), files: [], deletedFiles: [] },
      { git: '225\t0\tfile.ts', size: 'L', tests: false, metrics: new CodeMetricsData(225, 0, 0), files: [], deletedFiles: [] },
      { git: '225\t0\tfile.ts\n449\t0\ttest.ts', size: 'L', tests: false, metrics: new CodeMetricsData(225, 449, 0), files: [], deletedFiles: [] },
      { git: '225\t0\tfile.ts\n450\t0\ttest.ts', size: 'L', tests: true, metrics: new CodeMetricsData(225, 450, 0), files: [], deletedFiles: [] },
      { git: '337\t0\tfile.ts', size: 'L', tests: false, metrics: new CodeMetricsData(337, 0, 0), files: [], deletedFiles: [] },
      { git: '337\t0\tfile.ts\n673\t0\ttest.ts', size: 'L', tests: false, metrics: new CodeMetricsData(337, 673, 0), files: [], deletedFiles: [] },
      { git: '337\t0\tfile.ts\n674\t0\ttest.ts', size: 'L', tests: true, metrics: new CodeMetricsData(337, 674, 0), files: [], deletedFiles: [] },
      { git: '338\t0\tfile.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(338, 0, 0), files: [], deletedFiles: [] },
      { git: '338\t0\tfile.ts\n675\t0\ttest.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(338, 675, 0), files: [], deletedFiles: [] },
      { git: '338\t0\tfile.ts\n676\t0\ttest.ts', size: 'XL', tests: true, metrics: new CodeMetricsData(338, 676, 0), files: [], deletedFiles: [] },
      { git: '506\t0\tfile.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(506, 0, 0), files: [], deletedFiles: [] },
      { git: '506\t0\tfile.ts\n1011\t0\ttest.ts', size: 'XL', tests: false, metrics: new CodeMetricsData(506, 1011, 0), files: [], deletedFiles: [] },
      { git: '506\t0\tfile.ts\n1012\t0\ttest.ts', size: 'XL', tests: true, metrics: new CodeMetricsData(506, 1012, 0), files: [], deletedFiles: [] },
      { git: '507\t0\tfile.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(507, 0, 0), files: [], deletedFiles: [] },
      { git: '507\t0\tfile.ts\n1013\t0\ttest.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(507, 1013, 0), files: [], deletedFiles: [] },
      { git: '507\t0\tfile.ts\n1014\t0\ttest.ts', size: '2XL', tests: true, metrics: new CodeMetricsData(507, 1014, 0), files: [], deletedFiles: [] },
      { git: '759\t0\tfile.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(759, 0, 0), files: [], deletedFiles: [] },
      { git: '759\t0\tfile.ts\n1517\t0\ttest.ts', size: '2XL', tests: false, metrics: new CodeMetricsData(759, 1517, 0), files: [], deletedFiles: [] },
      { git: '759\t0\tfile.ts\n1518\t0\ttest.ts', size: '2XL', tests: true, metrics: new CodeMetricsData(759, 1518, 0), files: [], deletedFiles: [] },
      { git: '760\t0\tfile.ts', size: '3XL', tests: false, metrics: new CodeMetricsData(760, 0, 0), files: [], deletedFiles: [] },
      { git: '760\t0\tfile.ts\n1519\t0\ttest.ts', size: '3XL', tests: false, metrics: new CodeMetricsData(760, 1519, 0), files: [], deletedFiles: [] },
      { git: '760\t0\tfile.ts\n1520\t0\ttest.ts', size: '3XL', tests: true, metrics: new CodeMetricsData(760, 1520, 0), files: [], deletedFiles: [] },
      { git: '1\t0\tfile.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: [], deletedFiles: [] },
      { git: '1\t0\ttest.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: [], deletedFiles: [] },
      { git: '1\t0\tfile.tst', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: [], deletedFiles: [] },
      { git: '1\t0\tfile.tts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: [], deletedFiles: [] },
      { git: '1\t0\tfilets', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: [], deletedFiles: [] },
      { git: '1\t0\tignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: ['ignored.ts'], deletedFiles: [] },
      { git: '1\t0\tignored.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: ['ignored.cs'], deletedFiles: [] },
      { git: '1\t0\tfolder/ignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: ['folder/ignored.ts'], deletedFiles: [] },
      { git: '1\t0\tfolder/ignored.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: ['folder/ignored.cs'], deletedFiles: [] },
      { git: '0\t0\tignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: ['ignored.ts'], deletedFiles: [] },
      { git: '0\t0\tignored.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: ['ignored.cs'], deletedFiles: [] },
      { git: '0\t0\tfolder/ignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: ['folder/ignored.ts'], deletedFiles: [] },
      { git: '0\t0\tfolder/ignored.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: ['folder/ignored.cs'], deletedFiles: [] },
      { git: '1\t0\tignored.ts\n0\t0\tfolder/ignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: ['ignored.ts', 'folder/ignored.ts'], deletedFiles: [] },
      { git: '0\t1\tignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: [], deletedFiles: ['ignored.ts'] },
      { git: '0\t1\tignored.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: [], deletedFiles: ['ignored.cs'] },
      { git: '0\t1\tfolder/ignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: [], deletedFiles: ['folder/ignored.ts'] },
      { git: '0\t1\tfolder/ignored.cs', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 0), files: [], deletedFiles: ['folder/ignored.cs'] },
      { git: '1\t0\tignored.ts\n0\t1\tfolder/ignored.ts', size: 'XS', tests: true, metrics: new CodeMetricsData(0, 0, 1), files: ['ignored.ts'], deletedFiles: ['folder/ignored.ts'] }
    ]

    testCases.forEach(({ git, size, tests, metrics, files, deletedFiles }: { git: string, size: string, tests: boolean, metrics: CodeMetricsData, files: string[], deletedFiles: string[] }): void => {
      it(`with non-default inputs and git diff '${git.replace(/\n/g, '\\n')}', returns '${size}' size and '${tests.toString()}' test coverage`, async (): Promise<void> => {
        // Arrange
        when(inputs.baseSize).thenReturn(100)
        when(inputs.growthRate).thenReturn(1.5)
        when(inputs.testFactor).thenReturn(2.0)
        when(inputs.fileMatchingPatterns).thenReturn(['**/*', '!**/ignored.*'])
        when(inputs.codeFileExtensions).thenReturn(new Set<string>(['ts']))
        when(gitInvoker.getDiffSummary()).thenResolve(git)

        // Act
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))

        // Assert
        expect(await codeMetrics.getFilesNotRequiringReview()).to.deep.equal(files)
        expect(await codeMetrics.getDeletedFilesNotRequiringReview()).to.deep.equal(deletedFiles)
        expect(await codeMetrics.getSize()).to.equal(size)
        expect(await codeMetrics.getSizeIndicator()).to.equal(`${size}${tests ? '✔' : '⚠️'}`)
        expect(await codeMetrics.getMetrics()).to.deep.equal(metrics)
        expect(await codeMetrics.isSmall()).to.equal(size === 'XS' || size === 'S')
        expect(await codeMetrics.isSufficientlyTested()).to.equal(tests)
        verify(logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')).once()
        verify(logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
        verify(logger.logDebug('* CodeMetrics.getSize()')).once()
        verify(logger.logDebug('* CodeMetrics.initialize()')).times(7)
        verify(logger.logDebug('* CodeMetrics.initializeMetrics()')).once()
        verify(logger.logDebug('* CodeMetrics.matchFileExtension()')).times((git.match(/\n/g) ?? []).length + 1)
        verify(logger.logDebug('* CodeMetrics.constructMetrics()')).once()
        verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
        verify(logger.logDebug('* CodeMetrics.initializeIsSufficientlyTested()')).once()
        verify(logger.logDebug('* CodeMetrics.initializeSizeIndicator()')).once()
        verify(logger.logDebug('* CodeMetrics.calculateSize()')).once()
      })
    })
  }

  it('should return the expected result with test coverage disabled', async (): Promise<void> => {
    // Arrange
    when(inputs.testFactor).thenReturn(null)
    when(gitInvoker.getDiffSummary()).thenResolve('1\t0\tfile.ts')

    // Act
    const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))

    // Assert
    expect(await codeMetrics.getFilesNotRequiringReview()).to.deep.equal([])
    expect(await codeMetrics.getDeletedFilesNotRequiringReview()).to.deep.equal([])
    expect(await codeMetrics.getSize()).to.equal('XS')
    expect(await codeMetrics.getSizeIndicator()).to.equal('XS')
    expect(await codeMetrics.getMetrics()).to.deep.equal(new CodeMetricsData(1, 0, 0))
    expect(await codeMetrics.isSmall()).to.equal(true)
    expect(await codeMetrics.isSufficientlyTested()).to.equal(null)
    verify(logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')).once()
    verify(logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
    verify(logger.logDebug('* CodeMetrics.getSize()')).once()
    verify(logger.logDebug('* CodeMetrics.initialize()')).times(7)
    verify(logger.logDebug('* CodeMetrics.initializeMetrics()')).once()
    verify(logger.logDebug('* CodeMetrics.matchFileExtension()')).once()
    verify(logger.logDebug('* CodeMetrics.constructMetrics()')).once()
    verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
    verify(logger.logDebug('* CodeMetrics.initializeIsSufficientlyTested()')).once()
    verify(logger.logDebug('* CodeMetrics.initializeSizeIndicator()')).once()
    verify(logger.logDebug('* CodeMetrics.calculateSize()')).once()
  })

  describe('getFilesNotRequiringReview()', (): void => {
    {
      const testCases: string[] = [
        '',
        '   ',
        '\t',
        '\n',
        '\t\n'
      ]

      testCases.forEach((gitDiffSummary: string): void => {
        it(`should throw when the Git diff summary '${gitDiffSummary}' is empty`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(gitDiffSummary)
          const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
          let errorThrown: boolean = false

          try {
            // Act
            await codeMetrics.getFilesNotRequiringReview()
          } catch (error: any) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('The Git diff summary is empty.')
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')).once()
          verify(logger.logDebug('* CodeMetrics.initialize()')).once()
        })
      })
    }

    {
      const testCases: Array<{ summary: string, elements: number }> = [
        { summary: '0', elements: 1 },
        { summary: '0\t', elements: 1 },
        { summary: '0\t0', elements: 2 },
        { summary: '0\t0\t', elements: 2 },
        { summary: '0\tfile.ts', elements: 2 },
        { summary: '0\tfile.ts\t', elements: 2 }
      ]

      testCases.forEach(({ summary, elements }: { summary: string, elements: number }): void => {
        it(`should throw when the file name in the Git diff summary '${summary}' cannot be parsed`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(summary)
          const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
          let errorThrown: boolean = false

          try {
            // Act
            await codeMetrics.getFilesNotRequiringReview()
          } catch (error: any) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`The number of elements '${elements}' in '${summary.trim()}' in input '${summary.trim()}' did not match the expected 3.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')).once()
          verify(logger.logDebug('* CodeMetrics.initialize()')).once()
          verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
        })
      })
    }

    it('should throw when the lines added in the Git diff summary cannot be converted', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('A\t0\tfile.ts')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getFilesNotRequiringReview()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Could not parse added lines \'A\' from line \'A\t0\tfile.ts\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')).once()
      verify(logger.logDebug('* CodeMetrics.initialize()')).once()
      verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
    })

    it('should throw when the lines deleted in the Git diff summary cannot be converted', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('0\tA\tfile.ts')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getFilesNotRequiringReview()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Could not parse deleted lines \'A\' from line \'0\tA\tfile.ts\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')).once()
      verify(logger.logDebug('* CodeMetrics.initialize()')).once()
      verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
    })
  })

  describe('getDeletedFilesNotRequiringReview()', (): void => {
    it('should throw when the Git diff summary \'\' is empty', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getDeletedFilesNotRequiringReview()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('The Git diff summary is empty.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
      verify(logger.logDebug('* CodeMetrics.initialize()')).once()
    })

    it('should throw when the file name in the Git diff summary \'0\' cannot be parsed', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('0')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getDeletedFilesNotRequiringReview()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('The number of elements \'1\' in \'0\' in input \'0\' did not match the expected 3.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
      verify(logger.logDebug('* CodeMetrics.initialize()')).once()
      verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
    })

    it('should throw when the lines added in the Git diff summary cannot be converted', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('A\t0\tfile.ts')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getDeletedFilesNotRequiringReview()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Could not parse added lines \'A\' from line \'A\t0\tfile.ts\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
      verify(logger.logDebug('* CodeMetrics.initialize()')).once()
      verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
    })

    it('should throw when the lines deleted in the Git diff summary cannot be converted', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('0\tA\tfile.ts')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getDeletedFilesNotRequiringReview()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Could not parse deleted lines \'A\' from line \'0\tA\tfile.ts\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
      verify(logger.logDebug('* CodeMetrics.initialize()')).once()
      verify(logger.logDebug('* CodeMetrics.createFileMetricsMap()')).once()
    })
  })
})
