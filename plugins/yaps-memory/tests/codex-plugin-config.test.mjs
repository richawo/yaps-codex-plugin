import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(pluginRoot, relativePath), "utf8"));
}

test("Codex manifest exposes the automatic Yaps MCP bridge", async () => {
  const manifest = await readJson(".codex-plugin/plugin.json");
  assert.equal(manifest.mcpServers, "./.mcp.json");

  const config = await readJson(".mcp.json");
  const server = config.mcpServers?.yaps;
  assert.ok(server, "missing mcpServers.yaps");
  assert.equal(server.command, "node");
  assert.deepEqual(server.args, ["./mcp/server/index.mjs"]);
  assert.equal(server.cwd, ".");
  assert.equal(server.env.YAPS_MCP_CLIENT_ID, "codex");
  assert.equal(server.env.YAPS_MCP_AUTO_AUTHORIZE_READ, "1");
  assert.equal(server.env.YAPS_PLUGIN_ID, "yaps-memory");
  assert.equal(server.env.YAPS_PLUGIN_VERSION, manifest.version);
  assert.equal(server.env.YAPS_PLUGIN_HOST, "codex_plugin");
  assert.equal(server.env.YAPS_PLUGIN_TRANSPORT, "mcp");
  assert.doesNotMatch(JSON.stringify(server), /CLAUDE_PLUGIN_ROOT/);

  const launcher = await readFile(
    path.join(pluginRoot, "mcp/server/index.mjs"),
    "utf8",
  );
  assert.doesNotMatch(launcher, /Yaps MCP could not/i);
  assert.match(launcher, /resolveYapsCli/);
  assert.match(launcher, /private-vault connector could not start/i);
});

test("Claude and Codex keep host-specific MCP manifests", async () => {
  const claudeManifest = await readJson(".claude-plugin/plugin.json");
  assert.equal(claudeManifest.mcpServers, "./.claude.mcp.json");

  const claudeConfig = await readJson(".claude.mcp.json");
  assert.equal(
    claudeConfig.mcpServers.yaps.env.YAPS_MCP_CLIENT_ID,
    "claude-code",
  );
  assert.equal(claudeConfig.mcpServers.yaps.env.YAPS_PLUGIN_ID, "yaps-memory");
  assert.equal(
    claudeConfig.mcpServers.yaps.env.YAPS_PLUGIN_VERSION,
    claudeManifest.version,
  );
  assert.equal(claudeConfig.mcpServers.yaps.env.YAPS_PLUGIN_HOST, "claude_code");
  assert.equal(claudeConfig.mcpServers.yaps.env.YAPS_PLUGIN_TRANSPORT, "mcp");
  assert.match(
    claudeConfig.mcpServers.yaps.args[0],
    /\$\{CLAUDE_PLUGIN_ROOT\}/,
  );
});

test("Codex upload archive is skills-only and retains the local CLI runner", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "yaps-memory-upload-test-"));
  const archive = path.join(temporary, "yaps-memory.zip");
  try {
    const packaged = spawnSync(
      process.execPath,
      [path.join(pluginRoot, "scripts", "package-codex-upload.mjs"), archive],
      { encoding: "utf8" },
    );
    assert.equal(packaged.status, 0, packaged.stderr);

    const listed = spawnSync("unzip", ["-Z1", archive], { encoding: "utf8" });
    assert.equal(listed.status, 0, listed.stderr);
    const entries = listed.stdout.trim().split("\n");
    assert.ok(entries.includes("yaps-memory/skills/yaps-memory/SKILL.md"));
    assert.ok(entries.includes("yaps-memory/skills/yaps-memory/scripts/yaps-plugin-runner.mjs"));
    assert.ok(entries.includes("yaps-memory/skills/yaps-memory/scripts/yaps-cli-discovery.mjs"));
    assert.equal(entries.some((entry) => entry.includes("mcp/server")), false);
    assert.equal(entries.some((entry) => entry.endsWith(".mcp.json")), false);
    assert.equal(entries.some((entry) => entry.endsWith(".DS_Store")), false);

    const manifestResult = spawnSync(
      "unzip",
      ["-p", archive, "yaps-memory/.codex-plugin/plugin.json"],
      { encoding: "utf8" },
    );
    assert.equal(manifestResult.status, 0, manifestResult.stderr);
    const manifest = JSON.parse(manifestResult.stdout);
    assert.equal(manifest.version, "0.2.8");
    assert.equal("mcpServers" in manifest, false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
