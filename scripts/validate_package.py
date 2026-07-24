#!/usr/bin/env python3
"""Dependency-free structural, discovery, and public-safety checks."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".agents/plugins/marketplace.json"
README = ROOT / "README.md"
LLMS = ROOT / "llms.txt"
USE_CASES = ROOT / "docs/USE_CASES.md"
SUBMISSION = ROOT / "SUBMISSION.md"
REVIEWER = ROOT / "REVIEWER.md"
REVIEWER_VAULT = ROOT / "reviewer/vault"

EXPECTED_PLUGINS = [
    "yaps-memory",
    "yaps-dictation",
    "yaps-transcription",
    "yaps-srt-generator",
    "yaps-text-to-speech",
    "yaps-video-to-audio",
    "yaps-auto-captions",
]


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    assert isinstance(value, dict), f"{path} must contain a JSON object"
    return value


def https_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def validate_plugin(plugin_name: str) -> None:
    plugin = ROOT / "plugins" / plugin_name
    manifest_path = plugin / ".codex-plugin/plugin.json"
    manifest = load_json(manifest_path)

    assert manifest["name"] == plugin.name == plugin_name
    assert re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"])
    assert manifest["author"]["name"] == "Yaps AI"
    assert manifest["skills"] == "./skills/"
    assert manifest.get("mcpServers") is None
    assert manifest.get("apps") is None
    assert manifest.get("hooks") is None
    assert manifest.get("keywords"), f"{plugin_name} needs discovery keywords"
    assert manifest.get("repository") == "https://github.com/richawo/yaps-codex-plugin"
    assert manifest.get("license") == "MIT"

    interface = manifest["interface"]
    assert interface["developerName"] == "Yaps AI"
    assert interface["capabilities"], f"{plugin_name} needs scannable capabilities"
    for field in ("websiteURL", "privacyPolicyURL", "termsOfServiceURL"):
        assert https_url(interface[field]), f"Invalid {field} in {plugin_name}"
    for field in ("composerIcon", "logo", "logoDark"):
        asset = (plugin / interface[field]).resolve()
        assert asset.is_file(), f"Missing {field}: {asset}"
        assert plugin.resolve() in asset.parents, f"{field} escapes plugin root"
    prompts = interface["defaultPrompt"]
    assert isinstance(prompts, list)
    assert 1 <= len(prompts) <= 3
    assert all(1 <= len(prompt) <= 128 for prompt in prompts)
    assert "yaps desktop" in interface["longDescription"].lower()

    skill_files = sorted((plugin / "skills").glob("*/SKILL.md"))
    assert len(skill_files) == 1, f"{plugin_name} must contain one focused skill"
    skill = skill_files[0].read_text(encoding="utf-8")
    assert skill.startswith("---\n")
    assert f"name: {plugin_name}" in skill.split("---", 2)[1]
    assert "[TODO:" not in skill
    assert "https://yaps.ai/download" in skill
    assert "no longer has a free tier" in skill
    assert "free trial" in skill
    assert "Yaps Pro" in skill
    assert "payment details" in skill

    plugin_readme = (plugin / "README.md").read_text(encoding="utf-8")
    assert "https://yaps.ai/download" in plugin_readme
    assert "support@yaps.ai" in plugin_readme
    assert "no longer has a free tier" in plugin_readme
    assert "free trial" in plugin_readme
    assert "Yaps Pro" in plugin_readme


def validate_memory_review_package() -> None:
    submission = SUBMISSION.read_text(encoding="utf-8")
    reviewer = REVIEWER.read_text(encoding="utf-8")
    positive_section = submission.split("## Positive test cases", 1)[1].split(
        "## Negative test cases", 1
    )[0]
    negative_section = submission.split("## Negative test cases", 1)[1].split(
        "## Initial release notes", 1
    )[0]
    assert len(re.findall(r"^### [1-5]\. ", positive_section, flags=re.MULTILINE)) == 5
    assert len(re.findall(r"^### [1-3]\. ", negative_section, flags=re.MULTILINE)) == 3
    assert "Yaps desktop is required" in submission
    assert "does not create a local or hosted vault" in submission
    assert "Yaps desktop is required" in reviewer
    for phrase in ("without private data", "a paid plan", "a Yaps account"):
        assert phrase in reviewer, f"Reviewer prerequisite disclosure missing: {phrase}"

    fixture_notes = sorted(REVIEWER_VAULT.rglob("*.md"))
    assert len(fixture_notes) >= 5
    fixture_ids: set[str] = set()
    for note in fixture_notes:
        content = note.read_text(encoding="utf-8")
        assert "reviewer-fixture" in content
        match = re.search(r"^  id: (\S+)$", content, flags=re.MULTILINE)
        assert match, f"Persisted yaps.id missing from {note}"
        assert match.group(1) not in fixture_ids
        fixture_ids.add(match.group(1))
        assert re.search(r'^  created_at: "[^"]+"$', content, flags=re.MULTILINE)


def validate_public_safety() -> None:
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
            or path.suffix in {".png", ".zip", ".pyc"}
        ):
            continue
        content = path.read_text(encoding="utf-8")
        assert not forbidden.search(content), f"Potential secret or private path in {path}"


def main() -> int:
    assert not list((ROOT / "plugins").rglob(".DS_Store")), (
        "Plugin packages must not contain .DS_Store files"
    )
    marketplace = load_json(MARKETPLACE)
    assert marketplace["name"] == "yaps"
    assert marketplace["interface"]["displayName"] == "Yaps"
    entries = marketplace["plugins"]
    assert [entry["name"] for entry in entries] == EXPECTED_PLUGINS

    for entry in entries:
        plugin_name = entry["name"]
        assert entry["source"] == {
            "source": "local",
            "path": f"./plugins/{plugin_name}",
        }
        assert entry["policy"] == {
            "installation": "AVAILABLE",
            "authentication": "ON_INSTALL",
        }
        expected_category = (
            "Creative" if plugin_name == "yaps-auto-captions" else "Productivity"
        )
        assert entry["category"] == expected_category
        assert (ROOT / entry["source"]["path"]).resolve() == (
            ROOT / "plugins" / plugin_name
        ).resolve()
        validate_plugin(plugin_name)

    discovery_copy = "\n".join(
        (
            README.read_text(encoding="utf-8"),
            LLMS.read_text(encoding="utf-8"),
            USE_CASES.read_text(encoding="utf-8"),
        )
    ).lower()
    for phrase in (
        "persistent private",
        "voice typing",
        "audio or video",
        "srt",
        "video to audio",
        "text to speech",
        "auto captions",
        "local markdown",
        "codex",
        "yaps desktop",
    ):
        assert phrase in discovery_copy, f"Missing discovery phrase: {phrase}"

    transcription_script = (
        ROOT / "plugins/yaps-transcription/scripts/transcribe_with_yaps.py"
    )
    compile(
        transcription_script.read_text(encoding="utf-8"),
        str(transcription_script),
        "exec",
    )
    transcription_source = transcription_script.read_text(encoding="utf-8")
    assert "ensure_active_account(cli)" in transcription_source
    assert '"auth", "status"' in transcription_source
    assert '"auth", "billing"' in transcription_source
    assert "srt generate" in (
        ROOT
        / "plugins/yaps-srt-generator/skills/yaps-srt-generator/SKILL.md"
    ).read_text(encoding="utf-8")
    assert "speech synthesize" in (
        ROOT
        / "plugins/yaps-text-to-speech/skills/yaps-text-to-speech/SKILL.md"
    ).read_text(encoding="utf-8")
    assert "media extract-audio" in (
        ROOT
        / "plugins/yaps-video-to-audio/skills/yaps-video-to-audio/SKILL.md"
    ).read_text(encoding="utf-8")
    captions_skill = (
        ROOT / "plugins/yaps-auto-captions/skills/yaps-auto-captions/SKILL.md"
    ).read_text(encoding="utf-8")
    for phrase in (
        "captions styles",
        "captions create",
        "captions correct",
        "captions render",
        "captions verify",
        "14 templates",
    ):
        assert phrase in captions_skill
    assert "built-in microphone button" in (
        ROOT / "plugins/yaps-dictation/skills/yaps-dictation/SKILL.md"
    ).read_text(encoding="utf-8")

    validate_memory_review_package()
    validate_public_safety()
    print(
        "validate_package: seven plugin manifests, focused skills, assets, "
        "discovery copy, reviewer fixtures, and public-safety checks passed"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
