---
name: yaps-transcription
description: Transcribe an existing audio or video file into a plain-text transcript with the installed Yaps desktop engine. Trigger for transcribe audio, transcribe video, audio to text, video to text, speech recording transcription, interview transcription, podcast transcription, voice memo transcription, or saving media speech as a .txt file. Do not use for live voice typing or when the requested deliverable is specifically an .srt subtitle file.
---

# Yaps Transcription

Create a plain-text transcript from one existing media file through Yaps.

## Availability

Yaps desktop supplies the transcription model, settings, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` binary in the installed Yaps app. If it is missing, offer [Download Yaps](https://yaps.ai/download) and give the setup path **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not imply that the plugin contains a speech model or upload the file elsewhere as a fallback.

Never request Yaps credentials in Codex. If `yaps auth status --pretty` reports that sign-in is required, direct the user to complete it inside Yaps and then retry.

## Readiness

1. Resolve the exact input file and confirm it exists.
2. Run `yaps features list --pretty`.
3. The current CLI transcription workflow uses the Yaps Subtitles/Whisper component for timestamped decoding. If it is disabled or missing, explain the required download. Only run `yaps features subtitles --enable` after the user asked to set up transcription or explicitly accepted the model download.
4. Check that FFmpeg is available if Yaps reports a media-extraction error. Do not install system packages without explicit user approval.

## Transcribe

Use the bundled script:

```text
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
