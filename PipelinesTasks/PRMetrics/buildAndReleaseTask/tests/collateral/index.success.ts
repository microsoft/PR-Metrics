// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path'
import * as taskLibMock from 'azure-pipelines-task-lib/mock-run'

const taskPath: string = path.join(__dirname, '..', '..', 'index.js')
const taskRunner: taskLibMock.TaskMockRunner = new taskLibMock.TaskMockRunner(taskPath)

taskRunner.run()
