import { constants, accessSync, closeSync, openSync, readFileSync, readSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, join, posix, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

// Read only named non-secret settings by default. Callers can supply their own
// explicit environment; discovery never needs an agent provider credential.
export function defaultYapsEnvironment() {
  return Object.fromEntries(Object.entries({
    "PATH": process.env["PATH"],
    "Path": process.env["Path"],
    "PATHEXT": process.env["PATHEXT"],
    "HOME": process.env["HOME"],
    "USERPROFILE": process.env["USERPROFILE"],
    "HOMEDRIVE": process.env["HOMEDRIVE"],
    "HOMEPATH": process.env["HOMEPATH"],
    "APPDATA": process.env["APPDATA"],
    "LOCALAPPDATA": process.env["LOCALAPPDATA"],
    "ProgramFiles": process.env["ProgramFiles"],
    "ProgramFiles(x86)": process.env["ProgramFiles(x86)"],
    "ProgramW6432": process.env["ProgramW6432"],
    "SystemRoot": process.env["SystemRoot"],
    "SYSTEMROOT": process.env["SYSTEMROOT"],
    "WINDIR": process.env["WINDIR"],
    "COMSPEC": process.env["COMSPEC"],
    "ComSpec": process.env["ComSpec"],
    "TMPDIR": process.env["TMPDIR"],
    "TMP": process.env["TMP"],
    "TEMP": process.env["TEMP"],
    "LANG": process.env["LANG"],
    "LANGUAGE": process.env["LANGUAGE"],
    "LC_ALL": process.env["LC_ALL"],
    "LC_CTYPE": process.env["LC_CTYPE"],
    "TZ": process.env["TZ"],
    "XDG_CONFIG_HOME": process.env["XDG_CONFIG_HOME"],
    "XDG_DATA_HOME": process.env["XDG_DATA_HOME"],
    "XDG_CACHE_HOME": process.env["XDG_CACHE_HOME"],
    "XDG_RUNTIME_DIR": process.env["XDG_RUNTIME_DIR"],
    "DISPLAY": process.env["DISPLAY"],
    "WAYLAND_DISPLAY": process.env["WAYLAND_DISPLAY"],
    "DBUS_SESSION_BUS_ADDRESS": process.env["DBUS_SESSION_BUS_ADDRESS"],
    "YAPS_CLI_BINARY": process.env["YAPS_CLI_BINARY"],
    "YAPS_INSTALL_DIR": process.env["YAPS_INSTALL_DIR"],
    "YAPS_MCP_BINARY": process.env["YAPS_MCP_BINARY"],
    "YAPS_SETTINGS_PATH": process.env["YAPS_SETTINGS_PATH"],
    "YAPS_CLI_PROGRESS": process.env["YAPS_CLI_PROGRESS"],
  }).filter(([, value]) => typeof value === "string"));
}

export const DEFAULT_PROBE_TIMEOUT_MS = 5_000;
export const DEFAULT_AUTH_TIMEOUT_MS = 2_000;
export const DEFAULT_AUTH_RECOVERY_TIMEOUT_MS = 8_000;
export const MIN_SAFE_AUTH_STATUS_VERSION = "2.3.124";
const MAX_PROBE_BYTES = 64 * 1024;
const MAX_VERSION_BYTES = 4 * 1024;
const MAX_PE_RESOURCE_BYTES = 2 * 1024 * 1024;
const MAX_PLIST_BYTES = 64 * 1024;
const MAX_WINDOWS_SHIM_BYTES = 4 * 1024;
const RUNNING_YAPS_PROCESS_NAMES = new Set(["yaps.exe", "yaps_mcp.exe", "yaps_cli.exe"]);
// Fixed WMI filter: never interpolate a discovered path into this command.
export const WINDOWS_RUNNING_YAPS_PROCESS_COMMAND = "Get-CimInstance -ClassName Win32_Process -Filter \"Name = 'yaps.exe' OR Name = 'yaps_mcp.exe' OR Name = 'yaps_cli.exe'\" | ForEach-Object { $_.ExecutablePath }";
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
  let extensions = platform === "win32"
    ? (env.PATHEXT || ".EXE;.CMD").split(";").filter(Boolean)
    : [""];
  // Current Windows installs expose `yaps.cmd` as the PATH shim. Older Yaps
  // releases could leave a copied `yaps.exe` beside it, so prefer the shim
  // before that stale executable while retaining both as fallbacks.
  if (platform === "win32" && name === "yaps") {
    extensions = [...extensions].sort((left, right) =>
      Number(right.toLowerCase() === ".cmd") - Number(left.toLowerCase() === ".cmd"));
  }
  const candidates = [];
  for (const directory of (env.PATH || "").split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const suffix = platform === "win32" ? extension.toLowerCase() : extension;
      candidates.push({ path: path.join(directory, `${name}${suffix}`), source: "path" });
    }
  }
  return candidates;
}

function connectorPathCandidates({ platform, env }) {
  if (platform !== "win32") return pathCandidates("yaps_mcp", { platform, env });
  return (env.PATH || "")
    .split(win32.delimiter)
    .filter(Boolean)
    .map((directory) => ({ path: win32.join(directory, "yaps_mcp.exe"), source: "path" }));
}

