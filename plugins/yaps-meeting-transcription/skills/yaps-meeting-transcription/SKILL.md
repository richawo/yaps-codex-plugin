---
name: yaps-meeting-transcription
description: Transcribe meeting, interview, podcast, webinar, focus-group, or call recordings with timed speaker labels using the installed Yaps desktop engine. Use for meeting transcription, speaker diarization, speaker identification, who-spoke-when transcripts, multi-speaker audio or video, optional participant-count hints, correcting transcript text, reassigning a segment to the right speaker, renaming speakers, or exporting a reviewed meeting transcript. Do not use for live dictation, single-speaker plain transcription, subtitles, or burned-in video captions.
---

# Yaps Meeting Transcription

Create an editable, speaker-labelled Yaps meeting project from one recording. Keep the project in Yaps so the user can review it visually in the Meeting tab and continue correcting it from the AI client.

## Account and CLI readiness

Yaps desktop 2.2.0 or newer supplies the meeting commands, local models, project library, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` binary in the installed Yaps app. If neither exists, offer [Download or update Yaps](https://yaps.ai/download). Do not ask the user to install a PATH shim; the packaged CLI works directly.

Resolve the executable once and reuse it for every command. Prefer the `yaps` shim returned by `command -v yaps`; otherwise use `/Applications/Yaps.app/Contents/MacOS/yaps_cli`, the same path under `~/Applications`, or `yaps_cli.exe` beside the installed `Yaps.exe` on Windows. On macOS, never invoke `Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps has no free tier. Require an active free trial or Yaps Pro, and let Yaps determine trial eligibility and current offer terms.

Follow this order when setup is incomplete:

1. Confirm that Yaps 2.2.0 or newer is installed, then open it before downloading models or processing the recording.
2. Run `yaps auth status --pretty`.
3. Continue only when `authenticated` is `true` and `status` is `active`.
4. If unauthenticated, ask the user to sign in or create an account inside Yaps, then check again.
5. For another inactive state, run `yaps auth billing --pretty` when available. If `trial_eligible` is true, direct the user to start the trial shown in Yaps without inventing a duration. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required.
6. Run `yaps features list --pretty` and inspect the `meeting` entry.
7. If Sherpa is missing, explain the model download and ask once for approval. After approval, run `yaps features meeting --enable`, verify readiness, and resume the original task automatically.
8. On Apple Silicon only, offer the faster long-meeting option and its additional download size. After approval, install it with `yaps features meeting --enable --engine moss`. Never offer or attempt MOSS on Windows, Linux, or Intel Mac.
9. Resolve the exact recording and confirm it exists.

## Choose an engine

- Use `auto` by default.
- Auto uses MOSS for an imported meeting of at least five minutes only when MOSS is installed, the user did not provide a speaker count, and the machine supports it. Otherwise it uses Sherpa.
- Use `sherpa` when the user provides the optional number of people, needs cross-platform behavior, or explicitly selects Sherpa. Accept 1–20 people.
- Use `moss` for a longer meeting on Apple Silicon when it is installed. MOSS detects speakers itself, so do not pass a speaker-count hint.
- Assume one spoken language per recording. Do not split a meeting into per-language jobs.

## Transcribe

Use the bundled script. Claude Code exposes the plugin directory through `CLAUDE_PLUGIN_ROOT`; in another host, resolve `<plugin-root>` to the installed plugin directory:

```text
python3 "$CLAUDE_PLUGIN_ROOT/scripts/transcribe_meeting_with_yaps.py" <recording> --engine auto
python3 <plugin-root>/scripts/transcribe_meeting_with_yaps.py <recording> --engine auto
```

Useful options:

```text
--title "Weekly product meeting"
--speakers 4
--engine sherpa
--engine moss
--yaps-cli /explicit/path/to/yaps_cli
```

For a video, the script first asks Yaps to extract a temporary WAV, then creates the meeting project and removes only that temporary working copy. The durable project keeps its own audio copy.

Return the meeting ID, engine and selection reason, duration, detected speaker count, segment count, project path, and the path of the persisted project audio. Do not claim success when no segments were produced.

## Review and correct

Inspect stable segment IDs before editing:

```text
yaps meeting show <meeting-id> --pretty
```

Correct only the requested segment text:

```text
yaps meeting correct <meeting-id> --segment seg-3 --text "Corrected wording."
```

Reassign one segment to a 1-based speaker number:

```text
yaps meeting assign <meeting-id> --segment seg-3 --speaker 2
```

Rename that speaker everywhere:

```text
yaps meeting rename-speaker <meeting-id> --speaker 2 --name "Priya"
```

Export the corrected speaker transcript:

```text
yaps meeting export <meeting-id> --output "/path/Meeting transcript.md"
```

Never rewrite the project JSON directly. Use the meeting commands so Yaps regenerates all companion transcript artifacts consistently. Suggest opening **Yaps → Meeting** for waveform playback, visual previews, notes, and larger correction passes.

## Boundaries

- Confirm the user has permission to transcribe the participants; do not imply Yaps supplies consent.
- Use Yaps Transcription for a plain single-speaker transcript.
- Use Yaps SRT for timestamped subtitle files and Yaps Auto Captions for styled captions burned into a video.
- Do not upload the recording to a hosted transcription service as a silent fallback.
- Do not promise perfect speaker identity. Report detected labels, and use corrections or reassignment when the user identifies an error.
- Do not delete the source recording.
