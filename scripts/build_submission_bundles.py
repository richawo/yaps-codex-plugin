#!/usr/bin/env python3
"""Build deterministic portal and reviewer ZIPs from the public repository."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugins/yaps-memory"
SKILL = PLUGIN / "skills/yaps-memory"
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
    manifest = json.loads((PLUGIN / ".codex-plugin/plugin.json").read_text(encoding="utf-8"))
    version = manifest["version"].split("+", 1)[0]
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()

    plugin_zip = DIST / f"yaps-memory-plugin-{version}.zip"
    with ZipFile(plugin_zip, "w", ZIP_DEFLATED) as archive:
        add_tree(archive, PLUGIN, "yaps-memory")

    skill_zip = DIST / f"yaps-memory-skill-{version}.zip"
    with ZipFile(skill_zip, "w", ZIP_DEFLATED) as archive:
        add_tree(archive, SKILL, "yaps-memory")

    reviewer_zip = DIST / f"yaps-memory-reviewer-vault-{version}.zip"
    with ZipFile(reviewer_zip, "w", ZIP_DEFLATED) as archive:
        add_tree(archive, REVIEWER_VAULT, "Yaps Memory Reviewer Vault")

    print(plugin_zip)
    print(skill_zip)
    print(reviewer_zip)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