function installedCandidates(binaryName, { platform, env, home }) {
  const path = pathApi(platform);
  if (platform === "darwin") {
    return [
      { path: `/Applications/Yaps.app/Contents/MacOS/${binaryName}`, source: "installed_app" },
      ...(home ? [{ path: path.join(home, "Applications", "Yaps.app", "Contents", "MacOS", binaryName), source: "installed_app_user" }] : []),
    ];
  }
  if (platform === "win32") {
    const executable = `${binaryName}.exe`;
    // Official NSIS per-machine layout. Plugin hosts (Codex/ChatGPT already
    // running at install time) often omit ProgramW6432/ProgramFiles, so also
    // keep the well-known Program Files locations. Never Local AppData.
    return uniqueCandidates(
      [
        env.ProgramW6432,
        env.ProgramFiles,
        env["ProgramFiles(x86)"],
        "C:\\Program Files",
        "C:\\Program Files (x86)",
      ]
        .filter(Boolean)
        .map((root) => ({ path: path.join(root, "Yaps", executable), source: "installed_app" })),
    );
  }
  if (platform === "linux") {
    // Tauri's verified deb/rpm layout places external binaries in
    // usr/bin. /usr/bin is the only non-PATH Linux fallback we can assert
    // without scanning arbitrary mounts or home directories.
    return [{ path: `/usr/bin/${binaryName}`, source: "installed_app" }];
  }
  return [];
}

export function parseRunningYapsExecutables(output) {
  if (typeof output !== "string") return [];
  const seen = new Set();
  const result = [];
  for (const line of output.split(/\r?\n/)) {
    const value = line.trim();
    if (!value || !win32.isAbsolute(value)) continue;
    const name = win32.basename(value).toLowerCase();
    if (!RUNNING_YAPS_PROCESS_NAMES.has(name)) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function cliSidecarFromRunningExecutable(executablePath, { platform = "win32" } = {}) {
  if (platform !== "win32" || typeof executablePath !== "string") return null;
  const path = win32;
  const name = path.basename(executablePath).toLowerCase();
  if (!RUNNING_YAPS_PROCESS_NAMES.has(name) || !path.isAbsolute(executablePath)) return null;
  return path.join(path.dirname(executablePath), "yaps_cli.exe");
}

export function runningAppCliCandidates({
  platform = process.platform,
  runningExecutables = [],
} = {}) {
  if (platform !== "win32") return [];
  return uniqueCandidates(
    (runningExecutables || [])
      .map((executable) => cliSidecarFromRunningExecutable(executable, { platform }))
      .filter(Boolean)
      .map((path) => ({ path, source: "running_app" })),
  );
}

async function defaultListRunningYapsExecutables({
  platform = process.platform,
  env = defaultYapsEnvironment(),
} = {}) {
  // Only enumerate processes on a real Windows host. Tests that pass
  // `platform: "win32"` on Linux/macOS stay inert unless they inject
  // `runningExecutables` or `listRunning`.
  if (platform !== "win32" || process.platform !== "win32") return [];
  const systemRoot = env.SystemRoot || env.WINDIR;
  if (!systemRoot) return [];
  const powershell = win32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  if (!defaultCanAccess(powershell, "win32")) return [];
  const output = await runTextCommand(powershell, [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    WINDOWS_RUNNING_YAPS_PROCESS_COMMAND,
  ], { env, timeoutMs: DEFAULT_AUTH_TIMEOUT_MS });
  return parseRunningYapsExecutables(output);
}

export function cliCandidates({
  override,
  platform = process.platform,
  env = defaultYapsEnvironment(),
  home = env.HOME || env.USERPROFILE || homedir(),
  runningExecutables = [],
} = {}) {
  const path = pathApi(platform);
  const executable = platform === "win32" ? "yaps_cli.exe" : "yaps_cli";
  const explicit = [
    override?.trim(),
    env.YAPS_CLI_BINARY?.trim(),
    env.YAPS_INSTALL_DIR?.trim() ? path.join(env.YAPS_INSTALL_DIR.trim(), executable) : "",
  ].find(Boolean);
  // A PATH shim can survive an upgrade and still point to a credential-free
  // helper from a different installation. Start with the running desktop's
  // sidecar. A running CLI or MCP helper alone is not a desktop install signal.
  const runningDesktop = (runningExecutables || []).filter((executablePath) =>
    typeof executablePath === "string" && win32.basename(executablePath).toLowerCase() === "yaps.exe");
  return uniqueCandidates([
    ...(explicit ? [{ path: explicit, source: "override" }] : []),
    ...runningAppCliCandidates({ platform, runningExecutables: runningDesktop }),
    ...pathCandidates("yaps", { platform, env }),
    ...pathCandidates("yaps_cli", { platform, env }),
    ...runningAppCliCandidates({ platform, runningExecutables }),
    ...installedCandidates("yaps_cli", { platform, env, home }),
  ]);
}

export function isYapsCliCommand(command, { platform = process.platform } = {}) {
  if (typeof command !== "string") return false;
  const name = pathApi(platform).basename(command).toLowerCase();
  return ["yaps", "yaps_cli", "yaps.exe", "yaps_cli.exe", "yaps.cmd", "yaps_cli.cmd"].includes(name);
}

export function connectorCandidates({
  platform = process.platform,
  env = defaultYapsEnvironment(),
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
    ...connectorPathCandidates({ platform, env }),
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

function terminateChild(child) {
  try { child.stdout?.destroy(); } catch {}
  try { child.stderr?.destroy(); } catch {}
  try { child.kill("SIGTERM"); } catch {}
  const force = setTimeout(() => {
    if (child.exitCode == null && child.signalCode == null) {
      try { child.kill("SIGKILL"); } catch {}
    }
  }, 100);
  force.unref?.();
  child.once?.("close", () => clearTimeout(force));
}

function runJsonCommand(candidate, args, {
  timeoutMs,
  spawnImpl = spawn,
  env = defaultYapsEnvironment(),
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
        terminateChild(child);
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
      terminateChild(child);
      finish({ ok: false, reason: "timeout" });
    }, Math.max(1, timeoutMs || DEFAULT_PROBE_TIMEOUT_MS));
  });
}

function runTextCommand(candidate, args, {
  timeoutMs = DEFAULT_AUTH_TIMEOUT_MS,
  spawnImpl = spawn,
  env = defaultYapsEnvironment(),
} = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let output = Buffer.alloc(0);
    let timer;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(value);
    };
    let child;
    try {
      child = spawnImpl(candidate, args, {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch {
      resolve(null);
      return;
    }
    child.stdout?.on("data", (chunk) => {
      if (settled) return;
      const next = Buffer.concat([output, Buffer.from(chunk)]);
      if (next.length > MAX_VERSION_BYTES) {
        terminateChild(child);
        finish(null);
        return;
      }
      output = next;
    });
    child.stderr?.on("data", () => {});
    child.on("error", () => finish(null));
    child.on("close", (code, signal) => finish(!signal && code === 0 ? output.toString("utf8").trim() : null));
    timer = setTimeout(() => {
      terminateChild(child);
      finish(null);
    }, Math.max(1, timeoutMs));
  });
}

function normalizedVersion(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:\D|$)/);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part))) return null;
  return { value: parts.join("."), parts };
}

