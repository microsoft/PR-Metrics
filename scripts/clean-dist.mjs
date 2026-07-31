/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Empties the generated GitHub Action bundle before 'ncc build' regenerates it,
 * preserving only the authored files that the build does not produce. Without
 * this, a file that a previous build emitted but the current one no longer
 * emits would survive in the committed bundle, so the bundle would no longer
 * correspond to the source it claims to be built from and would keep shipping
 * unreviewed code that nothing regenerates.
 */

import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

// Files that are authored rather than generated, so the build must not delete
// them.
const preservedEntries = new Set(["README.md"]);

const [target] = process.argv.slice(2);
const distPath = target ?? join(import.meta.dirname, "..", "dist");

try {
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true });
  } else if (!statSync(distPath).isDirectory()) {
    throw new Error(`'${distPath}' is not a directory.`);
  }

  const removed = [];
  for (const entry of readdirSync(distPath)) {
    if (preservedEntries.has(entry)) {
      continue;
    }

    rmSync(join(distPath, entry), { force: true, recursive: true });
    removed.push(entry);
  }

  process.stdout.write(
    removed.length === 0
      ? `Removed no generated entries from '${distPath}'.\n`
      : `Removed ${String(removed.length)} generated entries from '${distPath}': ${removed.join(", ")}.\n`,
  );
} catch (error) {
  process.stderr.write(
    `Failed to empty '${distPath}': ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
