// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path'
import * as taskLib from 'azure-pipelines-task-lib/task'
import GitInvoker from './invokers/gitInvoker'
import TaskLibWrapper from './wrappers/taskLibWrapper'

async function run (): Promise<void> {
  try {
    taskLib.setResourcePath(path.join(__dirname, 'task.json'))

    try {
      const taskLibWrapper: TaskLibWrapper = new TaskLibWrapper()
      process.stdout.write('Description:' + taskLibWrapper.loc('updaters.pullRequest.addDescription'))
      const gitInvoker: GitInvoker = new GitInvoker(taskLibWrapper)
      process.stdout.write(gitInvoker.getDiffSummary())
    } catch (error) {
      // Suppress errors temporarily for the purposes of testing.
    }

    const inputString: string | undefined = taskLib.getInput('samplestring', true)
    if (inputString === 'bad') {
      taskLib.setResult(taskLib.TaskResult.Failed, 'Bad input was given')
      return
    }

    console.log('Hello', inputString)
  } catch (error) {
    taskLib.setResult(taskLib.TaskResult.Failed, error.message)
  }
}

run()
