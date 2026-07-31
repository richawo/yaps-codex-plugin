#!/usr/bin/env python3
"""Create an editable speaker-labelled meeting project through Yaps."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile


VIDEO_EXTENSIONS = {
    ".3gp",
    ".avi",
    ".flv",
    ".m2ts",
    ".m4v",
    ".mkv",
    ".mov",
    ".mp4",
    ".mpeg",
    ".mpg",
    ".mts",
    ".ts",
    ".webm",
    ".wmv",
}


def cli_candidates(explicit: str | None) -> list[Path]:
    candidates: list[Path] = []
    if explicit:
        candidates.append(Path(explicit).expanduser())
    if os.environ.get("YAPS_CLI_BINARY"):
        candidates.append(Path(os.environ["YAPS_CLI_BINARY"]).expanduser())

    home = Path.home()
    if platform.system() == "Darwin":
        candidates.extend(
            [
                Path("/Applications/Yaps.app/Contents/MacOS/yaps_cli"),
                home / "Applications/Yaps.app/Contents/MacOS/yaps_cli",
            ]
        )
    elif platform.system() == "Windows":
        for key in ("LOCALAPPDATA", "ProgramW6432", "ProgramFiles", "ProgramFiles(x86)"):
            base = os.environ.get(key)
            if not base:
                continue
            root = Path(base)
            candidates.extend(
                [
                    root / "Yaps" / "yaps_cli.exe",
                    root / "Programs" / "Yaps" / "yaps_cli.exe",
                ]
            )
    for command in ("yaps", "yaps_cli"):
        resolved = shutil.which(command)
        if resolved:
            candidates.append(Path(resolved))

    seen: set[Path] = set()
    return [path for path in candidates if not (path in seen or seen.add(path))]


def resolve_cli(explicit: str | None) -> Path:
    for candidate in cli_candidates(explicit):
        if not candidate.is_file():
            continue
        try:
            probe = subprocess.run(
                [str(candidate), "--help"],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            continue
        if probe.returncode == 0:
            return candidate
    raise RuntimeError(
        "The packaged Yaps CLI was not found. Download or update Yaps at "
        "https://yaps.ai/download, open it, and finish setup."
    )


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


def ensure_active_account(cli: Path) -> Path | None:
    status = run_json(
        cli_command(cli, "auth", "status"),
        "Yaps could not verify the signed-in account.",
    )
    if status.get("authenticated") is True and status.get("status") == "active":
        return None

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
            "Yaps found the local account, but its helper cannot access the system "
            "credential store. Keep Yaps open, approve any credential prompt "
            "(choose Always Allow in macOS Keychain), and retry. Do not create "
            "another account; the ChatGPT and Yaps emails do not need to match."
        )
    if state == "credential_missing" or diagnostic == "credential_missing":
        raise RuntimeError(
            "Yaps found local account details but no reusable sign-in credential. "
            "Open Yaps and let it refresh the account; if it stays stuck, sign out "
            "and back in inside Yaps, then retry. The ChatGPT email is unrelated."
        )
    if state in {"cached_offline", "verification_unavailable"} or diagnostic in {
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

    settings_path = None
    resolved_settings = status.get("settings_path")
    if isinstance(resolved_settings, str) and resolved_settings.strip():
        settings_path = Path(resolved_settings)
    trial_eligible = False
    try:
        billing = run_json(
            cli_command(cli, "auth", "billing", settings_path=settings_path),
            "Yaps could not verify billing access.",
        )
        trial_eligible = billing.get("trial_eligible") is True
    except RuntimeError:
        pass

    if trial_eligible:
        next_step = "start the free trial shown in Yaps"
    else:
        next_step = "activate or renew Yaps Pro inside Yaps"
    if state == "platform_mismatch":
        next_step = "activate desktop-compatible Yaps access inside Yaps"
    raise RuntimeError(
        f"Yaps account access is not active ({state}). Open Yaps and {next_step}, "
        "then retry."
    )


def ensure_engine_installed(
    cli: Path, engine: str, settings_path: Path | None
) -> None:
    inventory = run_json(
        cli_command(cli, "features", "list", settings_path=settings_path),
        "Yaps could not inspect the Meeting feature.",
    )
    features = inventory.get("features")
    if not isinstance(features, list):
        raise RuntimeError("Yaps returned an unexpected feature inventory.")
    meeting = next(
        (
            item
            for item in features
            if isinstance(item, dict) and item.get("id") == "meeting"
        ),
        None,
    )
    if not isinstance(meeting, dict):
        raise RuntimeError(
            "This Yaps build does not include Meeting transcription. Update Yaps first."
        )
    modes = meeting.get("modes")
    if not isinstance(modes, list):
        modes = []
    installed = {
        str(item.get("id")): item.get("installed") is True
        for item in modes
        if isinstance(item, dict)
    }
    if not installed.get("sherpa", False):
        raise RuntimeError(
            "Meeting transcription is not installed. In Yaps, install Meeting from "
            "Features, or run `yaps features meeting --enable` after approving the download."
        )
    if engine == "moss" and not installed.get("moss", False):
        raise RuntimeError(
            "MOSS is not installed or is unsupported on this machine. On Apple Silicon, "
            "run `yaps features meeting --enable --engine moss` after approving the download."
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Transcribe a meeting and identify speakers through Yaps."
    )
    parser.add_argument("recording", type=Path, help="Meeting audio or video file")
    parser.add_argument("--title", help="Meeting title stored in Yaps")
    parser.add_argument(
        "--engine",
        choices=("auto", "sherpa", "moss"),
        default="auto",
        help="auto (recommended), sherpa, or Apple-Silicon-only moss",
    )
    parser.add_argument(
        "--speakers",
        type=int,
        help="Optional number of people, 1-20. Used by Sherpa.",
    )
    parser.add_argument("--yaps-cli", help="Explicit path to yaps or yaps_cli")
    return parser.parse_args()


def transcribe(
    cli: Path,
    audio: Path,
    args: argparse.Namespace,
    settings_path: Path | None,
) -> dict[str, object]:
    command = cli_command(
        cli,
        "meeting",
        "transcribe",
        str(audio),
        "--engine",
        args.engine,
        settings_path=settings_path,
    )
    if args.title:
        command.extend(["--title", args.title])
    if args.speakers is not None:
        command.extend(["--speakers", str(args.speakers)])
    return run_json(command, "Yaps meeting transcription failed.")


def main() -> int:
    args = parse_args()
    recording = args.recording.expanduser().resolve()
    if not recording.is_file():
        raise RuntimeError(f"Recording not found: {recording}")
    if args.speakers is not None and not 1 <= args.speakers <= 20:
        raise RuntimeError("--speakers must be between 1 and 20.")
    if args.engine == "moss" and args.speakers is not None:
        raise RuntimeError("MOSS detects speakers automatically; omit --speakers.")

    cli = resolve_cli(args.yaps_cli)
    settings_path = ensure_active_account(cli)
    if args.engine == "moss" and not (
        platform.system() == "Darwin"
        and platform.machine().lower() in {"arm64", "aarch64"}
    ):
        raise RuntimeError(
            "MOSS meeting transcription is available only on Apple Silicon Macs. "
            "Use --engine sherpa (or auto) on this machine."
        )
    ensure_engine_installed(cli, args.engine, settings_path)

    if recording.suffix.lower() in VIDEO_EXTENSIONS:
        with tempfile.TemporaryDirectory(prefix="yaps-meeting-") as temp_dir:
            extracted = Path(temp_dir) / "meeting-audio.wav"
            run_json(
                cli_command(
                    cli,
                    "media",
                    "extract-audio",
                    str(recording),
                    "--format",
                    "wav",
                    "--output",
                    str(extracted),
                    settings_path=settings_path,
                ),
                "Yaps could not extract audio from the video.",
            )
            result = transcribe(cli, extracted, args, settings_path)
    else:
        result = transcribe(cli, recording, args, settings_path)

    segments = result.get("segments")
    if not isinstance(segments, list) or not segments:
        raise RuntimeError("Yaps returned no meeting transcript segments.")
    summary = {
        "source_media": str(recording),
        "meeting_id": result.get("meeting_id"),
        "title": result.get("title"),
        "engine": result.get("engine"),
        "engine_reason": result.get("engine_reason"),
        "duration_secs": result.get("duration_secs"),
        "num_speakers": result.get("num_speakers"),
        "segment_count": len(segments),
        "project_path": result.get("project_path"),
        "audio_path": result.get("audio_path"),
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
