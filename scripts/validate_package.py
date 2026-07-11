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
README = ROOT / "README.md"
LLMS = ROOT / "llms.txt"
USE_CASES = ROOT / "docs/USE_CASES.md"
SUBMISSION = ROOT / "SUBMISSION.md"
REVIEWER = ROOT / "REVIEWER.md"
REVIEWER_VAULT = ROOT / "reviewer/vault"


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
    readme = README.read_text(encoding="utf-8")
    llms = LLMS.read_text(encoding="utf-8")
    use_cases = USE_CASES.read_text(encoding="utf-8")
    submission = SUBMISSION.read_text(encoding="utf-8")
    reviewer = REVIEWER.read_text(encoding="utf-8")

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
    # The public uploader is stricter than local cachebuster installs: use a
    # plain release semver without build metadata in submission bundles.
    assert re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"])
    assert manifest["author"]["name"] == "Yaps AI"
    assert manifest["skills"] == "./skills/"
    assert manifest["license"] == "MIT"
    assert manifest["repository"] == "https://github.com/richawo/yaps-codex-plugin"
    assert manifest.get("mcpServers") is None
    assert manifest.get("apps") is None
    assert manifest.get("hooks") is None

    interface = manifest["interface"]
    assert interface["developerName"] == "Yaps AI"
    assert set(interface["capabilities"]) <= {"Read", "Write", "Interactive"}
    for field in ("websiteURL", "privacyPolicyURL", "termsOfServiceURL"):
        assert https_url(interface[field]), f"{field} must be an HTTPS URL"
    for field in ("composerIcon", "logo"):
        asset = (PLUGIN / interface[field]).resolve()
        assert asset.is_file(), f"Missing {field}: {asset}"
        assert PLUGIN.resolve() in asset.parents, f"{field} escapes plugin root"
    assert 1 <= len(interface["defaultPrompt"]) <= 3
    assert all(len(prompt) <= 128 for prompt in interface["defaultPrompt"])
    assert "requires yaps desktop" in interface["longDescription"].lower()
    assert "does not create a vault" in interface["longDescription"].lower()

    assert skill.startswith("---\n")
    assert "name: yaps-memory" in skill.split("---", 2)[1]
    assert "Yaps → Settings → General → Local AI integrations → Connect Codex" in skill

    discovery_copy = "\n".join((readme, llms, use_cases)).lower()
    for phrase in (
        "persistent",
        "cross-chat memory",
        "local markdown",
        "memory store",
        "remembered facts",
        "personal knowledge",
        "mcp server",
        "codex",
        "ai agents",
    ):
        assert phrase in discovery_copy, f"Missing discovery phrase: {phrase}"
    for canonical_url in (
        "https://github.com/richawo/yaps-codex-plugin",
        "https://www.yaps.ai/",
        "https://www.yaps.ai/privacy",
    ):
        assert canonical_url in llms, f"Missing canonical URL in llms.txt: {canonical_url}"
    assert "does not create, host, or upload a vault" in llms.lower()
    assert "not native chatgpt/model memory" in llms.lower()

    positive_section = submission.split("## Positive test cases", 1)[1].split(
        "## Negative test cases", 1
    )[0]
    negative_section = submission.split("## Negative test cases", 1)[1].split(
        "## Initial release notes", 1
    )[0]
    positive_cases = re.findall(r"^### [1-5]\. ", positive_section, flags=re.MULTILINE)
    negative_cases = re.findall(r"^### [1-3]\. ", negative_section, flags=re.MULTILINE)
    assert len(positive_cases) == 5, "Submission must contain exactly five positive cases"
    assert len(negative_cases) == 3, "Submission must contain exactly three negative cases"
    assert "Yaps desktop is required" in submission
    assert "does not create a local or hosted vault" in submission
    assert "Yaps desktop is required" in reviewer
    for phrase in ("without private data", "a paid plan", "a Yaps account"):
        assert phrase in reviewer, f"Reviewer prerequisite disclosure missing: {phrase}"

    fixture_notes = sorted(REVIEWER_VAULT.rglob("*.md"))
    assert len(fixture_notes) >= 5, "Reviewer vault must contain at least five notes"
    fixture_ids: set[str] = set()
    for note in fixture_notes:
        content = note.read_text(encoding="utf-8")
        assert "reviewer-fixture" in content, f"Fixture marker missing from {note}"
        match = re.search(r"^  id: (\S+)$", content, flags=re.MULTILINE)
        assert match, f"Persisted yaps.id missing from {note}"
        fixture_id = match.group(1)
        assert fixture_id not in fixture_ids, f"Duplicate fixture id: {fixture_id}"
        fixture_ids.add(fixture_id)
        assert re.search(r'^  created_at: "[^"]+"$', content, flags=re.MULTILINE)

    patterns = [
        "BEGIN " + r"[A-Z ]+PRIVATE KEY",
        "gh" + r"[opsu]_[A-Za-z0-9]{20,}",
        "sk" + r"-[A-Za-z0-9]{20,}",
        "/" + "Users/",
        r"[A-Za-z]:\\" + "Users" + r"\\",
    ]
    forbidden = re.compile("(" + "|".join(patterns) + ")", re.IGNORECASE)
    for path in ROOT.rglob("*"):
        if (
            not path.is_file()
            or ".git" in path.parts
            or "dist" in path.parts
            or path.suffix in {".png", ".zip"}
        ):
            continue
        content = path.read_text(encoding="utf-8")
        assert not forbidden.search(content), f"Potential secret or private path in {path}"

    print(
        "validate_package: plugin structure, discovery metadata, assets, "
        "review fixtures, and public-safety checks passed"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
