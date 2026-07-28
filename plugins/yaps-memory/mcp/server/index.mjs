#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolveYapsMcpBinary } from "./resolve-yaps.mjs";

const binary = resolveYapsMcpBinary();
if (!binary) {
  console.error(
    [
      "Yaps MCP could not find the Yaps desktop app.",
      "Download Yaps: https://yaps.ai/download",
      "Then open Yaps, finish setup, and start a new AI client session.",
    ].join("\n"),
  );
  process.exit(1);
}

const child = spawn(binary, process.argv.slice(2), {
  env: {
    ...process.env,
    YAPS_MCP_CLIENT_ID: process.env.YAPS_MCP_CLIENT_ID || "claude-code",
  },
  stdio: "inherit",
  windowsHide: true,
});

child.on("error", (error) => {
  console.error(`Yaps MCP failed to start: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