export function authStatusSafetyForVersion(value) {
  const installed = normalizedVersion(value);
  const minimum = normalizedVersion(MIN_SAFE_AUTH_STATUS_VERSION);
  if (!installed || !minimum) return "unknown";
  for (let index = 0; index < minimum.parts.length; index += 1) {
    if (installed.parts[index] > minimum.parts[index]) return "safe";
    if (installed.parts[index] < minimum.parts[index]) return "unsafe";
  }
  return "safe";
}

function macApplicationForCli(cliPath, canonicalize) {
  let resolved;
  try {
    resolved = canonicalize(cliPath);
  } catch {
    resolved = cliPath;
  }
  const suffix = "/Contents/MacOS/yaps_cli";
  if (!resolved.endsWith(suffix)) return null;
  const application = resolved.slice(0, -suffix.length);
  return posix.basename(application) === "Yaps.app" ? application : null;
}

function knownInstallationVariant(cli, {
  platform = process.platform,
  env = defaultYapsEnvironment(),
  home = env.HOME || env.USERPROFILE || homedir(),
  canonicalize = realpathSync,
} = {}) {
  if (platform !== "darwin" || !cli?.path) return null;
  const application = macApplicationForCli(cli.path, canonicalize);
  if (!application) return null;
  const setappApplications = new Set([
    "/Applications/Setapp/Yaps.app",
    ...(home ? [posix.join(home, "Applications", "Setapp", "Yaps.app")] : []),
  ]);
  return setappApplications.has(application) ? "setapp" : null;
}

function peResourceEntry(resources, directory, id) {
  const count = resources.readUInt16LE(directory + 12) + resources.readUInt16LE(directory + 14);
  const start = directory + 16;
  if (start + count * 8 > resources.length) return null;
  for (let entry = start; entry < start + count * 8; entry += 8) {
    if (id === undefined || resources.readUInt32LE(entry) === id) {
      return resources.readUInt32LE(entry + 4);
    }
  }
  return null;
}

