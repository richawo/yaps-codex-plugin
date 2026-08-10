import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  assert.match(launcher, /resolveYapsSession/);
  assert.match(launcher, /YAPS_SETTINGS_PATH/);
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
    assert.equal(manifest.version, "0.2.9");
    assert.equal("mcpServers" in manifest, false);

    const extracted = path.join(temporary, "extracted");
    const unpacked = spawnSync("unzip", ["-q", archive, "-d", extracted], { encoding: "utf8" });
    assert.equal(unpacked.status, 0, unpacked.stderr);
    const fakeCli = path.join(temporary, "yaps cli; no shell");
    const invocation = path.join(temporary, "invocation.json");
    const settingsPath = path.join(temporary, "canonical settings", "settings.json");
    await writeFile(fakeCli, `#!${process.execPath}
const { writeFileSync } = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "status") {
  process.stdout.write(JSON.stringify({settings_path:"/default/settings.json",settings_exists:true,auth_store_path:"/default/auth.json",models_dir:"/default/models"}));
} else if (args.includes("auth") && args.includes("status")) {
  process.stdout.write(JSON.stringify(args.includes("--settings-path")
    ? {authenticated:true,status:"active"}
    : {authenticated:false,status:"settings_path_mismatch",recommended_settings_path:process.env.YAPS_TEST_SETTINGS}));
} else {
  writeFileSync(process.env.YAPS_TEST_INVOCATION, JSON.stringify(args));
  process.stdout.write(JSON.stringify({ok:true}));
}
`, "utf8");
    await chmod(fakeCli, 0o755);
    const archivedRunner = path.join(
      extracted,
      "yaps-memory",
      "skills",
      "yaps-memory",
      "scripts",
      "yaps-plugin-runner.mjs",
    );
    const journey = spawnSync(
      process.execPath,
      [archivedRunner, "--action", "vault.status", "--stage", "execution", "--", "yaps", "vault", "status", "--pretty"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: "",
          YAPS_CLI_BINARY: fakeCli,
          YAPS_SETTINGS_PATH: "",
          YAPS_TEST_SETTINGS: settingsPath,
          YAPS_TEST_INVOCATION: invocation,
        },
      },
    );
    assert.equal(journey.status, 0, journey.stderr);
    assert.deepEqual(JSON.parse(await readFile(invocation, "utf8")), [
      "--settings-path",
      settingsPath,
      "vault",
      "status",
      "--pretty",
    ]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
