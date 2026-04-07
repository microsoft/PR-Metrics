/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { copyFileSync, cpSync, mkdirSync, renameSync, rmSync } from "node:fs";

const argv = process.argv.slice(2);
let cwd;
if (argv[0] === "-C") {
  argv.shift();
  cwd = argv.shift();
  process.chdir(cwd);
}

const [command, ...args] = argv;

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
  case "mv":
    rmSync(args[1], { recursive: true, force: true });
    renameSync(args[0], args[1]);
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
