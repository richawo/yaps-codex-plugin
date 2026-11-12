#!/usr/bin/env python3
"""Build deterministic plugin, skill, and memory-reviewer ZIPs."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Mapping
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".agents/plugins/marketplace.json"
REVIEWER_VAULT = ROOT / "reviewer/vault"
DIST = ROOT / "dist"
AGENT_PLUGINS_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
IDENTITY_FIELDS = (
    "name", "version", "description", "author", "homepage", "repository", "license", "keywords",
)


def add_bytes(archive: ZipFile, name: str, data: bytes) -> None:
    info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
    info.compress_type = ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data)


def add_tree(
    archive: ZipFile,
    source: Path,
    prefix: str,
    *,
    exclude: set[str] | None = None,
    replacements: Mapping[str, bytes] | None = None,
) -> None:
    excluded = exclude or set()
    replacement_bytes = replacements or {}
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        relative_name = path.relative_to(source).as_posix()
        if any(relative_name == item or relative_name.startswith(f"{item}/") for item in excluded):
            continue
        if path.name == ".DS_Store" or path.suffix == ".pyc":
            continue
        name = (Path(prefix) / relative_name).as_posix()
        add_bytes(archive, name, replacement_bytes.get(relative_name, path.read_bytes()))


def build_plugin_archive(plugin: Path, manifest: dict, output: Path) -> None:
    """Package the skills-only directory edition and its legacy manifest."""
    interface = dict(manifest["interface"])
    screenshots = interface.pop("screenshots", [])
    assert interface["supportURL"].startswith("https://"), manifest["name"]
    excluded = {"tests"}
    for screenshot in screenshots:
        assert isinstance(screenshot, str) and screenshot.startswith("./")
        relative = Path(screenshot[2:])
        assert not relative.is_absolute() and ".." not in relative.parts
        excluded.add(relative.as_posix())

    upload_manifest = {**manifest, "interface": interface}
    upload_manifest.pop("mcpServers", None)
    portable_manifest = {
        "$schema": AGENT_PLUGINS_SCHEMA,
        **{key: manifest[key] for key in IDENTITY_FIELDS},
        "extensions": {"com.openai": {"interface": interface}},
    }
    memory = manifest["name"] == "yaps-memory"
    if memory:
        excluded.update({".claude-plugin", ".claude.mcp.json", ".mcp.json", "mcp", "scripts"})

    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        add_bytes(archive, "plugin.json", encode_manifest(portable_manifest))
        add_tree(
            archive,
            plugin,
            "",
            exclude=excluded,
            replacements={".codex-plugin/plugin.json": encode_manifest(upload_manifest)},
        )
        if memory:
            add_tree(
                archive,
                plugin / "scripts",
                "skills/yaps-memory/scripts",
                exclude={"package-codex-upload.mjs"},
            )


def encode_manifest(manifest: dict) -> bytes:
    return (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode()


def main() -> int:
    marketplace = json.loads(MARKETPLACE.read_text(encoding="utf-8"))
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()

    for entry in marketplace["plugins"]:
        plugin_name = entry["name"]
        plugin = ROOT / "plugins" / plugin_name
        manifest = json.loads(
            (plugin / ".codex-plugin/plugin.json").read_text(encoding="utf-8")
        )
        version = manifest["version"].split("+", 1)[0]

        plugin_zip = DIST / f"{plugin_name}-plugin-{version}.zip"
        build_plugin_archive(plugin, manifest, plugin_zip)
        print(plugin_zip)

        skill_dirs = sorted(path for path in (plugin / "skills").iterdir() if path.is_dir())
        assert len(skill_dirs) == 1
        scripts = plugin / "scripts"
        assert (scripts / "yaps-plugin-runner.mjs").is_file()
        assert (scripts / "yaps-cli-discovery.mjs").is_file()
        skill_zip = DIST / f"{plugin_name}-skill-{version}.zip"
        with ZipFile(skill_zip, "w", ZIP_DEFLATED) as archive:
            add_tree(archive, skill_dirs[0], plugin_name)
            # Standalone skill uploads do not receive the plugin root. Embed
            # the generated runner, discovery contract, and any workflow
            # helper beside SKILL.md so installed skills can use the Yaps CLI
            # without knowing its path.
            add_tree(archive, plugin / "scripts", f"{plugin_name}/scripts")
        print(skill_zip)

    memory_version = json.loads(
        (
            ROOT / "plugins/yaps-memory/.codex-plugin/plugin.json"
        ).read_text(encoding="utf-8")
    )["version"].split("+", 1)[0]
    reviewer_zip = DIST / f"yaps-memory-reviewer-vault-{memory_version}.zip"
    with ZipFile(reviewer_zip, "w", ZIP_DEFLATED) as archive:
        add_tree(archive, REVIEWER_VAULT, "Yaps Memory Reviewer Vault")
    print(reviewer_zip)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
