#!/usr/bin/env python3
"""Create a plain-text transcript through the installed Yaps CLI."""

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
        executable = "yaps_cli.exe"
        for key in ("LOCALAPPDATA", "ProgramW6432", "ProgramFiles", "ProgramFiles(x86)"):
            base = os.environ.get(key)
            if not base:
                continue
            root = Path(base)
            candidates.extend(
                [
                    root / "Yaps" / executable,
                    root / "Programs" / "Yaps" / executable,
                ]
            )

    seen: set[Path] = set()
    return [path for path in candidates if not (path in seen or seen.add(path))]


def resolve_cli(explicit: str | None) -> Path:
    for candidate in cli_candidates(explicit):
        if candidate.is_file():
            return candidate
    raise RuntimeError(
        "Yaps CLI was not found. Download Yaps from https://yaps.ai/download, "
        "then use Yaps > Settings > General > Local AI integrations > Install CLI."
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

    cli = resolve_cli(args.yaps_cli)
    with tempfile.TemporaryDirectory(prefix="yaps-transcription-") as temp_dir:
        temporary_srt = Path(temp_dir) / "transcript.srt"
        command = [
            str(cli),
            "--pretty",
            "srt",
            "generate",
            str(media),
            "--output",
            str(temporary_srt),
        ]
        completed = subprocess.run(command, capture_output=True, text=True, check=False)
        if completed.returncode != 0:
            detail = completed.stderr.strip() or completed.stdout.strip()
            raise RuntimeError(detail or "Yaps transcription failed.")
        try:
            result = json.loads(completed.stdout)
        except json.JSONDecodeError as error:
            raise RuntimeError(f"Yaps returned invalid JSON: {error}") from error

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
