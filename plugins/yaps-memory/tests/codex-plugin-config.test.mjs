import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
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
  assert.doesNotMatch(JSON.stringify(server), /CLAUDE_PLUGIN_ROOT/);
});

test("Claude and Codex keep host-specific MCP manifests", async () => {
  const claudeManifest = await readJson(".claude-plugin/plugin.json");
  assert.equal(claudeManifest.mcpServers, "./.claude.mcp.json");

  const claudeConfig = await readJson(".claude.mcp.json");
  assert.equal(
    claudeConfig.mcpServers.yaps.env.YAPS_MCP_CLIENT_ID,
    "claude-code",
  );
  assert.match(
    claudeConfig.mcpServers.yaps.args[0],
    /\$\{CLAUDE_PLUGIN_ROOT\}/,
  );
});
