import { constants, accessSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, join, posix, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export const DEFAULT_PROBE_TIMEOUT_MS = 5_000;
const MAX_PROBE_BYTES = 64 * 1024;

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

export function probeYapsCli(candidate, {
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
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
      child = spawnImpl(candidate, ["status", "--pretty"], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch {
      resolve({ ok: false, reason: "launch_failed" });
      return;
    }
    const append = (chunk) => {
      if (output.length >= MAX_PROBE_BYTES) return;
      output = Buffer.concat([output, Buffer.from(chunk)]).subarray(0, MAX_PROBE_BYTES);
    };
    child.stdout?.on("data", append);
    child.stderr?.on("data", () => {});
    child.on("error", () => finish({ ok: false, reason: "launch_failed" }));
    child.on("close", (code, signal) => {
      if (signal || code !== 0) {
        finish({ ok: false, reason: "status_failed" });
        return;
      }
      try {
        const value = JSON.parse(output.toString("utf8"));
        const valid = value && typeof value === "object"
          && typeof value.settings_path === "string"
          && typeof value.settings_exists === "boolean"
          && typeof value.auth_store_path === "string"
          && typeof value.models_dir === "string";
        finish(valid ? { ok: true } : { ok: false, reason: "invalid_status" });
      } catch {
        finish({ ok: false, reason: "invalid_status" });
      }
    });
    timer = setTimeout(() => {
      try { child.kill(); } catch {}
      finish({ ok: false, reason: "timeout" });
    }, timeoutMs);
  });
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

async function main(argv) {
  if (argv[0] !== "--resolve-cli") return 2;
  const overrideIndex = argv.indexOf("--override");
  const override = overrideIndex >= 0 ? argv[overrideIndex + 1] : undefined;
  const result = await resolveYapsCli({ override });
  if (!result.path) {
    process.stderr.write(`${diagnoseConnection({ cli: result }).message}\n`);
    return 1;
  }
  process.stdout.write(`${JSON.stringify({ path: result.path, source: result.source })}\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main(process.argv.slice(2));
}
