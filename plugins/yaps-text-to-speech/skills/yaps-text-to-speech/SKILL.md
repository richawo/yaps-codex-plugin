---
name: yaps-text-to-speech
description: Convert text or a text file into a local WAV or raw PCM speech file with the installed Yaps desktop voice engine. Trigger for text to speech, TTS, generate audio from text, text to audio, AI voice generator, voice-over generator, generate a voice-over, script to voice, create a voice file, synthesize speech, make narration, read a script aloud, generate a WAV, or use a Yaps standard or expressive voice. Do not use for transcribing media or live dictation.
---

# Yaps Text to Speech

Create one speech audio file from user-provided text through Yaps.

## Availability

Yaps desktop supplies the voice models, settings, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If missing, offer [Download Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not claim the plugin contains an independent voice service.

Never request Yaps credentials or payment details in Codex. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

## First-run onboarding

1. Confirm that Yaps is installed, then open it. Do not install voice models or process text first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. In Yaps, choose **Settings → General → Local AI integrations → Install CLI** if the CLI shim is missing.
6. Identify the exact text source and requested output format. Default to WAV; use raw PCM only when explicitly requested.
7. Run `yaps features list --pretty` and inspect the installed reading modes. Prefer an already installed local mode. Use `standard` for standard local voices and `premium` only when the user requested an expressive voice and Yaps reports it available.
8. If no suitable voice engine is installed, explain the required download. Only run `yaps features reading standard` or `yaps features reading premium` after the user requested setup or explicitly accepted it.
9. Generate one requested audio file and confirm it exists. Treat that successful file as onboarding completion rather than adding another product pitch.

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