// Read the numeric PRODUCTVERSION in the PE RT_VERSION resource. The shipped
// helper stamps this alongside the display string. No PowerShell startup or
// execution of the binary is needed to decide whether auth status is safe.
function readWindowsProductVersion(executable) {
  let fd;
  try {
    fd = openSync(executable, "r");
    const readAt = (length, position) => {
      const bytes = Buffer.alloc(length);
      if (readSync(fd, bytes, 0, length, position) !== length) throw new Error("Truncated PE data");
      return bytes;
    };
    const dos = readAt(64, 0);
    if (dos.readUInt16LE(0) !== 0x5a4d) return null;
    const peOffset = dos.readUInt32LE(0x3c);
    const coff = readAt(24, peOffset);
    if (coff.readUInt32LE(0) !== 0x00004550) return null;
    const sectionCount = coff.readUInt16LE(6);
    const optionalSize = coff.readUInt16LE(20);
    if (sectionCount === 0 || sectionCount > 96) return null;
    const headers = readAt(optionalSize + sectionCount * 40, peOffset + 24);
    const magic = headers.readUInt16LE(0);
    const directories = magic === 0x20b ? 112 : magic === 0x10b ? 96 : 0;
    if (!directories || optionalSize < directories + 24 || headers.readUInt32LE(directories - 4) < 3) return null;
    const resourceRva = headers.readUInt32LE(directories + 16);
    const resourceSize = headers.readUInt32LE(directories + 20);
    if (!resourceRva || !resourceSize || resourceSize > MAX_PE_RESOURCE_BYTES) return null;

    let resources;
    for (let section = optionalSize; section < headers.length; section += 40) {
      const offset = resourceRva - headers.readUInt32LE(section + 12);
      if (offset >= 0 && offset + resourceSize <= headers.readUInt32LE(section + 16)) {
        resources = readAt(resourceSize, headers.readUInt32LE(section + 20) + offset);
        break;
      }
    }
    if (!resources) return null;
    const directoryFlag = 0x80000000;
    const type = peResourceEntry(resources, 0, 16);
    if (type === null || type < directoryFlag) return null;
    const name = peResourceEntry(resources, type - directoryFlag);
    if (name === null || name < directoryFlag) return null;
    const data = peResourceEntry(resources, name - directoryFlag);
    if (data === null || data >= directoryFlag || data + 16 > resources.length) return null;
    const offset = resources.readUInt32LE(data) - resourceRva;
    const size = resources.readUInt32LE(data + 4);
    if (offset < 0 || size < 92 || offset + size > resources.length) return null;

    const version = resources.subarray(offset, offset + size);
    const fixedOffset = 40;
    if (version.readUInt16LE(0) < fixedOffset + 52 || version.readUInt16LE(0) > size
      || version.readUInt16LE(2) !== 52 || version.toString("utf16le", 6, 38) !== "VS_VERSION_INFO\0"
      || version.readUInt32LE(fixedOffset) !== 0xfeef04bd) return null;
    const majorMinor = version.readUInt32LE(fixedOffset + 16);
    const buildRevision = version.readUInt32LE(fixedOffset + 20);
    if (!majorMinor && !buildRevision) return null;
    return `${majorMinor >>> 16}.${majorMinor & 0xffff}.${buildRevision >>> 16}`;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/**
 * Read only version metadata from verified package locations. This never runs
 * the app or CLI, never scans the filesystem, and never interpolates a path
 * into a shell command.
 */
export async function readInstalledYapsVersion(cli, {
  platform = process.platform,
  env = defaultYapsEnvironment(),
  canAccess = (candidate) => defaultCanAccess(candidate, platform),
  pathExists = defaultPathExists,
  canonicalize = realpathSync,
  statFile = statSync,
  readFile = readFileSync,
  readText = (command, args, commandEnv = env) => runTextCommand(command, args, { env: commandEnv }),
} = {}) {
  if (!cli?.path) return null;
  if (platform === "darwin") {
    const application = macApplicationForCli(cli.path, canonicalize);
    if (!application) return null;
    const plist = posix.join(application, "Contents", "Info.plist");
    try {
      const metadata = statFile(plist);
      if (!metadata.isFile() || metadata.size > MAX_PLIST_BYTES) return null;
    } catch {
      return null;
    }
    try {
      const contents = readFile(plist, "utf8");
      const identifier = contents.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/)?.[1]?.trim();
      const version = contents.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
      const parsed = normalizedVersion(version);
      if (identifier === "com.yaps.app" && parsed) return parsed.value;
      if (identifier && identifier !== "com.yaps.app") return null;
    } catch {
      // Binary plists are handled by the fixed, bounded system utility below.
    }
    if (!pathExists("/usr/bin/plutil")) return null;
    const identifier = await readText("/usr/bin/plutil", [
      "-extract", "CFBundleIdentifier", "raw", "-o", "-", plist,
    ]);
    if (identifier?.trim() !== "com.yaps.app") return null;
    return normalizedVersion(await readText("/usr/bin/plutil", [
      "-extract", "CFBundleShortVersionString", "raw", "-o", "-", plist,
    ]))?.value || null;
  }
  if (platform === "win32") {
    const path = win32;
    if (path.basename(cli.path).toLowerCase() !== "yaps_cli.exe" || !canAccess(cli.path)) return null;
    const productVersion = readWindowsProductVersion(cli.path);
    if (productVersion) return productVersion;
    const systemRoot = env.SystemRoot || env.WINDIR;
    if (!systemRoot) return null;
    const powershell = path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    if (!canAccess(powershell)) return null;
    const result = await readText(powershell, [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "(Get-Item -LiteralPath $env:YAPS_PLUGIN_VERSION_TARGET).VersionInfo.ProductVersion",
    ], { ...env, YAPS_PLUGIN_VERSION_TARGET: cli.path });
    return normalizedVersion(result)?.value || null;
  }
  if (platform === "linux") {
    let resolved;
    try {
      resolved = canonicalize(cli.path);
    } catch {
      resolved = cli.path;
    }
    if (resolved !== "/usr/bin/yaps_cli") return null;
    if (canAccess("/usr/bin/dpkg-query")) {
      const owner = await readText("/usr/bin/dpkg-query", ["-S", "/usr/bin/yaps_cli"]);
      const packageMatch = owner?.match(/^(yaps(?::[a-z0-9-]+)?):\s+\/usr\/bin\/yaps_cli$/);
      if (packageMatch) {
        const debian = normalizedVersion(await readText("/usr/bin/dpkg-query", ["-W", "-f=${Version}", packageMatch[1]]));
        if (debian) return debian.value;
      }
    }
    if (canAccess("/usr/bin/rpm")) {
      const owned = await readText("/usr/bin/rpm", ["-qf", "--queryformat", "%{NAME} %{VERSION}", "/usr/bin/yaps_cli"]);
      const match = owned?.match(/^yaps\s+(\S+)$/);
      return normalizedVersion(match?.[1])?.value || null;
    }
  }
  return null;
}

export function resolveWindowsShim(candidate, {
  platform = process.platform,
  canAccess = (path) => defaultCanAccess(path, platform),
  statFile = statSync,
  readFile = readFileSync,
} = {}) {
  if (platform !== "win32" || !/\.cmd$/i.test(candidate)) return candidate;
  try {
    const metadata = statFile(candidate);
    if (!metadata.isFile() || metadata.size > MAX_WINDOWS_SHIM_BYTES) return null;
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

async function candidateAuthStatusSafety(cliPath, readAppVersion) {
  try {
    const version = normalizedVersion(await readAppVersion({ path: cliPath }))?.value;
    return authStatusSafetyForVersion(version);
  } catch {
    return "unknown";
  }
}

function rejectedHasStaleCli(rejected) {
  return Array.isArray(rejected) && rejected.some((entry) => entry?.reason === "stale_cli");
}

function accountStatusUnsafeDiagnosis(appVersion) {
  return {
    code: "account_status_unsafe",
    message: `Yaps ${appVersion || "before 2.3.124"} uses an older credential-based account check, so this plugin deliberately did not run it. Update Yaps to 2.3.124 or newer; the plugin will then reuse the desktop sign-in, trial, or Yaps Pro automatically. Do not approve a Keychain prompt or create a separate plugin account.`,
  };
}

/**
 * Runner contract when resolve found no bindable current CLI.
 * Leftover-only skip-stale (PF 2.1.4, nothing current) is a distinct stale
 * account signal — never local_yaps_unreachable / cli_missing / cli_invalid.
 */
export function classifyCliResolutionFailure(session) {
  if (session?.path) return null;
  if (rejectedHasStaleCli(session?.rejected)) {
    return { ...accountStatusUnsafeDiagnosis(session?.appVersion), exitCode: 78 };
  }
  return {
    code: "local_yaps_unreachable",
    message: diagnoseConnection({ cli: session }).message,
    exitCode: 127,
  };
}

export async function resolveYapsCli(options = {}) {
  const platform = options.platform || process.platform;
  const canAccess = options.canAccess || ((path) => defaultCanAccess(path, platform));
  const canonicalize = options.canonicalize || realpathSync;
  const probe = options.probe || ((path, probeOptions) => probeYapsCli(path, { ...options, ...probeOptions }));
  const readAppVersion = options.readAppVersion || ((cli) => readInstalledYapsVersion(cli, options));
  const now = options.now || Date.now;
  const deadline = now() + (options.totalTimeoutMs || 15_000);
  const rejected = [];
  let provisional = null;
  const runningExecutables = options.runningExecutables
    ?? (options.listRunning ? await options.listRunning() : await defaultListRunningYapsExecutables(options));
  const candidates = cliCandidates({ ...options, runningExecutables });
  const authoritativeOverride = candidates[0]?.source === "override";
  let probes = 0;
  for (const candidate of candidates) {
    if (now() >= deadline || probes >= 8) break;
    if (!canAccess(candidate.path)) {
      if (authoritativeOverride) {
        rejected.push({ source: candidate.source, reason: "not_accessible" });
        break;
      }
      continue;
    }
    if (platform === "darwin") {
      let canonical = candidate.path;
      try {
        canonical = canonicalize(candidate.path);
      } catch {
        // The raw path is still enough to reject a direct GUI-binary path.
      }
      if (canonical.endsWith("/Yaps.app/Contents/MacOS/yaps")) {
        rejected.push({ source: candidate.source, reason: "gui_binary" });
        if (authoritativeOverride) break;
        continue;
      }
    }
    const resolvedPath = resolveWindowsShim(candidate.path, {
      platform,
      canAccess,
      statFile: options.statFile,
      readFile: options.readFile,
    });
    if (!resolvedPath) {
      rejected.push({ source: candidate.source, reason: "invalid_shim" });
      if (authoritativeOverride) break;
      continue;
    }
    probes += 1;
    const validation = await probe(resolvedPath, { timeoutMs: Math.min(DEFAULT_PROBE_TIMEOUT_MS, Math.max(1, deadline - now())) });
    if (!validation?.ok) {
      rejected.push({ source: candidate.source, reason: validation?.reason || "invalid_status" });
      if (authoritativeOverride) break;
      continue;
    }
    const resolved = { ...candidate, path: resolvedPath, rejected };
    // An explicit override stays authoritative even if it is older than
    // 2.3.124 or its version is unreadable. Return it after a successful
    // status probe.
    if (authoritativeOverride) return resolved;
    const safety = await candidateAuthStatusSafety(resolvedPath, readAppVersion);
    // The finder already probed `status --pretty`. A leftover helper is
    // therefore executed for that probe. Then reject a proven-old helper
    // (older than MIN_SAFE_AUTH_STATUS_VERSION 2.3.124, the credential-free
    // account-check floor — not a claim the helper is current or supports
    // every tool) before account checks or the requested operation.
    if (safety === "unsafe") {
      rejected.push({ source: candidate.source, reason: "stale_cli" });
      continue;
    }
    // Unknown versions (including a Windows PATH yaps.exe, because version
    // metadata is only read for a filename of yaps_cli.exe) stay provisional.
    // Do not bind yet and do not treat unknown as stale_cli. Keep searching
    // for a verified >= 2.3.124 candidate; the first verified helper wins
    // even if it is later in the list (running_app sidecar after PATH).
    if (safety === "unknown") {
      if (!provisional) provisional = resolved;
      continue;
    }
    return resolved;
  }
  // If nothing verified, bind the first provisional unknown that passed
  // status. Do not turn a lone unknown PATH hit into a miss.
  if (provisional) return { ...provisional, rejected };
  return { path: null, source: null, rejected };
}

function explicitSettingsSelected(args, env) {
  return Boolean(env.YAPS_SETTINGS_PATH?.trim())
    || args.some((value) => value === "--settings-path" || value.startsWith("--settings-path="));
}

function settingsPathArgument(args) {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--settings-path") {
      const value = args[index + 1];
      return typeof value === "string" && value ? value : null;
    }
    if (typeof args[index] === "string" && args[index].startsWith("--settings-path=")) {
      return args[index].slice("--settings-path=".length) || null;
    }
  }
  return null;
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
  // Older helpers report a missing or inaccessible auth store as signed out.
  // Keep a readable sign-out receipt distinct from a host that cannot see it.
  const missingDesktopAccount = value.status === "unauthenticated"
    && value.diagnostic_code === "signed_out" && value.auth_store_exists === false;
  const diagnosticCode = missingDesktopAccount
    ? "desktop_account_unavailable"
    : typeof value.diagnostic_code === "string" ? value.diagnostic_code : null;
  const followedSettingsPath = diagnosticCode === "followed_desktop_account"
    ? normalizedRecommendedSettingsPath(value.settings_path, platform)
    : null;
  if (diagnosticCode === "followed_desktop_account" && !followedSettingsPath) return null;
  return {
    authenticated: value.authenticated,
    status: missingDesktopAccount ? "verification_unavailable" : value.status,
    diagnosticCode,
    recommendedSettingsPath: normalizedRecommendedSettingsPath(value.recommended_settings_path, platform),
    followedSettingsPath,
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
  return Boolean(auth) && auth.diagnosticCode !== "desktop_account_unavailable" && (
    REFRESHABLE_ACCOUNT_STATES.has(auth.status)
    || REFRESHABLE_ACCOUNT_DIAGNOSTICS.has(auth.diagnosticCode)
  );
}

function installedAppLaunch(cli, {
  platform,
  env,
  home,
  canAccess,
  pathExists,
  canonicalize,
}) {
  if (!cli?.path) return null;
  const path = pathApi(platform);
  if (platform === "darwin") {
    let cliPath = cli.path;
    try {
      cliPath = canonicalize(cli.path);
    } catch {
      // The already-validated raw path remains the only safe fallback.
    }
    const suffix = "/Contents/MacOS/yaps_cli";
    if (!cliPath.endsWith(suffix)) return null;
    const application = cliPath.slice(0, -suffix.length);
    const allowedApplications = new Set([
      "/Applications/Yaps.app",
      ...(home ? [posix.join(home, "Applications", "Yaps.app")] : []),
    ]);
    if (!allowedApplications.has(application) || !pathExists(application)) return null;
    return { command: "/usr/bin/open", args: ["-g", application], detached: false };
  }
  if (platform === "win32") {
    let cliPath = cli.path;
    try {
      cliPath = canonicalize(cli.path);
    } catch {
      // The already-validated raw path remains the only safe fallback.
    }
    if (path.basename(cliPath).toLowerCase() !== "yaps_cli.exe") return null;
    const allowedDirectories = new Set(
      [env.ProgramW6432, env.ProgramFiles]
        .filter(Boolean)
        .map((root) => path.normalize(path.join(root, "Yaps")).toLowerCase()),
    );
    const directory = path.normalize(path.dirname(cliPath));
    if (!allowedDirectories.has(directory.toLowerCase())) return null;
    const application = path.join(directory, "Yaps.exe");
    if (!canAccess(application)) return null;
    return { command: application, args: [], detached: true };
  }
  if (platform === "linux") {
    let cliPath = cli.path;
    try {
      cliPath = canonicalize(cli.path);
    } catch {
      // The already-validated raw path remains the only safe fallback.
    }
    if (cliPath !== "/usr/bin/yaps_cli") return null;
    const application = "/usr/bin/yaps";
    if (!canAccess(application)) return null;
    return { command: application, args: [], detached: true };
  }
  return null;
}

export function launchInstalledYaps(cli, {
  platform = process.platform,
  env = defaultYapsEnvironment(),
  home = env.HOME || env.USERPROFILE || homedir(),
  spawnImpl = spawn,
  canAccess = (candidate) => defaultCanAccess(candidate, platform),
  pathExists = defaultPathExists,
  canonicalize = realpathSync,
  timeoutMs = 3_000,
} = {}) {
  const launch = installedAppLaunch(cli, { platform, env, home, canAccess, pathExists, canonicalize });
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
        env,
        detached: launch.detached,
        stdio: "ignore",
        windowsHide: true,
      });
      child.on("error", () => finish(false));
      child.on("spawn", () => {
        if (launch.detached) {
          child.unref?.();
          finish(true);
        }
      });
      child.on("close", (code, signal) => {
        if (!launch.detached) finish(!signal && code === 0);
      });
      timer = setTimeout(() => {
        terminateChild(child);
        finish(false);
      }, Math.max(1, timeoutMs));
    } catch {
      finish(false);
    }
  });
}

