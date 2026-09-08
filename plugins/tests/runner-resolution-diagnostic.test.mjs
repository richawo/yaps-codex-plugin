import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { classifyCliResolutionFailure } from "../yaps-dictation/scripts/yaps-cli-discovery.mjs";

const pluginsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const RUNNER_NO_PATH_BLOCK = /if \(!session\.path\) \{\s*const failure = classifyCliResolutionFailure\(session\);\s*writeEvent\(context, "failure", operationId, failure\.code, Date\.now\(\) - started\);\s*process\.stderr\.write\(`\$\{failure\.message\}\\n`\);\s*process\.exit\(failure\.exitCode\);\s*\}/s;

/**
 * Same final diagnostic the Codex runners emit when resolveYapsSession
 * returns no bindable path. This is the runner contract, not finder selection.
 */
function simulateRunnerResolutionFailure(session) {
  if (!session.path) {
    const failure = classifyCliResolutionFailure(session);
    return {
      eventCode: failure.code,
      stderr: `${failure.message}\n`,
      exitCode: failure.exitCode,
    };
  }
  return null;
}

test("dictation runner records account_status_unsafe and exits 78 for stale-only rejection", () => {
  const session = {
    path: null,
    rejected: [{ path: "C:\\Program Files\\Yaps\\yaps_cli.exe", reason: "stale_cli" }],
    appVersion: "2.1.4",
  };
  const diagnostic = simulateRunnerResolutionFailure(session);
  assert.deepEqual(
    { code: diagnostic.eventCode, exitCode: diagnostic.exitCode },
    { code: "account_status_unsafe", exitCode: 78 },
  );
});

test("dictation runner records local_yaps_unreachable and exits 127 when no stale CLI was rejected", () => {
  const session = { path: null, rejected: [] };
  const diagnostic = simulateRunnerResolutionFailure(session);
  assert.deepEqual(
    { code: diagnostic.eventCode, exitCode: diagnostic.exitCode },
    { code: "local_yaps_unreachable", exitCode: 127 },
  );
});

test("every Codex runner uses classifyCliResolutionFailure for the no-path exit", () => {
  const pluginNames = readdirSync(pluginsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("yaps-"))
    .map((entry) => entry.name)
    .sort();
  assert.equal(pluginNames.length, 12);
  for (const pluginName of pluginNames) {
    const runner = readFileSync(
      join(pluginsRoot, pluginName, "scripts", "yaps-plugin-runner.mjs"),
      "utf8",
    );
    assert.match(runner, /classifyCliResolutionFailure/, pluginName);
    assert.match(runner, RUNNER_NO_PATH_BLOCK, pluginName);
  }
});
