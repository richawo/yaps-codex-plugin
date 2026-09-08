#!/usr/bin/env node

// Runs a plugin command while leaving a deliberately content-free diagnostic
// breadcrumb for the signed-in Yaps desktop app. Never persist command
// arguments, stdout/stderr, prompts, paths, filenames, or generated content.

import { randomUUID } from "node:crypto";
import { chmodSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import {
  applyResolvedSettings,
  classifyCliResolutionFailure,
  commandRequiresActiveAccount,
  diagnoseAccount,
  diagnoseConnection,
  isYapsCliCommand,
  isAuthStatusCommand,
  resolveYapsSession,
} from "./yaps-cli-discovery.mjs";

const MAX_INBOX_EVENTS = 500;
const MAX_CAPTURE_BYTES = 64 * 1024;
const SAFE_STAGES = new Set(["reachability", "authentication", "readiness", "execution", "export", "session"]);
const SAFE_IDENTIFIER = /^[A-Za-z0-9_.-]+$/;

function parseArguments(argv) {
  const separator = argv.indexOf("--");
  if (separator < 0) return null;
  const options = argv.slice(0, separator);
  const command = argv.slice(separator + 1);
  let action;
  let stage = "execution";
  for (let index = 0; index < options.length; index += 1) {
    if (options[index] === "--action") action = options[++index];
    else if (options[index] === "--stage") stage = options[++index];
    else return null;
  }
  if (!command.length || !action || !SAFE_IDENTIFIER.test(action) || action.length > 80 || !SAFE_STAGES.has(stage)) return null;
  return { action, stage, command };
}

function diagnosticsRoot() {
  if (process.env.YAPS_PLUGIN_DIAGNOSTICS_DIR) return resolve(process.env.YAPS_PLUGIN_DIAGNOSTICS_DIR);
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "com.yaps.app", "plugin-diagnostics");
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(appData, "com.yaps.app", "plugin-diagnostics");
  }
  return join(process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"), "com.yaps.app", "plugin-diagnostics");
}

function readOwner(root) {
  try {
    const path = join(root, "owner.json");
    const metadata = lstatSync(path, { throwIfNoEntry: false });
    if (!metadata?.isFile() || metadata.isSymbolicLink() || metadata.size > 8192) return null;
    const marker = JSON.parse(readFileSync(path, "utf8"));
    return marker.schema_version === 1 && /^[a-fA-F0-9]{64}$/.test(marker.owner_key) ? marker.owner_key : null;
  } catch {
    return null;
  }
}

