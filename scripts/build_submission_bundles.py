#!/usr/bin/env python3
"""Build deterministic plugin, skill, and memory-reviewer ZIPs."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".agents/plugins/marketplace.json"
REVIEWER_VAULT = ROOT / "reviewer/vault"
DIST = ROOT / "dist"


def add_tree(archive: ZipFile, source: Path, prefix: str) -> None:
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        name = (Path(prefix) / path.relative_to(source)).as_posix()
        info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, path.read_bytes())


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
        with ZipFile(plugin_zip, "w", ZIP_DEFLATED) as archive:
            add_tree(archive, plugin, "")
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
