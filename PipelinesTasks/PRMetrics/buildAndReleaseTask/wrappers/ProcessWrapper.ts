// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

class ProcessWrapper {
  public write (input: string): void {
    process.stdout.write(input)
  }
}

export default ProcessWrapper