function pluginIdentity(host = integrationHost()) {
  let directory = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 5; depth += 1) {
    const manifests = host === "claude_code"
      ? [join(directory, ".claude-plugin", "plugin.json"), join(directory, ".codex-plugin", "plugin.json")]
      : [join(directory, ".codex-plugin", "plugin.json"), join(directory, ".claude-plugin", "plugin.json")];
    for (const manifest of manifests) {
      try {
        const value = JSON.parse(readFileSync(manifest, "utf8"));
        if (typeof value.name === "string" && value.name.startsWith("yaps-") && SAFE_IDENTIFIER.test(value.name) && typeof value.version === "string" && SAFE_IDENTIFIER.test(value.version)) {
          return { plugin_id: value.name, plugin_version: value.version };
        }
      } catch {
        // Search parent directories; never infer identity from user input.
      }
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return null;
}

function integrationHost() {
  const explicit = process.env.YAPS_PLUGIN_HOST;
  if (["chatgpt_desktop", "codex", "codex_plugin", "claude_code", "unknown"].includes(explicit)) return explicit;
  if (process.env.CLAUDECODE || process.env.CLAUDE_CODE_ENTRYPOINT) return "claude_code";
  if (process.env.CHATGPT_DESKTOP || process.env.OPENAI_CHATGPT_DESKTOP) return "chatgpt_desktop";
  if (process.env.CODEX_HOME || process.env.CODEX_THREAD_ID) return "codex_plugin";
  return "unknown";
}

function appendTail(previous, chunk) {
  const next = Buffer.concat([previous, Buffer.from(chunk)]);
  return next.length <= MAX_CAPTURE_BYTES ? next : next.subarray(next.length - MAX_CAPTURE_BYTES);
}

function classifyError(output, launchError) {
  const value = `${launchError?.code || ""} ${launchError?.message || ""} ${output}`.toLowerCase();
  if (value.includes("enoent") || value.includes("local_yaps_unreachable")) return "local_yaps_unreachable";
  if (value.includes("keychain_unavailable")) return "credential_unavailable";
  if (value.includes("verification_unavailable") || value.includes("refresh_failed")) return "account_cache_incomplete";
  for (const code of ["settings_path_mismatch", "credential_unavailable", "credential_missing", "account_cache_incomplete", "profile_lookup_failed", "platform_mismatch", "unauthenticated"]) {
    if (value.includes(code)) return code;
  }
  if (value.includes("permission") || value.includes("denied")) return "permission_denied";
  if (value.includes("model") && (value.includes("unavailable") || value.includes("not found"))) return "model_unavailable";
  if (value.includes("network") || value.includes("offline") || value.includes("econn")) return "network_unavailable";
  if (value.includes("timeout") || value.includes("timed out")) return "timeout";
  if (value.includes("invalid") || value.includes("usage:")) return "invalid_input";
  if (value.includes("not found") || value.includes("missing")) return "not_found";
  if (value.includes("unsupported")) return "unsupported";
  return "unknown";
}

function pruneInbox(inbox) {
  try {
    const entries = readdirSync(inbox)
      .filter((name) => name.endsWith(".json"))
      .map((name) => ({ name, modified: statSync(join(inbox, name)).mtimeMs }))
      .sort((left, right) => left.modified - right.modified);
    while (entries.length >= MAX_INBOX_EVENTS) unlinkSync(join(inbox, entries.shift().name));
  } catch {
    // Diagnostics must never break the plugin workflow.
  }
}

function writeEvent(context, status, operationId, errorCode, durationMs) {
  if (!context) return;
  const eventId = randomUUID();
  const event = {
    schema_version: 1,
    event_id: eventId,
    operation_id: operationId,
    occurred_at: new Date().toISOString(),
    owner_key: context.ownerKey,
    plugin_id: context.identity.plugin_id,
    plugin_version: context.identity.plugin_version,
    integration_host: context.host,
    integration_transport: "skill_cli",
    plugin_action: context.action,
    stage: context.stage,
    status,
    ...(errorCode ? { error_code: errorCode } : {}),
    ...(Number.isFinite(durationMs) ? { duration_ms: Math.max(0, Math.round(durationMs)) } : {}),
  };
  try {
    const inbox = join(context.root, "inbox");
    mkdirSync(inbox, { recursive: true, mode: 0o700 });
    pruneInbox(inbox);
    const temporary = join(inbox, `.${eventId}.tmp`);
    const destination = join(inbox, `${eventId}.json`);
    writeFileSync(temporary, JSON.stringify(event), { encoding: "utf8", flag: "wx", mode: 0o600 });
    try { chmodSync(temporary, 0o600); } catch {}
    renameSync(temporary, destination);
  } catch {
    // Offline, read-only, and unavailable app-data paths are all non-fatal.
  }
}

const parsed = parseArguments(process.argv.slice(2));
if (!parsed) {
  process.stderr.write("Usage: yaps-plugin-runner --action <safe.action> [--stage <stage>] -- <command> [args...]\n");
  process.exit(2);
}

const root = diagnosticsRoot();
const ownerKey = readOwner(root);
const host = integrationHost();
const identity = pluginIdentity(host);
const context = ownerKey && identity ? { root, ownerKey, identity, host, action: parsed.action, stage: parsed.stage } : null;
const operationId = randomUUID();
const started = Date.now();
writeEvent(context, "attempt", operationId);

let [command, ...commandArguments] = parsed.command;
if (isYapsCliCommand(command)) {
  const commandIsPath = command !== basename(command);
  const accountPreflight = isAuthStatusCommand(commandArguments);
  const requiresActiveAccount = commandRequiresActiveAccount(commandArguments);
  const session = await resolveYapsSession({
    override: commandIsPath ? command : undefined,
    commandArguments,
    recoverAccount: accountPreflight || requiresActiveAccount,
  });
  if (!session.path) {
    const failure = classifyCliResolutionFailure(session);
    writeEvent(context, "failure", operationId, failure.code, Date.now() - started);
    process.stderr.write(`${failure.message}\n`);
    process.exit(failure.exitCode);
  }
  if (accountPreflight) {
    const account = diagnoseAccount(session);
    if (session.authStatusSafety !== "safe" || !session.auth) {
      writeEvent(context, "failure", operationId, account.code, Date.now() - started);
      process.stderr.write(`${account.message}\n`);
      process.exit(78);
    }
    const sanitized = {
      authenticated: session.auth.authenticated === true,
      status: session.auth.status,
      diagnostic_code: session.auth.diagnosticCode,
      credential_status: "not_accessed",
    };
    writeEvent(context, "success", operationId, null, Date.now() - started);
    process.stdout.write(`${JSON.stringify(sanitized, null, commandArguments.includes("--pretty") ? 2 : 0)}\n`);
    process.exit(0);
  }
  if (requiresActiveAccount) {
    const account = diagnoseAccount(session);
    if (account.code !== "ready") {
      writeEvent(context, "failure", operationId, account.code, Date.now() - started);
      process.stderr.write(`${account.message}\n`);
      process.exit(77);
    }
  }
  command = session.path;
  commandArguments = applyResolvedSettings(commandArguments, session.settingsPath);
}

let outputTail = Buffer.alloc(0);
let launchError = null;
let cancelled = false;
const child = spawn(command, commandArguments, { env: process.env, stdio: ["inherit", "pipe", "pipe"], windowsHide: true });
child.stdout.on("data", (chunk) => { outputTail = appendTail(outputTail, chunk); process.stdout.write(chunk); });
child.stderr.on("data", (chunk) => { outputTail = appendTail(outputTail, chunk); process.stderr.write(chunk); });
child.on("error", (error) => { launchError = error; });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { cancelled = true; try { child.kill(signal); } catch {} });
}
child.on("close", (code, signal) => {
  const duration = Date.now() - started;
  if (cancelled || signal) writeEvent(context, "cancelled", operationId, "cancelled", duration);
  else if (code === 0) writeEvent(context, "success", operationId, null, duration);
  else writeEvent(context, "failure", operationId, classifyError(outputTail.toString("utf8"), launchError), duration);
  process.exitCode = code ?? (signal ? 1 : 127);
});
