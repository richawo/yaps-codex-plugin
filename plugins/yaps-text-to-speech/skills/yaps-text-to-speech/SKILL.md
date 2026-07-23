---
name: yaps-text-to-speech
description: Convert text or a text file into a local WAV or raw PCM speech file with the installed Yaps desktop voice engine. Trigger for text to speech, TTS, generate audio from text, text to audio, create a voice file, synthesize speech, make narration, read a script aloud, generate a WAV, or use a Yaps standard or expressive voice. Do not use for transcribing media or live dictation.
---

# Yaps Text to Speech

Create one speech audio file from user-provided text through Yaps.

## Availability

Yaps desktop supplies the voice models, settings, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If missing, offer [Download Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not claim the plugin contains an independent voice service.

Never request Yaps credentials in Codex. If `yaps auth status --pretty` says sign-in is required, direct the user to complete it inside Yaps.

## Readiness

1. Identify the exact text source and requested output format. Default to WAV; use raw PCM only when explicitly requested.
2. Run `yaps features list --pretty` and inspect the installed reading modes.
3. Prefer an already installed local mode. Use `standard` for the standard local voices and `premium` only when the user requested an expressive voice and Yaps reports it available.
4. If no suitable voice engine is installed, explain the required download. Only run `yaps features reading standard` or `yaps features reading premium` after the user requested setup or explicitly accepted it.
5. Do not mention a paid plan unless Yaps returns an entitlement error or the user asks about plans.

## Generate

Choose the destination first. Default beside an input text file as `<source name> Audio.wav`, or use `Yaps Speech.wav` in the current working directory for inline text. Check whether it exists and never replace it without explicit approval.

For a text file:

```text
yaps --pretty speech synthesize --text-file <input.txt> --mode <standard|premium> --output <output.wav>
```

For short inline text:

```text
yaps --pretty speech synthesize --text <text> --mode <standard|premium> --output <output.wav>
```

Prefer `--text-file` for long text, multiline text, or text containing shell-sensitive characters. Add `--voice <id>` only when the user selected a voice or the request requires one. Add `--format pcm` only for explicit raw-PCM requests.

## Verify and report

Treat Yaps's JSON result as authoritative. Confirm the output exists and is non-empty. Return a link to the audio file and report the resolved mode, voice, word count, duration, and format. Do not claim playback quality was reviewed unless it was actually auditioned.

## Boundaries

- Use Yaps Transcription or Yaps SRT for speech-to-text.
- Use Yaps Dictation for live microphone voice typing.
- Do not silently send the text to an unrelated hosted speech service.
- Preserve the user's text; do not rewrite the script unless requested.