export function applyResolvedSettings(args, settingsPath, { env = defaultYapsEnvironment(), followDesktopAccount = false } = {}) {
  if (!settingsPath) return [...args];
  if (followDesktopAccount) {
    const withoutOldPath = [];
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === "--settings-path") {
        index += 1;
      } else if (!args[index].startsWith("--settings-path=")) {
        withoutOldPath.push(args[index]);
      }
    }
    return ["--settings-path", settingsPath, ...withoutOldPath];
  }
  if (explicitSettingsSelected(args, env)) return [...args];
  return ["--settings-path", settingsPath, ...args];
}

function normalizedCliCommand(args) {
  const command = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (["--settings-path", "--vault-root", "--mcp-binary"].includes(value)) {
      index += 1;
      continue;
    }
    if (["--pretty"].includes(value) || value.startsWith("--settings-path=")
      || value.startsWith("--vault-root=") || value.startsWith("--mcp-binary=")) continue;
    command.push(value);
  }
  return command;
}

export function isAuthStatusCommand(args) {
  const [group, action, ...flags] = normalizedCliCommand(args);
  return group === "auth" && action === "status"
    && (flags.length === 0 || (flags.length === 1 && flags[0] === "--redact"));
}

export function commandRequiresActiveAccount(args) {
  const command = normalizedCliCommand(args);
  if (command.includes("--help") || command.includes("-h")) return false;
  if (!command.length || ["status", "settings", "auth"].includes(command[0])) return false;
  if (command[0] === "features" && command[1] === "list") return false;
  // Reading, waiting on or cancelling already-queued background jobs must keep
  // working if access lapses mid-job; only `jobs retry` queues new work.
  if (command[0] === "jobs" && command[1] !== "retry") return false;
  return true;
}

