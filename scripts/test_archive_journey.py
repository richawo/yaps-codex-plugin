#!/usr/bin/env python3
"""Exercise every built standalone skill ZIP through its packaged runner."""

from __future__ import annotations

from dataclasses import dataclass
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from typing import Callable
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".agents/plugins/marketplace.json"
DIST = ROOT / "dist"


@dataclass
class InstalledFixture:
    cli: Path
    environment: dict[str, str]
    install: Callable[[], None]
    supports_account_handoff: bool
    journey_label: str


def safe_extract(archive: ZipFile, destination: Path) -> None:
    for name in archive.namelist():
        member = Path(name)
        assert not member.is_absolute() and ".." not in member.parts, (
            f"unsafe archive member: {name}"
        )
    archive.extractall(destination)


def posix_fixture_source(node: str) -> str:
    assert " " not in node, "The POSIX Node.js fixture path cannot contain spaces"
    return f"""#!{node}
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
  const requestedStatus = process.env.YAPS_TEST_ACCOUNT_STATUS || "active";
  const settingsMismatch = process.env.YAPS_TEST_SETTINGS_RECOVERY !== "0"
    && !args.includes("--settings-path");
  const authenticated = !["signed_out", "unauthenticated", "verification_unavailable"]
    .includes(requestedStatus);
  process.stdout.write(JSON.stringify(settingsMismatch
    ? {{
        authenticated: false,
        status: "settings_path_mismatch",
        diagnostic_code: "settings_path_mismatch",
        recommended_settings_path: process.env.YAPS_TEST_SETTINGS,
        email: "private@example.com",
        credential: "never-print"
      }}
    : {{
        authenticated,
        status: requestedStatus,
        diagnostic_code: requestedStatus === "verification_unavailable"
          ? "account_cache_incomplete"
          : null,
        access_source: process.env.YAPS_TEST_ACCESS_KIND || null,
        email: "private@example.com",
        credential: "never-print"
      }}));
}} else {{
  writeFileSync(process.env.YAPS_TEST_INVOCATION, JSON.stringify(args));
  process.stdout.write(JSON.stringify({{ok:true}}));
}}
"""


def build_windows_fixture(workspace: Path) -> Path:
    dotnet = shutil.which("dotnet")
    assert dotnet, "The Windows archive journey requires the .NET 8 SDK"
    project = workspace / "windows-fixture-source"
    output = workspace / "windows-fixture-output"
    project.mkdir(parents=True)
    (project / "YapsFixture.csproj").write_text(
        """<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
    <SelfContained>false</SelfContained>
    <PublishSingleFile>true</PublishSingleFile>
    <UseAppHost>true</UseAppHost>
    <AssemblyName>yaps_cli</AssemblyName>
    <Version>2.3.124</Version>
    <AssemblyVersion>2.3.124.0</AssemblyVersion>
    <FileVersion>2.3.124.0</FileVersion>
    <InformationalVersion>2.3.124</InformationalVersion>
  </PropertyGroup>
</Project>
""",
        encoding="utf-8",
    )
    (project / "Program.cs").write_text(
        r"""using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

internal static class Program
{
    private static string RequiredEnvironment(string name) =>
        Environment.GetEnvironmentVariable(name)
        ?? throw new InvalidOperationException($"Missing fixture environment: {name}");

    private static void WriteJson(object value) =>
        Console.Write(JsonSerializer.Serialize(value));

    private static int Main(string[] args)
    {
        if (args.Length > 0 && args[0] == "status")
        {
            WriteJson(new Dictionary<string, object?>
            {
                ["settings_path"] = "C:\\default\\settings.json",
                ["settings_exists"] = true,
                ["auth_store_path"] = "C:\\default\\auth.json",
                ["models_dir"] = "C:\\default\\models",
            });
            return 0;
        }

        if (args.Contains("auth") && args.Contains("status"))
        {
            File.AppendAllText(RequiredEnvironment("YAPS_TEST_AUTH_INVOCATION"), "auth-status\n");
            var requestedStatus = Environment.GetEnvironmentVariable("YAPS_TEST_ACCOUNT_STATUS") ?? "active";
            var settingsMismatch = Environment.GetEnvironmentVariable("YAPS_TEST_SETTINGS_RECOVERY") != "0"
                && !args.Contains("--settings-path");
            var authenticated = requestedStatus is not "signed_out"
                and not "unauthenticated"
                and not "verification_unavailable";
            WriteJson(settingsMismatch
                ? new Dictionary<string, object?>
                {
                    ["authenticated"] = false,
                    ["status"] = "settings_path_mismatch",
                    ["diagnostic_code"] = "settings_path_mismatch",
                    ["recommended_settings_path"] = RequiredEnvironment("YAPS_TEST_SETTINGS"),
                    ["email"] = "private@example.com",
                    ["credential"] = "never-print",
                }
                : new Dictionary<string, object?>
                {
                    ["authenticated"] = authenticated,
                    ["status"] = requestedStatus,
                    ["diagnostic_code"] = requestedStatus == "verification_unavailable"
                        ? "account_cache_incomplete"
                        : null,
                    ["access_source"] = Environment.GetEnvironmentVariable("YAPS_TEST_ACCESS_KIND"),
                    ["email"] = "private@example.com",
                    ["credential"] = "never-print",
                });
            return 0;
        }

        File.WriteAllText(
            RequiredEnvironment("YAPS_TEST_INVOCATION"),
            JsonSerializer.Serialize(args)
        );
        WriteJson(new Dictionary<string, object?> { ["ok"] = true });
        return 0;
    }
}
""",
        encoding="utf-8",
    )
    completed = subprocess.run(
        [
            dotnet,
            "publish",
            str(project / "YapsFixture.csproj"),
            "--configuration",
            "Release",
            "--output",
            str(output),
            "--nologo",
            "--verbosity",
            "quiet",
        ],
        capture_output=True,
        check=False,
        text=True,
        timeout=180,
    )
    assert completed.returncode == 0, (
        "Could not build the versioned Windows CLI fixture:\n"
        f"{completed.stdout}\n{completed.stderr}"
    )
    binary = output / "yaps_cli.exe"
    assert binary.is_file(), f"Windows fixture was not produced: {binary}"
    return binary


