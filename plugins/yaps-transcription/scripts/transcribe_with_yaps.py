#!/usr/bin/env python3
"""Create a plain-text transcript through the installed Yaps CLI."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def resolve_cli_session(explicit: str | None) -> tuple[Path, dict[str, object]]:
    discovery = Path(__file__).with_name("yaps-cli-discovery.mjs")
    command = ["node", str(discovery), "--resolve-session"]
    if explicit:
        command.extend(["--override", explicit])
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=17,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        raise RuntimeError(
            "Yaps CLI discovery could not run. Use the plugin runner from a local "
            "ChatGPT, Codex, or Claude Code session and retry."
        ) from error
    if completed.returncode != 0:
        raise RuntimeError(
            completed.stderr.strip()
            or "The Yaps CLI could not be found or validated. Update Yaps and retry."
        )
    try:
        payload = json.loads(completed.stdout)
        resolved = payload["path"]
    except (json.JSONDecodeError, KeyError, TypeError) as error:
        raise RuntimeError("Yaps CLI discovery returned an unexpected response.") from error
    if not isinstance(resolved, str) or not resolved:
        raise RuntimeError("Yaps CLI discovery returned an unexpected response.")
    if not isinstance(payload, dict):
        raise RuntimeError("Yaps CLI discovery returned an unexpected response.")
    return Path(resolved), payload


def resolve_cli(explicit: str | None) -> Path:
    return resolve_cli_session(explicit)[0]


def run_json(command: list[str], failure_message: str) -> dict[str, object]:
    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise RuntimeError(detail or failure_message)
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Yaps returned invalid JSON: {error}") from error
    if not isinstance(result, dict):
        raise RuntimeError("Yaps returned an unexpected response.")
    return result


def cli_command(
    cli: Path, *args: str, settings_path: Path | None = None
) -> list[str]:
    command = [str(cli)]
    if settings_path is not None:
        command.extend(["--settings-path", str(settings_path)])
    command.extend(["--pretty", *args])
    return command


def ensure_active_account(
    cli: Path, resolved_session: dict[str, object] | None = None
) -> Path | None:
    if resolved_session is None:
        status = run_json(
            cli_command(cli, "auth", "status"),
            "Yaps could not verify the signed-in account.",
        )
    else:
        status = {
            "authenticated": resolved_session.get("authenticated") is True,
            "status": resolved_session.get("account_status"),
            "diagnostic_code": resolved_session.get("diagnostic_code"),
        }
        selected = resolved_session.get("settings_path")
        if isinstance(selected, str) and selected.strip():
            status["selected_settings_path"] = selected
    if status.get("authenticated") is True and status.get("status") == "active":
        selected = status.get("selected_settings_path")
        return Path(selected) if isinstance(selected, str) else None

    recommended = status.get("recommended_settings_path")
    if isinstance(recommended, str) and recommended.strip():
        settings_path = Path(recommended).expanduser()
        retry = run_json(
            cli_command(cli, "auth", "status", settings_path=settings_path),
            "Yaps could not verify the account in its primary data directory.",
        )
        if retry.get("authenticated") is True and retry.get("status") == "active":
            return settings_path
        status = retry

    state = str(status.get("status") or "unauthenticated")
    diagnostic = str(status.get("diagnostic_code") or "")
    if state == "credential_unavailable" or diagnostic == "keychain_unavailable":
        raise RuntimeError(
            "This Yaps helper uses an old credential-based status check. Update "
            "Yaps, keep it open, and retry. Do not approve a Keychain prompt or "
            "create another account; the ChatGPT and Yaps emails do not need to match."
        )
    if state == "credential_missing" or diagnostic == "credential_missing":
        raise RuntimeError(
            "Yaps found local account details but no reusable sign-in credential. "
            "Open Yaps and let it refresh the account; if it stays stuck, sign out "
            "and back in inside Yaps, then retry. The ChatGPT email is unrelated."
        )
    if state in {"cached_offline", "verification_unavailable"} or diagnostic in {
        "account_cache_incomplete",
        "refresh_failed",
        "profile_lookup_failed",
    }:
        raise RuntimeError(
            "Yaps found the sign-in, but could not validate it. Check the internet "
            "connection, keep Yaps open, and retry before changing accounts."
        )
    if state in {"unauthenticated", "settings_path_mismatch"}:
        raise RuntimeError(
            "Open Yaps and sign in first. Yaps has no free tier; after sign-in, "
            "start an available free trial or activate Yaps Pro inside the app. "
            "The ChatGPT and Yaps emails do not need to match."
        )

    next_step = "review the trial or Yaps Pro options on the account screen"
    if state == "platform_mismatch":
        next_step = "activate desktop-compatible Yaps access inside Yaps"
    raise RuntimeError(
        f"Yaps account access is not active ({state}). Open Yaps and {next_step}, "
        "then retry."
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Transcribe an audio or video file to plain text through Yaps."
    )
    parser.add_argument("media", type=Path, help="Audio or video file to transcribe")
    parser.add_argument("--output", type=Path, help="Destination .txt path")
    parser.add_argument("--yaps-cli", help="Explicit path to yaps or yaps_cli")
    parser.add_argument(
        "--force", action="store_true", help="Replace an existing output file"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    media = args.media.expanduser().resolve()
    if not media.is_file():
        raise RuntimeError(f"Media file not found: {media}")

    output = (
        args.output.expanduser()
        if args.output
        else media.with_name(f"{media.stem} Transcript.txt")
    ).resolve()
    if output.exists() and not args.force:
        raise RuntimeError(f"Output already exists: {output}. Use --force to replace it.")
    output.parent.mkdir(parents=True, exist_ok=True)

    cli, resolved_session = resolve_cli_session(args.yaps_cli)
    settings_path = ensure_active_account(cli, resolved_session)
    with tempfile.TemporaryDirectory(prefix="yaps-transcription-") as temp_dir:
        temporary_srt = Path(temp_dir) / "transcript.srt"
        command = cli_command(
            cli,
            "srt",
            "generate",
            str(media),
            "--output",
            str(temporary_srt),
            settings_path=settings_path,
        )
        result = run_json(command, "Yaps transcription failed.")

    transcript = str(result.get("transcript", "")).strip()
    if not transcript:
        raise RuntimeError("Yaps returned no speech for this file.")
    output.write_text(f"{transcript}\n", encoding="utf-8")

    summary = {
        "source_media": str(media),
        "output_path": str(output),
        "engine": result.get("engine"),
        "duration_secs": result.get("duration_secs"),
        "word_count": result.get("word_count"),
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
