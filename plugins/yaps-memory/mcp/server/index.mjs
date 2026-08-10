#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  diagnoseConnection,
  resolveYapsCli,
  resolveYapsConnector,
} from "../../scripts/yaps-cli-discovery.mjs";

const downloadUrl =
  process.env.YAPS_PLUGIN_HOST === "codex_plugin"
    ? "https://www.yaps.ai/codex?utm_source=codex&utm_medium=plugin&utm_campaign=official_plugins"
    : "https://yaps.ai/download";

const cli = await resolveYapsCli();
const connector = cli.path ? resolveYapsConnector() : { path: null, source: null };
const diagnosis = diagnoseConnection({ cli, connector, needsConnector: true });
if (diagnosis.code !== "ready") {
  console.error(diagnosis.message.replace("https://yaps.ai/download", downloadUrl));
  process.exit(1);
}

const child = spawn(connector.path, process.argv.slice(2), {
  env: {
    ...process.env,
    YAPS_MCP_CLIENT_ID: process.env.YAPS_MCP_CLIENT_ID || "claude-code",
  },
  stdio: "inherit",
  windowsHide: true,
});

child.on("error", (error) => {
  console.error(
    "The Yaps CLI is installed and working, but the private-vault connector could not start. Update or reinstall Yaps, open it once, then start a new local task.",
  );
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
