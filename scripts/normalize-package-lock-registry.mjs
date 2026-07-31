/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Normalizes the 'resolved' URLs of package-lock.json to the anonymous 1ES
 * public npm mirror, which the CFSClean network isolation policy approves.
 * A dependency update regenerates those URLs against the registry named by
 * .npmrc, which is the public npm registry, so this script restores the mirror
 * without altering anything else within the file. Any other host is rejected
 * rather than preserved, so an unexpected registry fails the release instead of
 * reaching the pull request pipelines.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const publicRegistryPrefix = "https://registry.npmjs.org/";

const mirrorPrefix =
  "https://ms-feed-25.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/";

const approvedPrefixes = [
  "https://ms-feed-2.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
  "https://ms-feed-12.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
  mirrorPrefix,
];

const resolvedPattern = /"resolved":(?<separator>\s*)"(?<url>[^"]*)"/gu;

const normalizeUrl = (url) => {
  if (url.startsWith(publicRegistryPrefix)) {
    return `${mirrorPrefix}${url.slice(publicRegistryPrefix.length)}`;
  }

  if (approvedPrefixes.some((prefix) => url.startsWith(prefix))) {
    return url;
  }

  throw new Error(
    `The resolved URL '${url}' names neither the public npm registry '${publicRegistryPrefix}' nor the approved 1ES public mirror, so it cannot be normalized.`,
  );
};

const [target] = process.argv.slice(2);
const lockfilePath =
  target ?? join(import.meta.dirname, "..", "package-lock.json");

try {
  const contents = readFileSync(lockfilePath, "utf8");
  let rewritten = 0;
  const updated = contents.replace(resolvedPattern, (match, separator, url) => {
    const normalized = normalizeUrl(url);
    if (normalized !== url) {
      rewritten += 1;
    }

    return `"resolved":${separator}"${normalized}"`;
  });

  // Guard against a rewrite that corrupts the lockfile before it is committed.
  JSON.parse(updated);

  if (updated !== contents) {
    writeFileSync(lockfilePath, updated);
  }

  process.stdout.write(
    `Rewrote ${rewritten} resolved URL(s) of '${lockfilePath}' to '${mirrorPrefix}'.\n`,
  );
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
