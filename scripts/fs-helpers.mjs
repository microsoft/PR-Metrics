/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { copyFileSync, cpSync, mkdirSync, rmSync } from "node:fs";

const [, , command, ...args] = process.argv;

switch (command) {
  case "cp":
    cpSync(args[0], args[1], { recursive: true });
    break;
  case "cpfile":
    copyFileSync(args[0], args[1]);
    break;
  case "mkdir":
    mkdirSync(args[0], { recursive: true });
    break;
  case "rm":
    for (const path of args) {
      rmSync(path, { recursive: true, force: true });
    }

    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
