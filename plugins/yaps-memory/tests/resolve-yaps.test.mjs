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
      HOME: "/Users/tester",
      PATH: "/opt/homebrew/bin:/usr/local/bin",
    },
  });

  assert.deepEqual(candidates, [
    "/Applications/Yaps.app/Contents/MacOS/yaps_mcp",
    "/Users/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp",
    "/Users/tester/.local/bin/yaps_mcp",
    "/opt/homebrew/bin/yaps_mcp",
    "/usr/local/bin/yaps_mcp",
  ]);
});

test("Windows candidates include common application directories", () => {
  const candidates = candidatePaths({
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Users\\tester",
      ProgramW6432: "C:\\Program Files",
      LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
      PATH: "C:\\Windows\\System32",
    },
  });

  assert.ok(candidates.includes("C:\\Program Files\\Yaps\\yaps_mcp.exe"));
  assert.ok(candidates.includes("C:\\Users\\tester\\AppData\\Local\\Programs\\Yaps\\yaps_mcp.exe"));
  assert.ok(candidates.includes("C:\\Windows\\System32\\yaps_mcp.exe"));
});

test("a stale explicit binary falls back to a healthy installed app", () => {
  const checked = [];
  const result = resolveYapsMcpBinary({
    platform: "darwin",
    env: {
      HOME: "/Users/tester",
      PATH: "/usr/local/bin",
      YAPS_MCP_BINARY: "/custom/yaps_mcp",
    },
    canAccess(path) {
      checked.push(path);
      return path === "/usr/local/bin/yaps_mcp";
    },
  });

  assert.equal(result, "/usr/local/bin/yaps_mcp");
  assert.equal(checked[0], "/custom/yaps_mcp");
  assert.equal(checked.at(-1), "/usr/local/bin/yaps_mcp");
});

test("Windows accepts an explicit Yaps install directory", () => {
  const candidates = candidatePaths({
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Users\\tester",
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
      HOME: "/Users/tester",
      PATH: "/usr/local/bin",
    },
    canAccess(path) {
      return path === "/Users/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp";
    },
  });

  assert.equal(result, "/Users/tester/Applications/Yaps.app/Contents/MacOS/yaps_mcp");
});