def create_installed_fixture(workspace: Path, node: str) -> InstalledFixture:
    fake_home = workspace / "home"
    fake_home.mkdir(parents=True)
    environment = {
        **os.environ,
        "HOME": str(fake_home),
        "USERPROFILE": str(fake_home),
        "PATH": "",
        "YAPS_CLI_BINARY": "",
        "YAPS_INSTALL_DIR": "",
        "YAPS_SETTINGS_PATH": "",
    }

    if sys.platform == "darwin":
        application = fake_home / "Applications/Yaps.app"
        cli = application / "Contents/MacOS/yaps_cli"

        def install() -> None:
            cli.parent.mkdir(parents=True, exist_ok=True)
            (application / "Contents/Info.plist").write_text(
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                "<plist version=\"1.0\"><dict>"
                "<key>CFBundleIdentifier</key><string>com.yaps.app</string>"
                "<key>CFBundleShortVersionString</key><string>2.3.124</string>"
                "<key>CFBundleExecutable</key><string>Yaps</string>"
                "<key>CFBundlePackageType</key><string>APPL</string>"
                "</dict></plist>",
                encoding="utf-8",
            )
            cli.write_text(posix_fixture_source(node), encoding="utf-8")
            cli.chmod(0o700)

        install()
        system_cli = Path("/Applications/Yaps.app/Contents/MacOS/yaps_cli")
        if system_cli.exists():
            # Keep local developer runs isolated from a real signed-in Yaps app.
            # Hosted macOS CI has no override and exercises installed-app discovery.
            environment["YAPS_CLI_BINARY"] = str(cli)
            label = "isolated macOS fixture (a real system Yaps install was present)"
        else:
            label = "PATH-missing per-user macOS installed-app journey"
        return InstalledFixture(cli, environment, install, True, label)

    if os.name == "nt":
        built_cli = build_windows_fixture(workspace)
        program_files = workspace / "Program Files"
        cli = program_files / "Yaps/yaps_cli.exe"

        def install() -> None:
            cli.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(built_cli, cli)

        install()
        environment.update(
            {
                "ProgramW6432": str(program_files),
                "ProgramFiles": str(program_files),
                "PATHEXT": ".EXE;.CMD",
            }
        )
        return InstalledFixture(
            cli,
            environment,
            install,
            True,
            "PATH-missing Windows Program Files installed-app journey",
        )

    cli = workspace / "yaps cli; no-shell"

    def install() -> None:
        cli.write_text(posix_fixture_source(node), encoding="utf-8")
        cli.chmod(0o700)

    install()
    environment["YAPS_CLI_BINARY"] = str(cli)
    return InstalledFixture(
        cli,
        environment,
        install,
        False,
        "unverifiable Linux override fail-closed journey",
    )


