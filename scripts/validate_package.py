#!/usr/bin/env python3
"""Dependency-free structural and public-safety checks for this package."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".agents/plugins/marketplace.json"
PLUGIN = ROOT / "plugins/yaps-memory"
MANIFEST = PLUGIN / ".codex-plugin/plugin.json"
SKILL = PLUGIN / "skills/yaps-memory/SKILL.md"


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    assert isinstance(value, dict), f"{path} must contain a JSON object"
    return value


def https_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def main() -> int:
    marketplace = load_json(MARKETPLACE)
    manifest = load_json(MANIFEST)
    skill = SKILL.read_text(encoding="utf-8")

    assert marketplace["name"] == "yaps"
    assert len(marketplace["plugins"]) == 1
    entry = marketplace["plugins"][0]
    assert entry["name"] == "yaps-memory"
    assert entry["source"] == {"source": "local", "path": "./plugins/yaps-memory"}
    assert entry["policy"] == {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL",
    }
    assert entry["category"] == "Productivity"
    assert (ROOT / entry["source"]["path"]).resolve() == PLUGIN.resolve()

    assert manifest["name"] == PLUGIN.name == "yaps-memory"
    assert re.fullmatch(r"\d+\.\d+\.\d+(?:\+[0-9A-Za-z.-]+)?", manifest["version"])
    assert manifest["skills"] == "./skills/"
    assert manifest["license"] == "MIT"
    assert manifest["repository"] == "https://github.com/richawo/yaps-codex-plugin"
    assert manifest.get("mcpServers") is None
    assert manifest.get("apps") is None
    assert manifest.get("hooks") is None

    interface = manifest["interface"]
    for field in ("websiteURL", "privacyPolicyURL", "termsOfServiceURL"):
        assert https_url(interface[field]), f"{field} must be an HTTPS URL"
    for field in ("composerIcon", "logo"):
        asset = (PLUGIN / interface[field]).resolve()
        assert asset.is_file(), f"Missing {field}: {asset}"
        assert PLUGIN.resolve() in asset.parents, f"{field} escapes plugin root"
    assert 1 <= len(interface["defaultPrompt"]) <= 3
    assert all(len(prompt) <= 128 for prompt in interface["defaultPrompt"])

    assert skill.startswith("---\n")
    assert "name: yaps-memory" in skill.split("---", 2)[1]
    assert "Yaps → Settings → General → Local AI integrations → Connect Codex" in skill

    patterns = [
        "BEGIN " + r"[A-Z ]+PRIVATE KEY",
        "gh" + r"[opsu]_[A-Za-z0-9]{20,}",
        "sk" + r"-[A-Za-z0-9]{20,}",
        "/" + "Users/",
        r"[A-Za-z]:\\" + "Users" + r"\\",
    ]
    forbidden = re.compile("(" + "|".join(patterns) + ")", re.IGNORECASE)
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts or path.suffix == ".png":
            continue
        content = path.read_text(encoding="utf-8")
        assert not forbidden.search(content), f"Potential secret or private path in {path}"

    print("validate_package: plugin structure, metadata, assets, and public-safety checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
