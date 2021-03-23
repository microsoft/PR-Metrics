import { instance, mock, verify, when } from 'ts-mockito'

import CodeMetrics from '../../updaters/codeMetrics'
import ExecSyncResult from '../wrappers/execSyncResult'
import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'
import ProcessWrapper from '../../wrappers/processWrapper'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import { expect } from 'chai'

describe('codeMetrics.ts', (): void => {
  let execSyncResult: IExecSyncResult
  let taskLibWrapper: TaskLibWrapper
  let processWrapper: ProcessWrapper

  beforeEach((): void => {
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'

    execSyncResult = new ExecSyncResult()
    execSyncResult.stdout = '1\t2\tFile.txt'

    taskLibWrapper = mock(TaskLibWrapper)
    processWrapper = mock(ProcessWrapper)
    when(taskLibWrapper.execSync('git', 'diff --numstat origin/develop...pull/12345/merge')).thenReturn(execSyncResult)
  })

  afterEach((): void => {
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  })

  describe('getSizeIndicator()', (): void => {
    it('should returns the correct output when no error occurs', (): void => {
      // Arrange
      const codeMetrics: CodeMetrics = new CodeMetrics('', '', '', '', '', '', instance(taskLibWrapper), instance(processWrapper))

      // Act
      let result: string = codeMetrics.getSizeIndicator()

      // Assert
      expect(result).to.equal('XS$([char]0x2714)')

      // can change the value by setting the metric
      codeMetrics.size = 'abc='
      codeMetrics.metrics.testCode = 500 // sufficientTestCode = true
      codeMetrics.metrics.productCode = 0
      codeMetrics.testFactor = 0
      expect(codeMetrics.sufficientTestCode).to.equal(true)
      result = codeMetrics.getSizeIndicator()
      expect(result).to.equal('abc=$([char]0x2714)')

      codeMetrics.size = 'abc='
      codeMetrics.metrics.testCode = -500 // sufficientTestCode = false
      codeMetrics.metrics.productCode = 0
      codeMetrics.testFactor = 5
      expect(codeMetrics.sufficientTestCode).to.equal(false)
      result = codeMetrics.getSizeIndicator()
      expect(result).to.equal('abc=$([char]0x26A0)$([char]0xFE0F)')
      verify(taskLibWrapper.debug('* CodeMetrics.getSizeIndicator()')).thrice()
    })
  })

  describe('isSmall()', (): void => {
    it('should returns the correct output when no error occurs', (): void => {
      // Arrange
      const codeMetrics: CodeMetrics = new CodeMetrics('', '', '', '', '', '', instance(taskLibWrapper), instance(processWrapper))

      // Act
      let result: boolean = codeMetrics.isSmall()

      // Assert
      expect(result).to.equal(true)

      codeMetrics.metrics.productCode = 4
      codeMetrics.baseSize = 0
      result = codeMetrics.isSmall()
      expect(result).to.equal(false)

      codeMetrics.metrics.productCode = 0
      codeMetrics.baseSize = 5
      result = codeMetrics.isSmall()
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* CodeMetrics.isSmall()')).thrice()
    })
  })

  describe('areTestsExpected()', (): void => {
    it('should returns the correct output when no error occurs', (): void => {
      // Arrange
      const codeMetrics: CodeMetrics = new CodeMetrics('', '', '', '', '', '', instance(taskLibWrapper), instance(processWrapper))

      // Act
      let result: boolean = codeMetrics.areTestsExpected()

      // Assert
      expect(result).to.equal(true)

      codeMetrics.testFactor = -4
      result = codeMetrics.areTestsExpected()
      expect(result).to.equal(false)

      codeMetrics.testFactor = 6
      result = codeMetrics.areTestsExpected()
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* CodeMetrics.areTestsExpected()')).thrice()
    })
  })

  describe('initializeSize()', (): void => {
    it('should returns the correct output when no error occurs', (): void => {
      // Arrange
      const codeMetrics: CodeMetrics = new CodeMetrics('', '', '', '', '', '', instance(taskLibWrapper), instance(processWrapper))
      verify(taskLibWrapper.debug('* CodeMetrics.initializeSize()')).once()

      expect(codeMetrics.size).to.equal('XS')
    })
  })
})
