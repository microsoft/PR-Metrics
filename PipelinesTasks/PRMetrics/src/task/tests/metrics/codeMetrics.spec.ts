// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { InputsDefault } from '../../src/metrics/inputsDefault'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import CodeMetrics from '../../src/metrics/codeMetrics'
import CodeMetricsData from '../../src/metrics/codeMetricsData'
import GitInvoker from '../../src/git/gitInvoker'
import Inputs from '../../src/metrics/inputs'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('codeMetrics.ts', (): void => {
  let gitInvoker: GitInvoker
  let inputs: Inputs
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    gitInvoker = mock(GitInvoker)

    inputs = mock(Inputs)
    when(inputs.baseSize).thenReturn(InputsDefault.baseSize)
    when(inputs.growthRate).thenReturn(InputsDefault.growthRate)
    when(inputs.testFactor).thenReturn(InputsDefault.testFactor)
    when(inputs.fileMatchingPatterns).thenReturn(InputsDefault.fileMatchingPatterns)
    when(inputs.codeFileExtensions).thenReturn(new Set<string>(InputsDefault.codeFileExtensions))

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXS')).thenReturn('XS')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeS')).thenReturn('S')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeM')).thenReturn('M')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeL')).thenReturn('L')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL', '')).thenReturn('XL')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL', '2')).thenReturn('2XL')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL', '3')).thenReturn('3XL')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleTestsSufficient')).thenReturn('✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleTestsInsufficient')).thenReturn('⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XS', '✔')).thenReturn('XS✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XS', '⚠️')).thenReturn('XS⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'S', '✔')).thenReturn('S✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'S', '⚠️')).thenReturn('S⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'M', '✔')).thenReturn('M✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'M', '⚠️')).thenReturn('M⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'L', '✔')).thenReturn('L✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'L', '⚠️')).thenReturn('L⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XL', '✔')).thenReturn('XL✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XL', '⚠️')).thenReturn('XL⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '2XL', '✔')).thenReturn('2XL✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '2XL', '⚠️')).thenReturn('2XL⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '3XL', '✔')).thenReturn('3XL✔')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '3XL', '⚠️')).thenReturn('3XL⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'XS', '')).thenReturn('XS')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'S', '')).thenReturn('S')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'M', '')).thenReturn('M')
  })

  async.each(
    [
      ['0\t0\tfile.ts', 'XS', true, new CodeMetricsData(0, 0, 0)],
      ['1\t0\tfile.ts', 'XS', false, new CodeMetricsData(1, 0, 0)],
      ['1\t0\tfile.ts\n1\t0\ttest.ts', 'XS', false, new CodeMetricsData(1, 1, 0)],
      ['1\t0\tfile.ts\n2\t0\ttest.ts', 'XS', true, new CodeMetricsData(1, 2, 0)],
      ['249\t0\tfile.ts', 'XS', false, new CodeMetricsData(249, 0, 0)],
      ['249\t0\tfile.ts\n373\t0\ttest.ts', 'XS', false, new CodeMetricsData(249, 373, 0)],
      ['249\t0\tfile.ts\n374\t0\ttest.ts', 'XS', true, new CodeMetricsData(249, 374, 0)],
      ['250\t0\tfile.ts', 'S', false, new CodeMetricsData(250, 0, 0)],
      ['250\t0\tfile.ts\n374\t0\ttest.ts', 'S', false, new CodeMetricsData(250, 374, 0)],
      ['250\t0\tfile.ts\n375\t0\ttest.ts', 'S', true, new CodeMetricsData(250, 375, 0)],
      ['499\t0\tfile.ts', 'S', false, new CodeMetricsData(499, 0, 0)],
      ['499\t0\tfile.ts\n748\t0\ttest.ts', 'S', false, new CodeMetricsData(499, 748, 0)],
      ['499\t0\tfile.ts\n749\t0\ttest.ts', 'S', true, new CodeMetricsData(499, 749, 0)],
      ['500\t0\tfile.ts', 'M', false, new CodeMetricsData(500, 0, 0)],
      ['500\t0\tfile.ts\n749\t0\ttest.ts', 'M', false, new CodeMetricsData(500, 749, 0)],
      ['500\t0\tfile.ts\n750\t0\ttest.ts', 'M', true, new CodeMetricsData(500, 750, 0)],
      ['999\t0\tfile.ts', 'M', false, new CodeMetricsData(999, 0, 0)],
      ['999\t0\tfile.ts\n1498\t0\ttest.ts', 'M', false, new CodeMetricsData(999, 1498, 0)],
      ['999\t0\tfile.ts\n1499\t0\ttest.ts', 'M', true, new CodeMetricsData(999, 1499, 0)],
      ['1000\t0\tfile.ts', 'L', false, new CodeMetricsData(1000, 0, 0)],
      ['1000\t0\tfile.ts\n1499\t0\ttest.ts', 'L', false, new CodeMetricsData(1000, 1499, 0)],
      ['1000\t0\tfile.ts\n1500\t0\ttest.ts', 'L', true, new CodeMetricsData(1000, 1500, 0)],
      ['1999\t0\tfile.ts', 'L', false, new CodeMetricsData(1999, 0, 0)],
      ['1999\t0\tfile.ts\n2998\t0\ttest.ts', 'L', false, new CodeMetricsData(1999, 2998, 0)],
      ['1999\t0\tfile.ts\n2999\t0\ttest.ts', 'L', true, new CodeMetricsData(1999, 2999, 0)],
      ['2000\t0\tfile.ts', 'XL', false, new CodeMetricsData(2000, 0, 0)],
      ['2000\t0\tfile.ts\n2999\t0\ttest.ts', 'XL', false, new CodeMetricsData(2000, 2999, 0)],
      ['2000\t0\tfile.ts\n3000\t0\ttest.ts', 'XL', true, new CodeMetricsData(2000, 3000, 0)],
      ['3999\t0\tfile.ts', 'XL', false, new CodeMetricsData(3999, 0, 0)],
      ['3999\t0\tfile.ts\n5998\t0\ttest.ts', 'XL', false, new CodeMetricsData(3999, 5998, 0)],
      ['3999\t0\tfile.ts\n5999\t0\ttest.ts', 'XL', true, new CodeMetricsData(3999, 5999, 0)],
      ['4000\t0\tfile.ts', '2XL', false, new CodeMetricsData(4000, 0, 0)],
      ['4000\t0\tfile.ts\n5999\t0\ttest.ts', '2XL', false, new CodeMetricsData(4000, 5999, 0)],
      ['4000\t0\tfile.ts\n6000\t0\ttest.ts', '2XL', true, new CodeMetricsData(4000, 6000, 0)],
      ['7999\t0\tfile.ts', '2XL', false, new CodeMetricsData(7999, 0, 0)],
      ['7999\t0\tfile.ts\n11998\t0\ttest.ts', '2XL', false, new CodeMetricsData(7999, 11998, 0)],
      ['7999\t0\tfile.ts\n11999\t0\ttest.ts', '2XL', true, new CodeMetricsData(7999, 11999, 0)],
      ['8000\t0\tfile.ts', '3XL', false, new CodeMetricsData(8000, 0, 0)],
      ['8000\t0\tfile.ts\n11999\t0\ttest.ts', '3XL', false, new CodeMetricsData(8000, 11999, 0)],
      ['8000\t0\tfile.ts\n12000\t0\ttest.ts', '3XL', true, new CodeMetricsData(8000, 12000, 0)],
      ['1\t0\tfile.TS', 'XS', false, new CodeMetricsData(1, 0, 0)],
      ['0\t1\tfile.ts', 'XS', true, new CodeMetricsData(0, 0, 0)],
      ['1\t0\tfile.ignored', 'XS', true, new CodeMetricsData(0, 0, 1)],
      ['1\t0\tfile', 'XS', true, new CodeMetricsData(0, 0, 1)],
      ['1\t0\tfile.ts.ignored', 'XS', true, new CodeMetricsData(0, 0, 1)],
      ['1\t0\tfile.ignored.ts', 'XS', false, new CodeMetricsData(1, 0, 0)],
      ['1\t0\ttest.ignored', 'XS', true, new CodeMetricsData(0, 0, 1)],
      ['1\t0\ttasb.cc => test.ts', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\tt{a => e}s{b => t}.t{c => s}', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\tt{a => est.ts}', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\t{a => test.ts}', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\tfolder/test.ts', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\tfolder/Test.ts', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\ttest/file.ts', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\ttests/file.ts', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t0\tfolder/tests/file.ts', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t1\tfa/b => folder/test.ts', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['1\t1\tf{a => older}/{b => test.ts}', 'XS', true, new CodeMetricsData(0, 1, 0)],
      ['0\t0\tfile.ts\n', 'XS', true, new CodeMetricsData(0, 0, 0)],
      ['-\t-\tfile.ts', 'XS', true, new CodeMetricsData(0, 0, 0)]
    ], (data: [string, string, boolean, CodeMetricsData]): void => {
      it(`with default inputs and git diff '${data[0].replace(/\n/g, '\\n')}', returns '${data[1]}' getSize() and '${data[2]}' test coverage`, async (): Promise<void> => {
        // Arrange
        when(gitInvoker.getDiffSummary()).thenResolve(data[0])

        // Act
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))

        // Assert
        expect(await codeMetrics.getFilesNotRequiringReview()).to.deep.equal([])
        expect(await codeMetrics.getDeletedFilesNotRequiringReview()).to.deep.equal([])
        expect(await codeMetrics.getSize()).to.equal(data[1])
        expect(await codeMetrics.getSizeIndicator()).to.equal(`${data[1]}${data[2] ? '✔' : '⚠️'}`)
        expect(await codeMetrics.getMetrics()).to.deep.equal(data[3])
        expect(await codeMetrics.isSmall()).to.equal(data[1] === 'XS' || data[1] === 'S')
        expect(await codeMetrics.isSufficientlyTested()).to.equal(data[2])
        verify(taskLibWrapper.debug('* CodeMetrics.getFilesNotRequiringReview()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.getSize()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).times(7)
        verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.matchFileExtension()')).times((data[0].match(/\n/g) || []).length + 1 - (data[0].endsWith('\n') ? 1 : 0))
        verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeIsSufficientlyTested()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
      })
    })

  async.each(
    [
      ['0\t0\tfile.ts', 'XS', true, new CodeMetricsData(0, 0, 0), [], []],
      ['1\t0\tfile.ts', 'XS', false, new CodeMetricsData(1, 0, 0), [], []],
      ['1\t0\tfile.ts\n0\t0\ttest.ts', 'XS', false, new CodeMetricsData(1, 0, 0), [], []],
      ['1\t0\tfile.ts\n1\t0\ttest.ts', 'XS', true, new CodeMetricsData(1, 1, 0), [], []],
      ['99\t0\tfile.ts', 'XS', false, new CodeMetricsData(99, 0, 0), [], []],
      ['99\t0\tfile.ts\n98\t0\ttest.ts', 'XS', false, new CodeMetricsData(99, 98, 0), [], []],
      ['99\t0\tfile.ts\n99\t0\ttest.ts', 'XS', true, new CodeMetricsData(99, 99, 0), [], []],
      ['100\t0\tfile.ts', 'S', false, new CodeMetricsData(100, 0, 0), [], []],
      ['100\t0\tfile.ts\n99\t0\ttest.ts', 'S', false, new CodeMetricsData(100, 99, 0), [], []],
      ['100\t0\tfile.ts\n100\t0\ttest.ts', 'S', true, new CodeMetricsData(100, 100, 0), [], []],
      ['199\t0\tfile.ts', 'S', false, new CodeMetricsData(199, 0, 0), [], []],
      ['199\t0\tfile.ts\n198\t0\ttest.ts', 'S', false, new CodeMetricsData(199, 198, 0), [], []],
      ['199\t0\tfile.ts\n199\t0\ttest.ts', 'S', true, new CodeMetricsData(199, 199, 0), [], []],
      ['200\t0\tfile.ts', 'M', false, new CodeMetricsData(200, 0, 0), [], []],
      ['200\t0\tfile.ts\n199\t0\ttest.ts', 'M', false, new CodeMetricsData(200, 199, 0), [], []],
      ['200\t0\tfile.ts\n200\t0\ttest.ts', 'M', true, new CodeMetricsData(200, 200, 0), [], []],
      ['399\t0\tfile.ts', 'M', false, new CodeMetricsData(399, 0, 0), [], []],
      ['399\t0\tfile.ts\n398\t0\ttest.ts', 'M', false, new CodeMetricsData(399, 398, 0), [], []],
      ['399\t0\tfile.ts\n399\t0\ttest.ts', 'M', true, new CodeMetricsData(399, 399, 0), [], []],
      ['400\t0\tfile.ts', 'L', false, new CodeMetricsData(400, 0, 0), [], []],
      ['400\t0\tfile.ts\n399\t0\ttest.ts', 'L', false, new CodeMetricsData(400, 399, 0), [], []],
      ['400\t0\tfile.ts\n400\t0\ttest.ts', 'L', true, new CodeMetricsData(400, 400, 0), [], []],
      ['799\t0\tfile.ts', 'L', false, new CodeMetricsData(799, 0, 0), [], []],
      ['799\t0\tfile.ts\n798\t0\ttest.ts', 'L', false, new CodeMetricsData(799, 798, 0), [], []],
      ['799\t0\tfile.ts\n799\t0\ttest.ts', 'L', true, new CodeMetricsData(799, 799, 0), [], []],
      ['800\t0\tfile.ts', 'XL', false, new CodeMetricsData(800, 0, 0), [], []],
      ['800\t0\tfile.ts\n799\t0\ttest.ts', 'XL', false, new CodeMetricsData(800, 799, 0), [], []],
      ['800\t0\tfile.ts\n800\t0\ttest.ts', 'XL', true, new CodeMetricsData(800, 800, 0), [], []],
      ['1599\t0\tfile.ts', 'XL', false, new CodeMetricsData(1599, 0, 0), [], []],
      ['1599\t0\tfile.ts\n1598\t0\ttest.ts', 'XL', false, new CodeMetricsData(1599, 1598, 0), [], []],
      ['1599\t0\tfile.ts\n1599\t0\ttest.ts', 'XL', true, new CodeMetricsData(1599, 1599, 0), [], []],
      ['1600\t0\tfile.ts', '2XL', false, new CodeMetricsData(1600, 0, 0), [], []],
      ['1600\t0\tfile.ts\n1599\t0\ttest.ts', '2XL', false, new CodeMetricsData(1600, 1599, 0), [], []],
      ['1600\t0\tfile.ts\n1600\t0\ttest.ts', '2XL', true, new CodeMetricsData(1600, 1600, 0), [], []],
      ['3199\t0\tfile.ts', '2XL', false, new CodeMetricsData(3199, 0, 0), [], []],
      ['3199\t0\tfile.ts\n3198\t0\ttest.ts', '2XL', false, new CodeMetricsData(3199, 3198, 0), [], []],
      ['3199\t0\tfile.ts\n3199\t0\ttest.ts', '2XL', true, new CodeMetricsData(3199, 3199, 0), [], []],
      ['3200\t0\tfile.ts', '3XL', false, new CodeMetricsData(3200, 0, 0), [], []],
      ['3200\t0\tfile.ts\n3199\t0\ttest.ts', '3XL', false, new CodeMetricsData(3200, 3199, 0), [], []],
      ['3200\t0\tfile.ts\n3200\t0\ttest.ts', '3XL', true, new CodeMetricsData(3200, 3200, 0), [], []],
      ['1\t0\tfile.cs', 'XS', true, new CodeMetricsData(0, 0, 1), [], []],
      ['1\t0\ttest.cs', 'XS', true, new CodeMetricsData(0, 0, 1), [], []],
      ['1\t0\tfile.tst', 'XS', true, new CodeMetricsData(0, 0, 1), [], []],
      ['1\t0\tfile.tts', 'XS', true, new CodeMetricsData(0, 0, 1), [], []],
      ['1\t0\tfilets', 'XS', true, new CodeMetricsData(0, 0, 1), [], []],
      ['1\t0\tignored.ts', 'XS', true, new CodeMetricsData(0, 0, 1), ['ignored.ts'], []],
      ['1\t0\tignored.cs', 'XS', true, new CodeMetricsData(0, 0, 1), ['ignored.cs'], []],
      ['1\t0\tfolder/ignored.ts', 'XS', true, new CodeMetricsData(0, 0, 1), ['folder/ignored.ts'], []],
      ['1\t0\tfolder/ignored.cs', 'XS', true, new CodeMetricsData(0, 0, 1), ['folder/ignored.cs'], []],
      ['0\t0\tignored.ts', 'XS', true, new CodeMetricsData(0, 0, 0), [], ['ignored.ts']],
      ['0\t0\tignored.cs', 'XS', true, new CodeMetricsData(0, 0, 0), [], ['ignored.cs']],
      ['0\t0\tfolder/ignored.ts', 'XS', true, new CodeMetricsData(0, 0, 0), [], ['folder/ignored.ts']],
      ['0\t0\tfolder/ignored.cs', 'XS', true, new CodeMetricsData(0, 0, 0), [], ['folder/ignored.cs']],
      ['1\t0\tignored.ts\n0\t0\tfolder/ignored.ts', 'XS', true, new CodeMetricsData(0, 0, 1), ['ignored.ts'], ['folder/ignored.ts']]
    ], (data: [string, string, boolean, CodeMetricsData, string[], string[]]): void => {
      it(`with non-default inputs and git diff '${data[0].replace(/\n/g, '\\n')}', returns '${data[1]}' getSize() and '${data[2]}' test coverage`, async (): Promise<void> => {
        // Arrange
        when(inputs.baseSize).thenReturn(100)
        when(inputs.growthRate).thenReturn(2.0)
        when(inputs.testFactor).thenReturn(1.0)
        when(inputs.fileMatchingPatterns).thenReturn(['**/*', '!**/ignored.*'])
        when(inputs.codeFileExtensions).thenReturn(new Set<string>(['ts']))
        when(gitInvoker.getDiffSummary()).thenResolve(data[0])

        // Act
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))

        // Assert
        expect(await codeMetrics.getFilesNotRequiringReview()).to.deep.equal(data[4])
        expect(await codeMetrics.getDeletedFilesNotRequiringReview()).to.deep.equal(data[5])
        expect(await codeMetrics.getSize()).to.equal(data[1])
        expect(await codeMetrics.getSizeIndicator()).to.equal(`${data[1]}${data[2] ? '✔' : '⚠️'}`)
        expect(await codeMetrics.getMetrics()).to.deep.equal(data[3])
        expect(await codeMetrics.isSmall()).to.equal(data[1] === 'XS' || data[1] === 'S')
        expect(await codeMetrics.isSufficientlyTested()).to.equal(data[2])
        verify(taskLibWrapper.debug('* CodeMetrics.getFilesNotRequiringReview()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.getSize()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).times(7)
        verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.matchFileExtension()')).times((data[0].match(/\n/g) || []).length + 1)
        verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeIsSufficientlyTested()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
      })
    })

  it('should return the expected result with test coverage disabled', async (): Promise<void> => {
    // Arrange
    when(inputs.testFactor).thenReturn(null)
    when(gitInvoker.getDiffSummary()).thenResolve('1\t0\tfile.ts')

    // Act
    const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))

    // Assert
    expect(await codeMetrics.getFilesNotRequiringReview()).to.deep.equal([])
    expect(await codeMetrics.getDeletedFilesNotRequiringReview()).to.deep.equal([])
    expect(await codeMetrics.getSize()).to.equal('XS')
    expect(await codeMetrics.getSizeIndicator()).to.equal('XS')
    expect(await codeMetrics.getMetrics()).to.deep.equal(new CodeMetricsData(1, 0, 0))
    expect(await codeMetrics.isSmall()).to.equal(true)
    expect(await codeMetrics.isSufficientlyTested()).to.equal(null)
    verify(taskLibWrapper.debug('* CodeMetrics.getFilesNotRequiringReview()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.getSize()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).times(7)
    verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.matchFileExtension()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.initializeIsSufficientlyTested()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
    verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
  })

  describe('getFilesNotRequiringReview()', (): void => {
    async.each(
      [
        '',
        '   ',
        '\t',
        '\n',
        '\t\n'
      ], (gitDiffSummary: string): void => {
        it(`should throw when the Git diff summary '${gitDiffSummary}' is empty`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(gitDiffSummary)
          const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await codeMetrics.getFilesNotRequiringReview()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('The Git diff summary is empty.')
          }

          expect(errorThrown).to.equal(true)
          verify(taskLibWrapper.debug('* CodeMetrics.getFilesNotRequiringReview()')).once()
          verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
        })
      })

    async.each(
      [
        ['0', 1],
        ['0\t', 1],
        ['0\t0', 2],
        ['0\t0\t', 2],
        ['0\tfile.ts', 2],
        ['0\tfile.ts\t', 2],
        ['0\t0\tfile1.ts\tfile2.ts', 4],
        ['0\t0\tfile1.ts\tfile2.ts\t', 4]
      ], (data: [string, number]): void => {
        it(`should throw when the file name in the Git diff summary '${data[0]}' cannot be parsed`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(data[0])
          const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await codeMetrics.getFilesNotRequiringReview()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`The number of elements '${data[1]}' in '${data[0].trim()}' did not match the expected 3.`)
          }

          expect(errorThrown).to.equal(true)
          verify(taskLibWrapper.debug('* CodeMetrics.getFilesNotRequiringReview()')).once()
          verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
          verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).once()
        })
      })

    it('should throw when the lines added in the Git diff summary cannot be converted', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('A\t0\tfile.ts')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getFilesNotRequiringReview()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Could not parse \'A\' from line \'A\t0\tfile.ts\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(taskLibWrapper.debug('* CodeMetrics.getFilesNotRequiringReview()')).once()
      verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
      verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).once()
    })
  })

  describe('getDeletedFilesNotRequiringReview()', (): void => {
    it('should throw when the Git diff summary \'\' is empty', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getDeletedFilesNotRequiringReview()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('The Git diff summary is empty.')
      }

      expect(errorThrown).to.equal(true)
      verify(taskLibWrapper.debug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
      verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
    })

    it('should throw when the file name in the Git diff summary \'0\' cannot be parsed', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('0')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getDeletedFilesNotRequiringReview()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('The number of elements \'1\' in \'0\' did not match the expected 3.')
      }

      expect(errorThrown).to.equal(true)
      verify(taskLibWrapper.debug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
      verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
      verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).once()
    })

    it('should throw when the lines added in the Git diff summary cannot be converted', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve('A\t0\tfile.ts')
      const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await codeMetrics.getDeletedFilesNotRequiringReview()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Could not parse \'A\' from line \'A\t0\tfile.ts\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(taskLibWrapper.debug('* CodeMetrics.getDeletedFilesNotRequiringReview()')).once()
      verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
      verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).once()
    })
  })
})