export async function resolveYapsSession(options = {}) {
  const platform = options.platform || process.platform;
  const env = options.env || defaultYapsEnvironment();
  const commandArguments = options.commandArguments || [];
  const cli = options.cli || await resolveYapsCli(options);
  if (!cli.path) {
    const staleRejected = rejectedHasStaleCli(cli.rejected);
    return {
      ...cli,
      settingsPath: null,
      auth: null,
      appVersion: null,
      installationVariant: null,
      authStatusSafety: staleRejected ? "unsafe" : "unknown",
      appLaunchAttempted: false,
      appLaunchSucceeded: false,
    };
  }

  const installationVariant = options.installationVariant || knownInstallationVariant(cli, options);
  if (installationVariant === "setapp") {
    return {
      ...cli,
      settingsPath: null,
      auth: null,
      appVersion: null,
      installationVariant,
      authStatusSafety: "unknown",
      appLaunchAttempted: false,
      appLaunchSucceeded: false,
    };
  }

  const readAppVersion = options.readAppVersion || ((target) => readInstalledYapsVersion(target, options));
  const appVersion = normalizedVersion(options.appVersion)?.value || await readAppVersion(cli);
  const authStatusSafety = authStatusSafetyForVersion(appVersion);
  if (authStatusSafety !== "safe") {
    return {
      ...cli,
      settingsPath: null,
      auth: null,
      appVersion,
      installationVariant,
      authStatusSafety,
      appLaunchAttempted: false,
      appLaunchSucceeded: false,
    };
  }

  const readAuth = options.readAuth || ((settingsPath, timeoutMs) => readYapsAuthStatus(cli.path, {
    ...options,
    platform,
    env,
    settingsPath,
    timeoutMs,
  }));
  const explicitSettings = explicitSettingsSelected(commandArguments, env);
  const explicitSettingsPath = settingsPathArgument(commandArguments);
  let settingsPath = null;
  const authResult = await readAuth(explicitSettingsPath, DEFAULT_AUTH_TIMEOUT_MS);
  let auth = authResult.ok ? authResult.auth : null;
  if (auth?.followedSettingsPath) settingsPath = auth.followedSettingsPath;

  if (!explicitSettings && auth?.recommendedSettingsPath && auth.status === "settings_path_mismatch") {
    const retry = await readAuth(auth.recommendedSettingsPath, DEFAULT_AUTH_TIMEOUT_MS);
    if (retry.ok) {
      settingsPath = auth.recommendedSettingsPath;
      auth = retry.auth;
      if (auth.followedSettingsPath) settingsPath = auth.followedSettingsPath;
    }
  }

  let appLaunchAttempted = false;
  let appLaunchSucceeded = false;
  if (options.recoverAccount === true && refreshableAccount(auth)) {
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
        const retry = await readAuth(
          explicitSettingsPath || settingsPath,
          Math.min(DEFAULT_AUTH_TIMEOUT_MS, remaining),
        );
        if (!retry.ok) continue;
        auth = retry.auth;
        if (auth.followedSettingsPath) settingsPath = auth.followedSettingsPath;
        if (!refreshableAccount(auth)) break;
      }
    }
  }

  return {
    ...cli,
    settingsPath,
    auth,
    appVersion,
    installationVariant,
    authStatusSafety,
    appLaunchAttempted,
    appLaunchSucceeded,
  };
}

