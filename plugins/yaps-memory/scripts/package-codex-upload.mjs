#!/usr/bin/env node

import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requestedOutput = process.argv[2];
if (!requestedOutput) {
  process.stderr.write("Usage: package-codex-upload.mjs <output.zip>\n");
  process.exit(2);
}

const output = resolve(requestedOutput);
const temporary = mkdtempSync(join(tmpdir(), "yaps-memory-upload-"));
const stagedRoot = join(temporary, "yaps-memory");
const excludeMetadata = (source) => basename(source) !== ".DS_Store";

try {
  mkdirSync(stagedRoot, { recursive: true });
  cpSync(join(pluginRoot, ".codex-plugin"), join(stagedRoot, ".codex-plugin"), { recursive: true });
  cpSync(join(pluginRoot, "skills"), join(stagedRoot, "skills"), { recursive: true, filter: excludeMetadata });
  cpSync(join(pluginRoot, "assets"), join(stagedRoot, "assets"), { recursive: true, filter: excludeMetadata });
  cpSync(join(pluginRoot, "README.md"), join(stagedRoot, "README.md"));

  const manifestPath = join(stagedRoot, ".codex-plugin", "plugin.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  delete manifest.mcpServers;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const skillScripts = join(stagedRoot, "skills", "yaps-memory", "scripts");
  mkdirSync(skillScripts, { recursive: true });
  cpSync(
    join(pluginRoot, "scripts", "yaps-plugin-runner.mjs"),
    join(skillScripts, "yaps-plugin-runner.mjs"),
  );
  cpSync(
    join(pluginRoot, "scripts", "yaps-plugin-launcher.sh"),
    join(skillScripts, "yaps-plugin-launcher.sh"),
  );
  cpSync(
    join(pluginRoot, "scripts", "yaps-plugin-launcher.cmd"),
    join(skillScripts, "yaps-plugin-launcher.cmd"),
  );
  cpSync(
    join(pluginRoot, "scripts", "yaps-cli-discovery.mjs"),
    join(skillScripts, "yaps-cli-discovery.mjs"),
  );

  mkdirSync(dirname(output), { recursive: true });
  if (existsSync(output)) rmSync(output);
  const zipped = spawnSync("zip", ["-q", "-r", output, "yaps-memory"], {
    cwd: temporary,
    encoding: "utf8",
  });
  if (zipped.status !== 0) throw new Error(zipped.stderr || "zip failed");
  process.stdout.write(`${output}\n`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