def scenario_environment(
    fixture: InstalledFixture,
    workspace: Path,
    scenario: str,
    *,
    status: str = "active",
    access_kind: str = "trial",
    recover_settings: bool = True,
) -> tuple[dict[str, str], Path, Path]:
    scenario_root = workspace / "scenarios" / scenario
    scenario_root.mkdir(parents=True, exist_ok=True)
    invocation = scenario_root / "invocation.json"
    auth_invocation = scenario_root / "auth-invocation.txt"
    invocation.unlink(missing_ok=True)
    auth_invocation.unlink(missing_ok=True)
    environment = {
        **fixture.environment,
        "YAPS_TEST_SETTINGS": str(
            scenario_root / "canonical settings; no-shell" / "settings.json"
        ),
        "YAPS_TEST_INVOCATION": str(invocation),
        "YAPS_TEST_AUTH_INVOCATION": str(auth_invocation),
        "YAPS_TEST_ACCOUNT_STATUS": status,
        "YAPS_TEST_ACCESS_KIND": access_kind,
        "YAPS_TEST_SETTINGS_RECOVERY": "1" if recover_settings else "0",
    }
    return environment, invocation, auth_invocation


def run_runner(
    node: str,
    runner: Path,
    environment: dict[str, str],
    *arguments: str,
    action: str = "archive.journey",
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            node,
            str(runner),
            "--action",
            action,
            "--stage",
            "execution",
            "--",
            "yaps",
            *arguments,
        ],
        capture_output=True,
        check=False,
        env=environment,
        text=True,
        timeout=30,
    )


def assert_no_secrets(completed: subprocess.CompletedProcess[str]) -> None:
    combined = completed.stdout + completed.stderr
    assert "private@example.com" not in combined
    assert "never-print" not in combined


def exercise_account_states(
    node: str,
    runner: Path,
    fixture: InstalledFixture,
    workspace: Path,
) -> None:
    for access_kind in ("trial", "yaps_pro"):
        environment, invocation, auth_invocation = scenario_environment(
            fixture,
            workspace,
            f"active-{access_kind}",
            access_kind=access_kind,
            recover_settings=False,
        )
        completed = run_runner(
            node,
            runner,
            environment,
            "vault",
            "status",
            "--pretty",
            action=f"account.{access_kind}",
        )
        assert completed.returncode == 0, completed.stderr
        assert invocation.is_file()
        assert auth_invocation.read_text(encoding="utf-8").splitlines() == [
            "auth-status"
        ]
        assert_no_secrets(completed)
        assert access_kind not in completed.stdout + completed.stderr

        status_result = run_runner(
            node,
            runner,
            environment,
            "auth",
            "status",
            "--pretty",
            action=f"account.{access_kind}.status",
        )
        assert status_result.returncode == 0, status_result.stderr
        assert json.loads(status_result.stdout) == {
            "authenticated": True,
            "status": "active",
            "diagnostic_code": None,
            "credential_status": "not_accessed",
        }
        assert_no_secrets(status_result)
        assert access_kind not in status_result.stdout + status_result.stderr

    denied_states = {
        "signed_out": "no active desktop account is signed in",
        "expired": "trial or Yaps Pro access is not active",
        "platform_mismatch": "only has mobile access",
        "verification_unavailable": "could not verify current trial or Yaps Pro access",
        "credential_unavailable": "older credential-based account check",
        "unexpected_future_state": "does not recognize",
    }
    for status, expected_guidance in denied_states.items():
        environment, invocation, auth_invocation = scenario_environment(
            fixture,
            workspace,
            f"denied-{status}",
            status=status,
            recover_settings=False,
        )
        completed = run_runner(
            node,
            runner,
            environment,
            "vault",
            "status",
            "--pretty",
            action=f"account.{status}",
        )
        assert completed.returncode == 77, (
            f"{status} should be denied: {completed.stderr}"
        )
        assert expected_guidance.lower() in completed.stderr.lower()
        assert not invocation.exists()
        assert auth_invocation.is_file()
        assert 1 <= len(auth_invocation.read_text(encoding="utf-8").splitlines()) <= 5
        assert_no_secrets(completed)


