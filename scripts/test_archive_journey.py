#!/usr/bin/env python3
"""Exercise every built standalone skill ZIP through its packaged runner."""

from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".agents/plugins/marketplace.json"
DIST = ROOT / "dist"


def safe_extract(archive: ZipFile, destination: Path) -> None:
    for name in archive.namelist():
        member = Path(name)
        assert not member.is_absolute() and ".." not in member.parts, (
            f"unsafe archive member: {name}"
        )
    archive.extractall(destination)


def main() -> int:
    node = shutil.which("node")
    assert node and " " not in node, "Node.js is required for archive journey tests"
    marketplace = json.loads(MARKETPLACE.read_text(encoding="utf-8"))

    with tempfile.TemporaryDirectory(prefix="yaps-public-archive-") as temporary:
        workspace = Path(temporary)
        fake_home = workspace / "home"
        fake_home.mkdir()
        macos_installed_app = sys.platform == "darwin"
        fake_cli = (
            fake_home / "Applications/Yaps.app/Contents/MacOS/yaps_cli"
            if macos_installed_app
            else workspace / "yaps cli; no-shell"
        )
        fake_cli.parent.mkdir(parents=True, exist_ok=True)
        if macos_installed_app:
            (fake_home / "Applications/Yaps.app/Contents/Info.plist").write_text(
                "<key>CFBundleIdentifier</key><string>com.yaps.app</string>"
                "<key>CFBundleShortVersionString</key><string>2.3.124</string>",
                encoding="utf-8",
            )
        fake_cli.write_text(
            f"""#!{node}
const {{ appendFileSync, writeFileSync }} = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "status") {{
  process.stdout.write(JSON.stringify({{
    settings_path: "/default/settings.json",
    settings_exists: true,
    auth_store_path: "/default/auth.json",
    models_dir: "/default/models"
  }}));
}} else if (args.includes("auth") && args.includes("status")) {{
  appendFileSync(process.env.YAPS_TEST_AUTH_INVOCATION, "auth-status\\n");
  process.stdout.write(JSON.stringify(args.includes("--settings-path")
    ? {{authenticated:true,status:"active",email:"private@example.com",credential:"never-print"}}
    : {{authenticated:false,status:"settings_path_mismatch",recommended_settings_path:process.env.YAPS_TEST_SETTINGS,email:"private@example.com",credential:"never-print"}}));
}} else {{
  writeFileSync(process.env.YAPS_TEST_INVOCATION, JSON.stringify(args));
  process.stdout.write(JSON.stringify({{ok:true}}));
}}
""",
            encoding="utf-8",
        )
        fake_cli.chmod(0o700)

        tested: list[str] = []
        for entry in marketplace["plugins"]:
            plugin_name = entry["name"]
            manifest = json.loads(
                (
                    ROOT / "plugins" / plugin_name / ".codex-plugin/plugin.json"
                ).read_text(encoding="utf-8")
            )
            version = manifest["version"].split("+", 1)[0]
            archive_path = DIST / f"{plugin_name}-skill-{version}.zip"
            assert archive_path.is_file(), f"missing built archive: {archive_path}"

            extracted = workspace / plugin_name
            with ZipFile(archive_path) as archive:
                safe_extract(archive, extracted)
            runner = extracted / plugin_name / "scripts/yaps-plugin-runner.mjs"
            discovery = extracted / plugin_name / "scripts/yaps-cli-discovery.mjs"
            assert runner.is_file() and discovery.is_file()

            settings_path = (
                workspace / "canonical settings; no-shell" / plugin_name / "settings.json"
            )
            invocation = workspace / f"{plugin_name}-invocation.json"
            auth_invocation = workspace / f"{plugin_name}-auth-invocation.txt"
            environment = {
                **os.environ,
                "HOME": str(fake_home),
                "PATH": "",
                "YAPS_SETTINGS_PATH": "",
                "YAPS_TEST_SETTINGS": str(settings_path),
                "YAPS_TEST_INVOCATION": str(invocation),
                "YAPS_TEST_AUTH_INVOCATION": str(auth_invocation),
                **({} if macos_installed_app else {"YAPS_CLI_BINARY": str(fake_cli)}),
            }
            completed = subprocess.run(
                [
                    node,
                    str(runner),
                    "--action",
                    "archive.journey",
                    "--stage",
                    "execution",
                    "--",
                    "yaps",
                    "vault",
                    "status",
                    "--pretty",
                ],
                capture_output=True,
                check=False,
                env=environment,
                text=True,
                timeout=20,
            )
            assert "private@example.com" not in completed.stdout + completed.stderr
            assert "never-print" not in completed.stdout + completed.stderr
            if macos_installed_app:
                assert completed.returncode == 0, (
                    f"{plugin_name} archive runner failed: {completed.stderr}"
                )
                assert json.loads(invocation.read_text(encoding="utf-8")) == [
                    "--settings-path",
                    str(settings_path),
                    "vault",
                    "status",
                    "--pretty",
                ]
                assert auth_invocation.read_text(encoding="utf-8").splitlines() == [
                    "auth-status",
                    "auth-status",
                ]
            else:
                assert completed.returncode == 77, (
                    f"{plugin_name} should reject unverifiable CLI auth: "
                    f"{completed.stderr}"
                )
                assert "could not verify" in completed.stderr.lower()
                assert "credential-free" in completed.stderr.lower()
                assert not invocation.exists()
                assert not auth_invocation.exists()
            tested.append(plugin_name)

        assert len(tested) == 11
        print(
            "archive_journey: all eleven standalone skill ZIPs passed the "
            + (
                "PATH-missing per-user macOS installed-app journey"
                if macos_installed_app
                else "unverifiable Linux override fail-closed journey"
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
