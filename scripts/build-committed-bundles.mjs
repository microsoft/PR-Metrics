/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Rebuilds every bundle that the repository commits, so the reproducibility
 * gate in the 'Test GitHub Action' job can compare the rebuilt output against
 * the commit before any credential is minted. The root 'dist' bundle is built
 * unconditionally via the 'build:package' package script. A repository-owned
 * GitHub Action under '.github/actions' ships its own committed bundle built
 * by a 'build:actions' package script; if one of those committed bundles is
 * present, the matching rebuild script must exist so the gate can verify it.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const conditionalScriptName = "build:actions";

const getLocalActionDistPaths = (repositoryRootPath) => {
  const actionsRootPath = join(repositoryRootPath, ".github", "actions");

  try {
    return readdirSync(actionsRootPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(actionsRootPath, entry.name, "dist"))
      .filter((distPath) => {
        try {
          return statSync(distPath).isDirectory();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
};

const [target] = process.argv.slice(2);
const rootPath = target ?? join(import.meta.dirname, "..");

const runPackageScript = (scriptName) => {
  process.stdout.write(`Running package script '${scriptName}'...\n`);
  execFileSync(process.execPath, ["--run", scriptName], {
    cwd: rootPath,
    stdio: "inherit",
  });
};

try {
  const packageJson = JSON.parse(
    readFileSync(join(rootPath, "package.json"), "utf8"),
  );
  const scripts = packageJson.scripts ?? {};

  runPackageScript("build:package");

  const localActionDistPaths = getLocalActionDistPaths(rootPath);

  if (Object.hasOwn(scripts, conditionalScriptName)) {
    runPackageScript(conditionalScriptName);
  } else if (localActionDistPaths.length > 0) {
    throw new Error(
      `Found committed repository-owned GitHub Action bundles (${localActionDistPaths.join(", ")}) but no '${conditionalScriptName}' package script was defined to rebuild them.`,
    );
  } else {
    process.stdout.write(
      `No '${conditionalScriptName}' package script found; skipping repository-owned GitHub Action bundles.\n`,
    );
  }
} catch (error) {
  process.stderr.write(
    `Failed to build the committed bundles: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
