import assert from "node:assert/strict";
import test from "node:test";

import {
  WINDOWS_RUNNING_YAPS_PROCESS_COMMAND,
  classifyCliResolutionFailure,
  cliCandidates,
  diagnoseAccount,
  diagnoseConnection,
  parseRunningYapsExecutables,
  resolveYapsCli,
  resolveYapsSession,
  runningAppCliCandidates,
} from "../yaps-video-clipping/scripts/yaps-cli-discovery.mjs";

const validProbe = async () => ({ ok: true });

test("Windows keeps verified Program Files candidates when plugin hosts omit Program* variables", () => {
  const candidates = cliCandidates({
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Users\\tester",
      PATH: "",
      LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
    },
  });

  assert.deepEqual(candidates, [
    { path: "C:\\Program Files\\Yaps\\yaps_cli.exe", source: "installed_app" },
    { path: "C:\\Program Files (x86)\\Yaps\\yaps_cli.exe", source: "installed_app" },
  ]);
  assert.equal(candidates.some(({ path }) => /AppData/i.test(path)), false);
});

test("Windows running-app discovery only accepts fixed Yaps process names", () => {
  assert.deepEqual(
    runningAppCliCandidates({
      platform: "win32",
      runningExecutables: [
        "C:\\Program Files\\Yaps\\yaps.exe",
        "C:\\Users\\tester\\portable\\yaps_mcp.exe",
        "C:\\Windows\\System32\\notepad.exe",
      ],
    }),
    [
      { path: "C:\\Program Files\\Yaps\\yaps_cli.exe", source: "running_app" },
      { path: "C:\\Users\\tester\\portable\\yaps_cli.exe", source: "running_app" },
    ],
  );
  assert.deepEqual(
    parseRunningYapsExecutables(
      "C:\\Users\\tester\\portable\\yaps.exe\r\nC:\\Windows\\System32\\notepad.exe\r\nnot-a-path\r\n",
    ),
    ["C:\\Users\\tester\\portable\\yaps.exe"],
  );
  assert.match(WINDOWS_RUNNING_YAPS_PROCESS_COMMAND, /Win32_Process/);
  assert.doesNotMatch(WINDOWS_RUNNING_YAPS_PROCESS_COMMAND, /\$env:|Program Files|portable/);
});

test("Windows prefers a current running sidecar over a leftover 2.1.4 helper", async () => {
  const stale = "C:\\Program Files\\Yaps\\yaps_cli.exe";
  const current = "C:\\Users\\tester\\portable\\yaps_cli.exe";
  const result = await resolveYapsCli({
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Users\\tester",
      PATH: "",
      ProgramFiles: "C:\\Program Files",
      ProgramW6432: "C:\\Program Files",
    },
    runningExecutables: [
      "C:\\Program Files\\Yaps\\yaps.exe",
      "C:\\Users\\tester\\portable\\yaps.exe",
    ],
    canAccess: (candidate) => candidate === stale || candidate === current,
    probe: validProbe,
    readAppVersion: async (cli) => (cli.path === current ? "2.3.2129" : "2.1.4"),
  });

  assert.deepEqual({ path: result.path, source: result.source }, { path: current, source: "running_app" });
  assert.ok(result.rejected.some(({ reason }) => reason === "stale_cli"));
});

test("a leftover-only helper remains an account-safety diagnosis", async () => {
  const stale = "C:\\Program Files\\Yaps\\yaps_cli.exe";
  const session = await resolveYapsSession({
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Users\\tester",
      PATH: "",
      ProgramFiles: "C:\\Program Files",
    },
    runningExecutables: [],
    canAccess: (candidate) => candidate === stale,
    probe: validProbe,
    readAppVersion: async () => "2.1.4",
  });

  const failure = classifyCliResolutionFailure(session);
  assert.equal(session.path, null);
  assert.equal(session.authStatusSafety, "unsafe");
  assert.equal(diagnoseConnection({ cli: session }).code, "account_status_unsafe");
  assert.equal(diagnoseAccount(session).code, "account_status_unsafe");
  assert.deepEqual(
    { code: failure.code, exitCode: failure.exitCode },
    { code: "account_status_unsafe", exitCode: 78 },
  );
});
