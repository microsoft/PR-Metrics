// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import * as mocha from 'mocha'
import * as path from 'path'
import * as taskLibMock from 'azure-pipelines-task-lib/mock-test'

describe('index.ts', (): void => {
  it('should succeed with incomplete input', function test (done: mocha.Done): void {
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
    done()
  })
})
