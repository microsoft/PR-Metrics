// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import * as mocha from 'mocha'
import * as path from 'path'
import * as taskLibMock from 'azure-pipelines-task-lib/mock-test'

describe('index.ts', (): void => {
  it('should succeed with standard input', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    const file: string = path.join(__dirname, 'collateral', 'index.success.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(true)
    expect(task.warningIssues).to.have.length(0)
    expect(task.errorIssues).to.have.length(0)
    expect(task.stdout.indexOf('Hello human')).to.be.at.least(0)
    done()
  })

  it('should fail with bad input', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    const file: string = path.join(__dirname, 'collateral', 'index.failure.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(false)
    expect(task.warningIssues).to.have.length(0)
    expect(task.errorIssues).to.have.length(1)
    expect(task.errorIssues[0]).to.equal('Bad input was given')
    expect(task.stdout.indexOf('Hello bad')).to.be.below(0)
    done()
  })
})
