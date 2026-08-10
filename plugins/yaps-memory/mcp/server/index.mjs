#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  diagnoseAccount,
  diagnoseConnection,
  resolveYapsConnector,
  resolveYapsSession,
} from "../../scripts/yaps-cli-discovery.mjs";
import { resolveMemoryBootstrap } from "./bootstrap.mjs";

const downloadUrl =
  process.env.YAPS_PLUGIN_HOST === "codex_plugin"
    ? "https://www.yaps.ai/codex?utm_source=codex&utm_medium=plugin&utm_campaign=official_plugins"
    : "https://yaps.ai/download";

const { account, cli, connection, connector } = await resolveMemoryBootstrap({
  diagnoseAccount,
  diagnoseConnection,
  resolveConnector: resolveYapsConnector,
  resolveSession: resolveYapsSession,
});
if (connection.code !== "ready") {
  console.error(connection.message.replace("https://yaps.ai/download", downloadUrl));
  process.exit(1);
}
if (account.code !== "ready") {
  console.error(account.message);
  process.exit(1);
}

const child = spawn(connector.path, process.argv.slice(2), {
  env: {
    ...process.env,
    ...(cli.settingsPath && !process.env.YAPS_SETTINGS_PATH?.trim()
      ? { YAPS_SETTINGS_PATH: cli.settingsPath }
      : {}),
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
