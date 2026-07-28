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
    for command in ("yaps", "yaps_cli"):
        resolved = shutil.which(command)
        if resolved:
            candidates.append(Path(resolved))

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

    seen: set[Path] = set()
    return [path for path in candidates if not (path in seen or seen.add(path))]


def resolve_cli(explicit: str | None) -> Path:
    for candidate in cli_candidates(explicit):
        if candidate.is_file():
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


def ensure_active_account(cli: Path) -> None:
    status = run_json(
        [str(cli), "--pretty", "auth", "status"],
        "Yaps could not verify the signed-in account.",
    )
    if status.get("authenticated") is True and status.get("status") == "active":
        return

    state = str(status.get("status") or "unauthenticated")
    if state == "unauthenticated":
        raise RuntimeError(
            "Open Yaps and sign in first. Yaps has no free tier; after sign-in, "
            "start an available free trial or activate Yaps Pro inside the app."
        )

    trial_eligible = False
    try:
        billing = run_json(
            [str(cli), "--pretty", "auth", "billing"],
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


def ensure_engine_installed(cli: Path, engine: str) -> None:
    inventory = run_json(
        [str(cli), "--pretty", "features", "list"],
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


def transcribe(cli: Path, audio: Path, args: argparse.Namespace) -> dict[str, object]:
    command = [
        str(cli),
        "--pretty",
        "meeting",
        "transcribe",
        str(audio),
        "--engine",
        args.engine,
    ]
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
    ensure_active_account(cli)
    if args.engine == "moss" and not (
        platform.system() == "Darwin"
        and platform.machine().lower() in {"arm64", "aarch64"}
    ):
        raise RuntimeError(
            "MOSS meeting transcription is available only on Apple Silicon Macs. "
            "Use --engine sherpa (or auto) on this machine."
        )
    ensure_engine_installed(cli, args.engine)

    if recording.suffix.lower() in VIDEO_EXTENSIONS:
        with tempfile.TemporaryDirectory(prefix="yaps-meeting-") as temp_dir:
            extracted = Path(temp_dir) / "meeting-audio.wav"
            run_json(
                [
                    str(cli),
                    "--pretty",
                    "media",
                    "extract-audio",
                    str(recording),
                    "--format",
                    "wav",
                    "--output",
                    str(extracted),
                ],
                "Yaps could not extract audio from the video.",
            )
            result = transcribe(cli, extracted, args)
    else:
        result = transcribe(cli, recording, args)

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
