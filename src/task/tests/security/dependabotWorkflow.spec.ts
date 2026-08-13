/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";

const getJobSection = (contents: string, jobName: string): string => {
  const lines: string[] = contents.replaceAll("\r\n", "\n").split("\n");
  const startIndex: number = lines.findIndex(
    (line: string): boolean => line === `  ${jobName}:`,
  );

  assert.ok(startIndex >= 0, `Could not find job '${jobName}'.`);

  const endIndex: number = lines.findIndex(
    (line: string, index: number): boolean =>
      index > startIndex &&
      line.startsWith("  ") &&
      !line.startsWith("    ") &&
      line.trimEnd().endsWith(":"),
  );

  const jobLines: string[] =
    endIndex === -1
      ? lines.slice(startIndex)
      : lines.slice(startIndex, endIndex);

  return `${jobLines.join("\n")}\n`;
};

describe(".github/workflows/build.yml dependabot job", (): void => {
  const workflowFile: string = path.join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
    ".github",
    "workflows",
    "build.yml",
  );
  const workflowContents: string = fs.readFileSync(workflowFile, "utf8");
  const dependabotJob: string = getJobSection(workflowContents, "dependabot");

  it("keeps the Dependabot job unprivileged and unconditional", (): void => {
    assert.equal(dependabotJob.includes("    name: Dependabot"), true);
    assert.equal(dependabotJob.includes("    permissions: {}"), true);
    assert.equal(dependabotJob.includes("    if:"), false);
    assert.equal(dependabotJob.includes("    environment:"), false);
    assert.equal(dependabotJob.includes("id-token: write"), false);
    assert.equal(dependabotJob.includes("actions/checkout@"), false);
    assert.equal(
      dependabotJob.includes(".github/actions/mint-github-app-token"),
      false,
    );
    assert.equal(
      dependabotJob.includes("steps.app-token.outputs.token"),
      false,
    );
    assert.equal(dependabotJob.includes("gh pr review --approve"), false);
    assert.equal(dependabotJob.includes("        run: gh --version"), true);
  });
});