export function resolveYapsConnector(options = {}) {
  const platform = options.platform || process.platform;
  const canAccess = options.canAccess || ((path) => defaultCanAccess(path, platform));
  const candidates = connectorCandidates(options).filter((candidate) =>
    platform !== "win32" || win32.basename(candidate.path).toLowerCase() === "yaps_mcp.exe");
  if (candidates[0]?.source === "override") {
    return canAccess(candidates[0].path) ? candidates[0] : { path: null, source: null };
  }
  return candidates.find((candidate) => canAccess(candidate.path)) || { path: null, source: null };
}

export function diagnoseConnection({ cli, connector, needsConnector = false }) {
  if (!cli?.path) {
    if (rejectedHasStaleCli(cli?.rejected)) {
      return accountStatusUnsafeDiagnosis(cli.appVersion);
    }
    if (cli?.rejected?.length) {
      return {
        code: "cli_invalid",
        message: "A Yaps CLI candidate was found, but it did not pass the safe status check. If you set YAPS_CLI_BINARY, correct or remove that override. Otherwise update or reinstall Yaps, open it once, then start a new agent task on this computer. Do not install a separate CLI or edit PATH.",
      };
    }
    return {
      code: "cli_missing",
      message: "The Yaps CLI could not be found from this local session. Install or update Yaps using the official download link in the plugin README, open it once, then start a new agent task on this computer. The CLI is included with Yaps; no separate CLI or PATH setup is needed.",
    };
  }
  if (needsConnector && !connector?.path) {
    return {
      code: "vault_connector_unavailable",
      message: "The Yaps CLI is installed and working, but the private-vault connector is unavailable. Update or reinstall Yaps using the official download link in the plugin README, open it once, then start a new agent task on this computer. Do not reinstall the plugin, install a separate CLI, or edit PATH.",
    };
  }
  return { code: "ready", message: "Yaps is ready." };
}

