import assert from "node:assert/strict";
import test from "node:test";

import {
  candidatePaths,
  resolveYapsMcpBinary,
} from "../mcp/server/resolve-yaps.mjs";

test("macOS candidates include system, user, and PATH installs", () => {
  const candidates = candidatePaths({
    platform: "darwin",
    env: {
      HOME: "/user-home/tester",
      PATH: "/opt/homebrew/bin:/usr/local/bin",
    },
  });

  assert.deepEqual(candidates, [
    "/Applications/Yaps.app/Contents/MacOS/yaps_mcp",
    "/user-home/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp",
    "/user-home/tester/.local/bin/yaps_mcp",
    "/opt/homebrew/bin/yaps_mcp",
    "/usr/local/bin/yaps_mcp",
  ]);
});

test("Windows candidates include common application directories", () => {
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
  assert.ok(candidates.includes("C:\\Profiles\\tester\\AppData\\Local\\Programs\\Yaps\\yaps_mcp.exe"));
  assert.ok(candidates.includes("C:\\Windows\\System32\\yaps_mcp.exe"));
});

test("an explicit binary is authoritative", () => {
  const checked = [];
  const result = resolveYapsMcpBinary({
    platform: "darwin",
    env: {
      HOME: "/user-home/tester",
      PATH: "/usr/local/bin",
      YAPS_MCP_BINARY: "/custom/yaps_mcp",
    },
    canAccess(path) {
      checked.push(path);
      return false;
    },
  });

  assert.equal(result, undefined);
  assert.deepEqual(checked, ["/custom/yaps_mcp"]);
});

test("the first accessible discovered binary is selected", () => {
  const result = resolveYapsMcpBinary({
    platform: "darwin",
    env: {
      HOME: "/user-home/tester",
      PATH: "/usr/local/bin",
    },
    canAccess(path) {
      return path === "/user-home/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp";
    },
  });

  assert.equal(result, "/user-home/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp");
});
