import { constants, accessSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, join, posix, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export const DEFAULT_PROBE_TIMEOUT_MS = 5_000;
export const DEFAULT_AUTH_TIMEOUT_MS = 2_000;
export const DEFAULT_AUTH_RECOVERY_TIMEOUT_MS = 8_000;
const MAX_PROBE_BYTES = 64 * 1024;
const DEFAULT_AUTH_RETRY_DELAYS_MS = [250, 500, 1_000, 2_000];
const REFRESHABLE_ACCOUNT_STATES = new Set([
  "cached_offline",
  "credential_missing",
  "verification_unavailable",
]);
const REFRESHABLE_ACCOUNT_DIAGNOSTICS = new Set([
  "account_cache_incomplete",
  "credential_missing",
  "profile_lookup_failed",
  "refresh_failed",
]);

function pathApi(platform) {
  return platform === "win32" ? win32 : posix;
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return candidates.filter(({ path }) => {
    if (!path || seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}

function pathCandidates(name, { platform, env }) {
  const path = pathApi(platform);
  const extensions = platform === "win32"
    ? (env.PATHEXT || ".EXE;.CMD").split(";").filter(Boolean)
    : [""];
  const candidates = [];
  for (const directory of (env.PATH || "").split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const suffix = platform === "win32" ? extension.toLowerCase() : extension;
      candidates.push({ path: path.join(directory, `${name}${suffix}`), source: "path" });
    }
  }
  return candidates;
}

function installedCandidates(binaryName, { platform, env, home }) {
  const path = pathApi(platform);
  if (platform === "darwin") {
    return [
      { path: `/Applications/Yaps.app/Contents/MacOS/${binaryName}`, source: "installed_app" },
      ...(home ? [{ path: path.join(home, "Applications", "Yaps.app", "Contents", "MacOS", binaryName), source: "installed_app_user" }] : []),
      { path: `/Applications/Setapp/Yaps.app/Contents/MacOS/${binaryName}`, source: "installed_app_setapp" },
      ...(home ? [{ path: path.join(home, "Applications", "Setapp", "Yaps.app", "Contents", "MacOS", binaryName), source: "installed_app_setapp_user" }] : []),
    ];
  }
  if (platform === "win32") {
    const executable = `${binaryName}.exe`;
    return [env.ProgramW6432, env.ProgramFiles]
      .filter(Boolean)
      .map((root) => ({ path: path.join(root, "Yaps", executable), source: "installed_app" }));
  }
  if (platform === "linux") {
    // Tauri's verified deb/rpm/AppImage layout places external binaries in
    // usr/bin. /usr/bin is the only non-PATH Linux fallback we can assert
    // without scanning arbitrary mounts or home directories.
    return [{ path: `/usr/bin/${binaryName}`, source: "installed_app" }];
  }
  return [];
}

export function cliCandidates({
  override,
  platform = process.platform,
  env = process.env,
  home = env.HOME || env.USERPROFILE || homedir(),
} = {}) {
  const path = pathApi(platform);
  const executable = platform === "win32" ? "yaps_cli.exe" : "yaps_cli";
  const explicit = [
    override?.trim(),
    env.YAPS_CLI_BINARY?.trim(),
    env.YAPS_INSTALL_DIR?.trim() ? path.join(env.YAPS_INSTALL_DIR.trim(), executable) : "",
  ].find(Boolean);
  return uniqueCandidates([
    ...(explicit ? [{ path: explicit, source: "override" }] : []),
    ...pathCandidates("yaps", { platform, env }),
    ...pathCandidates("yaps_cli", { platform, env }),
    ...installedCandidates("yaps_cli", { platform, env, home }),
  ]);
}

export function connectorCandidates({
  platform = process.platform,
  env = process.env,
  home = env.HOME || env.USERPROFILE || homedir(),
} = {}) {
  const path = pathApi(platform);
  const executable = platform === "win32" ? "yaps_mcp.exe" : "yaps_mcp";
  const explicit = [
    env.YAPS_MCP_BINARY?.trim(),
    env.YAPS_INSTALL_DIR?.trim() ? path.join(env.YAPS_INSTALL_DIR.trim(), executable) : "",
  ].find(Boolean);
  return uniqueCandidates([
    ...(explicit ? [{ path: explicit, source: "override" }] : []),
    ...pathCandidates("yaps_mcp", { platform, env }),
    ...installedCandidates("yaps_mcp", { platform, env, home }),
  ]);
}

function defaultCanAccess(candidate, platform) {
  try {
    accessSync(candidate, platform === "win32" ? constants.F_OK : constants.X_OK);
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function defaultPathExists(candidate) {
  try {
    accessSync(candidate, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function runJsonCommand(candidate, args, {
  timeoutMs,
  spawnImpl = spawn,
  env = process.env,
} = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let output = Buffer.alloc(0);
    let timer;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };
    let child;
    try {
      child = spawnImpl(candidate, args, {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch {
      resolve({ ok: false, reason: "launch_failed" });
      return;
    }
    child.stdout?.on("data", (chunk) => {
      if (settled) return;
      const next = Buffer.concat([output, Buffer.from(chunk)]);
      if (next.length > MAX_PROBE_BYTES) {
        try { child.kill(); } catch {}
        finish({ ok: false, reason: "output_too_large" });
        return;
      }
      output = next;
    });
    child.stderr?.on("data", () => {});
    child.on("error", () => finish({ ok: false, reason: "launch_failed" }));
    child.on("close", (code, signal) => {
      if (signal || code !== 0) {
        finish({ ok: false, reason: "status_failed" });
        return;
      }
      try {
        const value = JSON.parse(output.toString("utf8"));
        finish(value && typeof value === "object" && !Array.isArray(value)
          ? { ok: true, value }
          : { ok: false, reason: "invalid_status" });
      } catch {
        finish({ ok: false, reason: "invalid_status" });
      }
    });
    timer = setTimeout(() => {
      try { child.kill(); } catch {}
      finish({ ok: false, reason: "timeout" });
    }, Math.max(1, timeoutMs || DEFAULT_PROBE_TIMEOUT_MS));
  });
}

export function resolveWindowsShim(candidate, {
  platform = process.platform,
  canAccess = (path) => defaultCanAccess(path, platform),
  readFile = readFileSync,
} = {}) {
  if (platform !== "win32" || !/\.cmd$/i.test(candidate)) return candidate;
  try {
    for (const line of readFile(candidate, "utf8").split(/\r?\n/)) {
      const match = line.trim().match(/^"([^"]+)"\s+%\*\s*$/i);
      if (!match) continue;
      const target = match[1].replace(/%%/g, "%");
      if (canAccess(target)) return target;
    }
  } catch {
    // The inaccessible shim will be rejected by the normal validation path.
  }
  return null;
}

export async function probeYapsCli(candidate, options = {}) {
  const result = await runJsonCommand(candidate, ["status", "--pretty"], {
    ...options,
    timeoutMs: options.timeoutMs || DEFAULT_PROBE_TIMEOUT_MS,
  });
  if (!result.ok) return result;
  const value = result.value;
  const valid = typeof value.settings_path === "string"
    && typeof value.settings_exists === "boolean"
    && typeof value.auth_store_path === "string"
    && typeof value.models_dir === "string";
  return valid ? { ok: true } : { ok: false, reason: "invalid_status" };
}

export async function resolveYapsCli(options = {}) {
  const platform = options.platform || process.platform;
  const canAccess = options.canAccess || ((path) => defaultCanAccess(path, platform));
  const probe = options.probe || ((path, probeOptions) => probeYapsCli(path, { ...options, ...probeOptions }));
  const now = options.now || Date.now;
  const deadline = now() + (options.totalTimeoutMs || 15_000);
  const rejected = [];
  const candidates = cliCandidates(options);
  const authoritativeOverride = candidates[0]?.source === "override";
  let probes = 0;
  for (const candidate of candidates) {
    if (now() >= deadline || probes >= 8) break;
    if (!canAccess(candidate.path)) continue;
    const resolvedPath = resolveWindowsShim(candidate.path, { platform, canAccess, readFile: options.readFile });
    if (!resolvedPath) {
      rejected.push({ source: candidate.source, reason: "invalid_shim" });
      if (authoritativeOverride) break;
      continue;
    }
    probes += 1;
    const validation = await probe(resolvedPath, { timeoutMs: Math.min(DEFAULT_PROBE_TIMEOUT_MS, Math.max(1, deadline - now())) });
    if (validation?.ok) return { ...candidate, path: resolvedPath, rejected };
    rejected.push({ source: candidate.source, reason: validation?.reason || "invalid_status" });
    if (authoritativeOverride) break;
  }
  return { path: null, source: null, rejected };
}

function explicitSettingsSelected(args, env) {
  return Boolean(env.YAPS_SETTINGS_PATH?.trim())
    || args.some((value) => value === "--settings-path" || value.startsWith("--settings-path="));
}

function normalizedRecommendedSettingsPath(value, platform) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  const path = pathApi(platform);
  if (!candidate || candidate.length > 4_096 || candidate.includes("\0")) return null;
  if (!path.isAbsolute(candidate) || path.basename(candidate).toLowerCase() !== "settings.json") return null;
  return candidate;
}

function sanitizedAuthStatus(value, platform) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.authenticated !== "boolean" || typeof value.status !== "string") return null;
  return {
    authenticated: value.authenticated,
    status: value.status,
    diagnosticCode: typeof value.diagnostic_code === "string" ? value.diagnostic_code : null,
    recommendedSettingsPath: normalizedRecommendedSettingsPath(value.recommended_settings_path, platform),
  };
}

export async function readYapsAuthStatus(cliPath, {
  settingsPath,
  platform = process.platform,
  timeoutMs = DEFAULT_AUTH_TIMEOUT_MS,
  ...options
} = {}) {
  const args = [
    ...(settingsPath ? ["--settings-path", settingsPath] : []),
    "--pretty",
    "auth",
    "status",
  ];
  const result = await runJsonCommand(cliPath, args, { ...options, timeoutMs });
  if (!result.ok) return result;
  const auth = sanitizedAuthStatus(result.value, platform);
  return auth ? { ok: true, auth } : { ok: false, reason: "invalid_auth_status" };
}

function refreshableAccount(auth) {
  return Boolean(auth) && (
    REFRESHABLE_ACCOUNT_STATES.has(auth.status)
    || REFRESHABLE_ACCOUNT_DIAGNOSTICS.has(auth.diagnosticCode)
  );
}

function installedAppLaunch(cli, {
  platform,
  canAccess,
  pathExists,
}) {
  if (!cli?.path) return null;
  const path = pathApi(platform);
  if (platform === "darwin") {
    const suffix = "/Contents/MacOS/yaps_cli";
    if (!cli.path.endsWith(suffix)) return null;
    const application = cli.path.slice(0, -suffix.length);
    if (path.basename(application) !== "Yaps.app" || !pathExists(application)) return null;
    return { command: "/usr/bin/open", args: ["-g", application], detached: false };
  }
  if (platform === "win32" && path.basename(cli.path).toLowerCase() === "yaps_cli.exe") {
    const application = path.join(path.dirname(cli.path), "Yaps.exe");
    if (!canAccess(application)) return null;
    return { command: application, args: [], detached: true };
  }
  return null;
}

export function launchInstalledYaps(cli, {
  platform = process.platform,
  spawnImpl = spawn,
  canAccess = (candidate) => defaultCanAccess(candidate, platform),
  pathExists = defaultPathExists,
  timeoutMs = 3_000,
} = {}) {
  const launch = installedAppLaunch(cli, { platform, canAccess, pathExists });
  if (!launch) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(value);
    };
    try {
      const child = spawnImpl(launch.command, launch.args, {
        detached: launch.detached,
        stdio: "ignore",
        windowsHide: true,
      });
      child.on("error", () => finish(false));
      child.on("spawn", () => {
        if (launch.detached) child.unref?.();
        finish(true);
      });
      timer = setTimeout(() => {
        try { child.kill(); } catch {}
        finish(false);
      }, Math.max(1, timeoutMs));
    } catch {
      finish(false);
    }
  });
}

export function applyResolvedSettings(args, settingsPath, { env = process.env } = {}) {
  if (!settingsPath || explicitSettingsSelected(args, env)) return [...args];
  return ["--settings-path", settingsPath, ...args];
}

export async function resolveYapsSession(options = {}) {
  const platform = options.platform || process.platform;
  const env = options.env || process.env;
  const commandArguments = options.commandArguments || [];
  const cli = options.cli || await resolveYapsCli(options);
  if (!cli.path) {
    return { ...cli, settingsPath: null, auth: null, appLaunchAttempted: false, appLaunchSucceeded: false };
  }

  const readAuth = options.readAuth || ((settingsPath, timeoutMs) => readYapsAuthStatus(cli.path, {
    ...options,
    platform,
    env,
    settingsPath,
    timeoutMs,
  }));
  const explicitSettings = explicitSettingsSelected(commandArguments, env);
  let settingsPath = null;
  let authResult = await readAuth(null, DEFAULT_AUTH_TIMEOUT_MS);
  let auth = authResult.ok ? authResult.auth : null;

  if (!explicitSettings && auth?.recommendedSettingsPath && auth.status === "settings_path_mismatch") {
    const retry = await readAuth(auth.recommendedSettingsPath, DEFAULT_AUTH_TIMEOUT_MS);
    if (retry.ok) {
      settingsPath = auth.recommendedSettingsPath;
      auth = retry.auth;
    }
  }

  let appLaunchAttempted = false;
  let appLaunchSucceeded = false;
  if (refreshableAccount(auth)) {
    appLaunchAttempted = true;
    const launchApp = options.launchApp || ((target) => launchInstalledYaps(target, options));
    appLaunchSucceeded = await launchApp(cli);
    if (appLaunchSucceeded) {
      const now = options.now || Date.now;
      const sleep = options.sleep || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
      const deadline = now() + (options.authRecoveryTimeoutMs || DEFAULT_AUTH_RECOVERY_TIMEOUT_MS);
      const delays = options.authRetryDelaysMs || DEFAULT_AUTH_RETRY_DELAYS_MS;
      for (const delay of delays) {
        const beforeSleep = deadline - now();
        if (beforeSleep <= 0) break;
        await sleep(Math.min(delay, beforeSleep));
        const remaining = deadline - now();
        if (remaining <= 0) break;
        const retry = await readAuth(settingsPath, Math.min(DEFAULT_AUTH_TIMEOUT_MS, remaining));
        if (!retry.ok) continue;
        auth = retry.auth;
        if (!refreshableAccount(auth)) break;
      }
    }
  }

  return { ...cli, settingsPath, auth, appLaunchAttempted, appLaunchSucceeded };
}

export function resolveYapsConnector(options = {}) {
  const platform = options.platform || process.platform;
  const canAccess = options.canAccess || ((path) => defaultCanAccess(path, platform));
  const candidates = connectorCandidates(options);
  if (candidates[0]?.source === "override") {
    return canAccess(candidates[0].path) ? candidates[0] : { path: null, source: null };
  }
  return candidates.find((candidate) => canAccess(candidate.path)) || { path: null, source: null };
}

export function diagnoseConnection({ cli, connector, needsConnector = false }) {
  if (!cli?.path) {
    if (cli?.rejected?.length) {
      return {
        code: "cli_invalid",
        message: "A Yaps CLI candidate was found, but it did not pass the safe status check. If you set YAPS_CLI_BINARY, correct or remove that override. Otherwise update or reinstall Yaps, open it once, then start a new local ChatGPT or Codex task. Do not install a separate CLI or edit PATH.",
      };
    }
    return {
      code: "cli_missing",
      message: "The Yaps CLI could not be found from this local session. Install or update Yaps from https://yaps.ai/download, open it once, then start a new local ChatGPT or Codex task. The CLI is included with Yaps; no separate CLI or PATH setup is needed.",
    };
  }
  if (needsConnector && !connector?.path) {
    return {
      code: "vault_connector_unavailable",
      message: "The Yaps CLI is installed and working, but the private-vault connector is unavailable. Update or reinstall Yaps from https://yaps.ai/download, open it once, then start a new local ChatGPT or Codex task. Do not reinstall the plugin, install a separate CLI, or edit PATH.",
    };
  }
  return { code: "ready", message: "Yaps is ready." };
}

export function diagnoseAccount(session) {
  const auth = session?.auth;
  if (!auth) {
    return {
      code: "account_status_unavailable",
      message: "The Yaps CLI is installed, but this plugin could not read the desktop account status. Update Yaps, open it once, and retry. No separate plugin connection or account is required.",
    };
  }
  if (auth.authenticated && auth.status === "active") {
    return {
      code: "ready",
      message: "The signed-in Yaps account is active. An active trial or Yaps Pro both count.",
    };
  }
  if (auth.status === "platform_mismatch") {
    return {
      code: "platform_mismatch",
      message: "Yaps is signed in, but this account only has mobile access. Activate desktop-compatible access in Yaps; the plugin will use it automatically.",
    };
  }
  if (auth.status === "expired") {
    return {
      code: "account_expired",
      message: "Yaps is signed in, but its trial or Yaps Pro access is not active. Open Yaps to review the available trial or Yaps Pro options; the plugin will pick up the change automatically.",
    };
  }
  if (refreshableAccount(auth)) {
    const attempted = session.appLaunchAttempted
      ? "The plugin opened the installed Yaps app automatically, but the account cache did not refresh in time. "
      : "";
    return {
      code: "account_cache_incomplete",
      message: `${attempted}Yaps found the desktop sign-in but could not verify current trial or Yaps Pro access. Check the internet connection and retry; do not create a separate plugin account.`,
    };
  }
  if (auth.status === "settings_path_mismatch") {
    return {
      code: "settings_path_mismatch",
      message: "Yaps is installed, but the alternate desktop settings file could not be validated automatically. Update or reinstall Yaps and retry; do not edit PATH or reconnect the plugin.",
    };
  }
  return {
    code: "unauthenticated",
    message: "Yaps is installed, but no active desktop account is signed in. Sign in inside Yaps and start an available trial or activate Yaps Pro; the plugin then uses that same session automatically, with no separate connection.",
  };
}

async function main(argv) {
  if (!["--resolve-cli", "--resolve-session"].includes(argv[0])) return 2;
  const overrideIndex = argv.indexOf("--override");
  const override = overrideIndex >= 0 ? argv[overrideIndex + 1] : undefined;
  const result = argv[0] === "--resolve-session"
    ? await resolveYapsSession({ override })
    : await resolveYapsCli({ override });
  if (!result.path) {
    process.stderr.write(`${diagnoseConnection({ cli: result }).message}\n`);
    return 1;
  }
  const account = argv[0] === "--resolve-session" ? diagnoseAccount(result) : null;
  process.stdout.write(`${JSON.stringify({
    path: result.path,
    source: result.source,
    ...(argv[0] === "--resolve-session" ? {
      settings_path: result.settingsPath,
      authenticated: result.auth?.authenticated === true,
      account_status: result.auth?.status || "unknown",
      diagnostic_code: result.auth?.diagnosticCode || null,
      app_launch_attempted: result.appLaunchAttempted,
      account_code: account.code,
      account_message: account.message,
    } : {}),
  })}\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main(process.argv.slice(2));
}
