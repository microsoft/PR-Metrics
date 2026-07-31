/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fsPromises from "node:fs/promises";
import type { Stats } from "node:fs";

/**
 * A wrapper around the file system, to facilitate testability.
 */
export default class FileSystemWrapper {
  /**
   * Gets a value indicating whether the specified path exists and refers to a directory.
   * @param path The path to check.
   * @returns A promise containing a value indicating whether the path is an existing directory.
   */
  public async directoryExists(path: string): Promise<boolean> {
    try {
      const stats: Stats = await fsPromises.stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Creates a uniquely named directory using the specified path prefix.
   * @param prefix The path prefix used to generate the unique directory.
   * @returns A promise containing the path of the created directory.
   */
  public async mkdtemp(prefix: string): Promise<string> {
    return fsPromises.mkdtemp(prefix);
  }

  /**
   * Restricts the permissions of the specified path, where supported by the underlying operating system.
   * @param path The path whose permissions should be restricted.
   * @param mode The permissions mode to apply.
   */
  public async chmod(path: string, mode: number): Promise<void> {
    await fsPromises.chmod(path, mode);
  }

  /**
   * Recursively and forcefully removes the specified path.
   * @param path The path to remove.
   */
  public async rm(path: string): Promise<void> {
    await fsPromises.rm(path, {
      force: true,
      recursive: true,
    });
  }
}
