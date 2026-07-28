import { constants, accessSync } from "node:fs";
import { posix, win32 } from "node:path";

export function candidatePaths({
  platform = process.platform,
  env = process.env,
  home = env.HOME ?? env.USERPROFILE ?? "",
} = {}) {
  const executableName = platform === "win32" ? "yaps_mcp.exe" : "yaps_mcp";
  const path = platform === "win32" ? win32 : posix;
  const candidates = [];

  if (env.YAPS_MCP_BINARY?.trim()) {
    candidates.push(env.YAPS_MCP_BINARY.trim());
  }

  if (platform === "darwin") {
    candidates.push(
      "/Applications/Yaps.app/Contents/MacOS/yaps_mcp",
      home ? path.join(home, "Applications", "Yaps.app", "Contents", "MacOS", "yaps_mcp") : "",
    );
  } else if (platform === "win32") {
    for (const base of [env.ProgramW6432, env.ProgramFiles, env["ProgramFiles(x86)"], env.LOCALAPPDATA]) {
      if (!base) continue;
      candidates.push(path.join(base, "Yaps", executableName));
      if (base === env.LOCALAPPDATA) {
        candidates.push(path.join(base, "Programs", "Yaps", executableName));
      }
    }
  }

  if (home) {
    candidates.push(path.join(home, ".local", "bin", executableName));
  }
  for (const directory of (env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    candidates.push(path.join(directory, executableName));
  }

  return [...new Set(candidates.filter(Boolean))];
}

export function resolveYapsMcpBinary(options = {}) {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const mode = platform === "win32" ? constants.F_OK : constants.X_OK;
  const canAccess = options.canAccess ?? ((path) => {
    try {
      accessSync(path, mode);
      return true;
    } catch {
      return false;
    }
  });

  const explicit = env.YAPS_MCP_BINARY?.trim();
  if (explicit) {
    return canAccess(explicit) ? explicit : undefined;
  }

  return candidatePaths({ ...options, env }).find(canAccess);
}