export function diagnoseAccount(session) {
  if (session?.installationVariant === "setapp") {
    return {
      code: "setapp_unsupported",
      message: "The Setapp edition of Yaps was found, but current plugins cannot safely reuse its separate activation state yet. Use the standard Yaps download for plugin automation, or wait for a future Yaps app update. Do not reconnect the plugin, edit PATH, or approve a Keychain prompt.",
    };
  }
  const auth = session?.auth;
  if (!auth) {
    if (session?.authStatusSafety === "unsafe" || (!session?.path && rejectedHasStaleCli(session?.rejected))) {
      return accountStatusUnsafeDiagnosis(session?.appVersion);
    }
    if (session?.authStatusSafety === "unknown") {
      return {
        code: "account_status_unverified",
        message: "The Yaps CLI is working, but this plugin could not verify that its account check is credential-free, so it deliberately did not run it. Update or reinstall the official Yaps app; the plugin will then reuse its desktop account automatically. Do not reconnect the plugin or approve a Keychain prompt.",
      };
    }
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
  if (auth.status === "credential_unavailable" || auth.diagnosticCode === "keychain_unavailable") {
    return {
      code: "account_status_unsupported",
      message: "This installed Yaps helper uses an older credential-based account check. Update Yaps and retry. Do not approve a Keychain prompt or create a separate plugin account.",
    };
  }
  if (auth.diagnosticCode === "desktop_account_unavailable") {
    return {
      code: "desktop_account_unavailable",
      message: "This session could not read the Yaps desktop account. Open Yaps and use a local session under the same operating system account.",
    };
  }
  if (refreshableAccount(auth)) {
    const attempted = session.appLaunchSucceeded
      ? "The plugin opened the installed Yaps app automatically, but the account cache did not refresh in time. "
      : session.appLaunchAttempted
        ? "The plugin could not safely open the installed Yaps app in the background. "
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
  if (["signed_out", "unauthenticated"].includes(auth.status)) {
    return {
      code: "unauthenticated",
      message: "Yaps is installed, but no active desktop account is signed in. Sign in inside Yaps and start an available trial or activate Yaps Pro; the plugin then uses that same session automatically, with no separate connection.",
    };
  }
  return {
    code: "account_status_unavailable",
    message: "Yaps returned an account state this plugin does not recognize. Update Yaps and retry; do not reconnect the plugin or create another account.",
  };
}

async function main(argv) {
  if (!["--resolve-cli", "--resolve-session"].includes(argv[0])) return 2;
  const overrideIndex = argv.indexOf("--override");
  const override = overrideIndex >= 0 ? argv[overrideIndex + 1] : undefined;
  const result = argv[0] === "--resolve-session"
    ? await resolveYapsSession({ override, recoverAccount: true })
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
      app_launch_succeeded: result.appLaunchSucceeded,
      app_version: result.appVersion,
      auth_status_safety: result.authStatusSafety,
      account_code: account.code,
      account_message: account.message,
    } : {}),
  })}\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main(process.argv.slice(2));
}
