import assert from "node:assert/strict";
import test from "node:test";

import {
  candidatePaths,
  resolveYapsMcpBinary,
} from "../mcp/server/resolve-yaps.mjs";

test("macOS connector candidates use override, PATH, then installed apps", () => {
  const candidates = candidatePaths({
    platform: "darwin",
    env: {
      HOME: "/home/tester",
      PATH: "/opt/homebrew/bin:/usr/local/bin",
    },
  });

  assert.deepEqual(candidates, [
    "/opt/homebrew/bin/yaps_mcp",
    "/usr/local/bin/yaps_mcp",
    "/Applications/Yaps.app/Contents/MacOS/yaps_mcp",
    "/home/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp",
    "/Applications/Setapp/Yaps.app/Contents/MacOS/yaps_mcp",
    "/home/tester/Applications/Setapp/Yaps.app/Contents/MacOS/yaps_mcp",
  ]);
});

test("Windows candidates include only PATH and the verified per-machine install", () => {
  const candidates = candidatePaths({
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Profiles\\tester",
      ProgramW6432: "C:\\Program Files",
      LOCALAPPDATA: "C:\\Profiles\\tester\\AppData\\Local",
      PATH: "C:\\Windows\\System32",
    },
  });

  assert.ok(candidates.includes("C:\\Program Files\\Yaps\\yaps_mcp.exe"));
  assert.ok(candidates.includes("C:\\Windows\\System32\\yaps_mcp.exe"));
  assert.equal(candidates.some((candidate) => candidate.includes("AppData")), false);
});

test("a stale explicit connector override fails closed", () => {
  const checked = [];
  const result = resolveYapsMcpBinary({
    platform: "darwin",
    env: {
      HOME: "/home/tester",
      PATH: "/usr/local/bin",
      YAPS_MCP_BINARY: "/custom/yaps_mcp",
    },
    canAccess(path) {
      checked.push(path);
      return path === "/usr/local/bin/yaps_mcp";
    },
  });

  assert.equal(result, undefined);
  assert.equal(checked[0], "/custom/yaps_mcp");
  assert.equal(checked.length, 1);
});

test("Windows accepts an explicit Yaps install directory", () => {
  const candidates = candidatePaths({
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Profiles\\tester",
      YAPS_INSTALL_DIR: "D:\\Apps\\Yaps",
      PATH: "",
    },
  });

  assert.equal(candidates[0], "D:\\Apps\\Yaps\\yaps_mcp.exe");
});

test("the first accessible discovered binary is selected", () => {
  const result = resolveYapsMcpBinary({
    platform: "darwin",
    env: {
      HOME: "/home/tester",
      PATH: "/usr/local/bin",
    },
    canAccess(path) {
      return path === "/home/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp";
    },
  });

  assert.equal(result, "/home/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp");
});

test("Linux connector fallback is limited to the packaged /usr/bin location", () => {
  assert.deepEqual(candidatePaths({ platform: "linux", env: { HOME: "/home/tester", PATH: "" } }), [
    "/usr/bin/yaps_mcp",
  ]);
});