def exercise_reinstall_and_override(
    node: str,
    runner: Path,
    fixture: InstalledFixture,
    workspace: Path,
) -> None:
    environment, invocation, _ = scenario_environment(
        fixture,
        workspace,
        "authoritative-invalid-override",
        recover_settings=False,
    )
    injection_marker = workspace / "override-was-executed"
    environment["YAPS_CLI_BINARY"] = str(
        workspace / "missing override; no-shell $(override-was-executed)"
    )
    rejected_override = run_runner(
        node,
        runner,
        environment,
        "vault",
        "status",
        action="install.invalid-override",
    )
    assert rejected_override.returncode == 127
    assert "YAPS_CLI_BINARY" in rejected_override.stderr
    assert not invocation.exists()
    assert not injection_marker.exists()

    fixture.cli.unlink(missing_ok=True)
    environment, invocation, _ = scenario_environment(
        fixture,
        workspace,
        "clean-uninstall",
        recover_settings=False,
    )
    missing = run_runner(
        node,
        runner,
        environment,
        "vault",
        "status",
        action="install.missing",
    )
    assert missing.returncode == 127
    assert not invocation.exists()

    fixture.cli.parent.mkdir(parents=True, exist_ok=True)
    fixture.cli.write_text("this is a corrupt executable", encoding="utf-8")
    if os.name != "nt":
        fixture.cli.chmod(0o700)
    invalid = run_runner(
        node,
        runner,
        environment,
        "vault",
        "status",
        action="install.corrupt",
    )
    assert invalid.returncode == 127
    assert "did not pass the safe status check" in invalid.stderr
    assert not invocation.exists()

    fixture.install()
    reinstalled = run_runner(
        node,
        runner,
        environment,
        "vault",
        "status",
        "--pretty",
        action="install.reinstalled",
    )
    assert reinstalled.returncode == 0, reinstalled.stderr
    assert invocation.is_file()
    assert_no_secrets(reinstalled)


def main() -> int:
    node = shutil.which("node")
    assert node, "Node.js is required for archive journey tests"
    marketplace = json.loads(MARKETPLACE.read_text(encoding="utf-8"))

    with tempfile.TemporaryDirectory(prefix="yaps-public-archive-") as temporary:
        workspace = Path(temporary)
        fixture = create_installed_fixture(workspace, node)
        tested: list[str] = []
        representative_runner: Path | None = None

        for index, entry in enumerate(marketplace["plugins"]):
            plugin_name = entry["name"]
            manifest = json.loads(
                (
                    ROOT / "plugins" / plugin_name / ".codex-plugin/plugin.json"
                ).read_text(encoding="utf-8")
            )
            version = manifest["version"].split("+", 1)[0]
            archive_path = DIST / f"{plugin_name}-skill-{version}.zip"
            assert archive_path.is_file(), f"missing built archive: {archive_path}"

            extracted = workspace / "extracted" / plugin_name
            with ZipFile(archive_path) as archive:
                safe_extract(archive, extracted)
            runner = extracted / plugin_name / "scripts/yaps-plugin-runner.mjs"
            discovery = extracted / plugin_name / "scripts/yaps-cli-discovery.mjs"
            assert runner.is_file() and discovery.is_file()
            if plugin_name == "yaps-dictation":
                representative_runner = runner

            access_kind = "trial" if index % 2 == 0 else "yaps_pro"
            environment, invocation, auth_invocation = scenario_environment(
                fixture,
                workspace,
                f"plugin-{plugin_name}",
                access_kind=access_kind,
            )
            completed = run_runner(
                node,
                runner,
                environment,
                "vault",
                "status",
                "--pretty",
            )
            assert_no_secrets(completed)
            if fixture.supports_account_handoff:
                assert completed.returncode == 0, (
                    f"{plugin_name} archive runner failed: {completed.stderr}"
                )
                assert json.loads(invocation.read_text(encoding="utf-8")) == [
                    "--settings-path",
                    environment["YAPS_TEST_SETTINGS"],
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
        assert representative_runner is not None
        if fixture.supports_account_handoff:
            exercise_account_states(node, representative_runner, fixture, workspace)
            exercise_reinstall_and_override(
                node,
                representative_runner,
                fixture,
                workspace,
            )

        print(
            "archive_journey: all eleven standalone skill ZIPs plus clean-install "
            f"and account-state coverage passed the {fixture.journey_label}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
