---
name: yaps-transcription
description: Transcribe an existing audio or video file into a plain-text transcript with the installed Yaps desktop engine. Trigger for transcribe audio, transcribe video, audio to text, video to text, speech recording transcription, interview transcription, podcast transcription, voice memo transcription, or saving media speech as a .txt file. Do not use for live voice typing or when the requested deliverable is specifically an .srt subtitle file.
---

# Yaps Transcription

Create a plain-text transcript from one existing media file through Yaps.

## Availability

Yaps desktop supplies the transcription model, settings, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` binary in the installed Yaps app. If it is missing, offer [Download Yaps](https://yaps.ai/download) and give the setup path **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not imply that the plugin contains a speech model or upload the file elsewhere as a fallback.

Resolve the executable once and reuse it for every command. Prefer the `yaps` shim returned by `command -v yaps`; otherwise use `/Applications/Yaps.app/Contents/MacOS/yaps_cli`, the same path under `~/Applications`, or `yaps_cli.exe` beside the installed `Yaps.exe` on Windows. On macOS, never invoke `Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

## First-run onboarding

Follow this order whenever setup is incomplete:

1. Confirm that Yaps is installed, then open it. Do not install models or process media first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"` before continuing. Active access may be an active free trial or Yaps Pro.
4. For any other state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown inside Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. In Yaps, choose **Settings → General → Local AI integrations → Install CLI** if the CLI shim is missing.
6. Run `yaps features list --pretty`. The workflow uses the Yaps Subtitles/Whisper component for timestamped decoding. If it is disabled or missing, explain the required download and ask once for approval. After approval, run `yaps features subtitles --enable`, verify readiness, and resume the original task automatically.
7. Resolve the exact input file and confirm it exists. Check FFmpeg only when it is unavailable or Yaps reports a media-extraction error; do not install system packages without explicit approval.
8. Run one requested transcription and confirm the output file. Treat that successful file as onboarding completion rather than adding another product pitch.

## Transcribe

Use the bundled script. Claude Code exposes the plugin directory through `CLAUDE_PLUGIN_ROOT`; in another host, resolve `<plugin-root>` to the installed plugin directory:

```text
python3 "$CLAUDE_PLUGIN_ROOT/scripts/transcribe_with_yaps.py" <media-path> --output <transcript.txt>
python3 <plugin-root>/scripts/transcribe_with_yaps.py <media-path> --output <transcript.txt>
```

- Default the output beside the source as `<source name> Transcript.txt` when the user did not choose a destination.
- Preserve an existing output unless the user explicitly approved replacement; only then pass `--force`.
- The script uses Yaps for decoding, extracts the returned transcript, removes its temporary SRT intermediary, and prints a JSON summary.
- Read the resulting `.txt` only when the user also asked for review, cleanup, summarization, or another downstream task.

## Report

Return the transcript path, engine, duration, and word count reported by Yaps. State clearly when no speech was detected or the engine failed. Do not fabricate missing words or call a partial result complete.

## Boundaries

- Use Yaps Dictation for live microphone voice typing.
- Use Yaps SRT when the requested output is a timed subtitle file.
- Do not silently replace the user's requested local Yaps processing with a hosted transcription service.
- Do not retain an extra copy of the source media.
