---
name: yaps-text-to-speech
description: Convert text or a text file into a local WAV or raw PCM speech file with the installed Yaps desktop voice engine. Trigger for text to speech, TTS, generate audio from text, text to audio, AI voice generator, voice-over generator, generate a voice-over, script to voice, create a voice file, synthesize speech, make narration, read a script aloud, generate a WAV, speak German or Spanish or other non-English text, or use a Yaps Kokoro, Chatterbox, or Supertonic voice. Do not use for transcribing media or live dictation.
---

# Yaps Text to Speech

Create one speech audio file from user-provided text through Yaps.

## Availability

Yaps desktop supplies the voice models, settings, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If missing, offer [Download or update Yaps](https://yaps.ai/download). Do not ask the user to install a PATH shim; the packaged CLI works directly. Do not claim the plugin contains an independent voice service.

Resolve the executable once and reuse it for every command. Prefer the `yaps` shim returned by `command -v yaps`; otherwise use `/Applications/Yaps.app/Contents/MacOS/yaps_cli`, the same path under `~/Applications`, or `yaps_cli.exe` beside the installed `Yaps.exe` on Windows. On macOS, never invoke `Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and dependency checks have actually confirmed that.

Three local voice engines exist: `kokoro` (about 338 MB, English), `chatterbox` (about 2.8 GB, expressive English with voice cloning, Apple Silicon Macs only), and `supertonic` (about 145 MB, 24 languages). Any combination of them can be installed at once and installing one never removes another, so treat them as a set the user adds to rather than a single slot they swap. Older Yaps builds name the same three modes `standard`, `premium`, and `multilingual`; those older words are still accepted everywhere, so a command written either way works.

## First-run onboarding

1. Confirm that Yaps is installed, then open it. Do not install voice models or process text first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. If the PATH shim is missing, use the packaged `yaps_cli` directly without asking the user to configure anything.
6. Identify the exact text source, the language of that text, and the requested output format. Default to WAV; use raw PCM only when explicitly requested.
7. Run `yaps features list --pretty` and read the `reading` feature's modes. Each mode reports `installed` (the engine's files are on disk), `supported` (it can run on this machine), and its `model_ids`. Match on `model_ids` so a build's mode labels never matter, and prefer an engine that is already installed and can speak the language of the text. For ordinary English with no requested style or voice, use installed Kokoro automatically; use Chatterbox only for an expressive or cloned-voice request. Do not turn a normal synthesis request into an engine-choice question.
8. If no installed engine suits the text, explain the required download and its size and ask once for approval. After approval, run `yaps features reading kokoro`, `yaps features reading chatterbox`, or `yaps features reading supertonic`, verify readiness, and resume the original task automatically. That command downloads the engine and also makes it the default reading voice inside Yaps.
9. Generate one requested audio file and confirm it exists. Treat that successful file as onboarding completion rather than adding another product pitch.

## Choose the engine for the language

Match the engine to the language of the text, never to whichever engine happens to be installed.

- Non-English text: `supertonic`. It is the only engine with a multilingual pronunciation front-end, covering Bulgarian, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Hungarian, Italian, Latvian, Lithuanian, Polish, Portuguese, Romanian, Russian, Slovak, Slovenian, Spanish, Swedish, and Ukrainian.
- English text: `kokoro`, or `chatterbox` when the user asked for an expressive or cloned voice and that mode reports `supported: true`. Chatterbox runs only on Apple Silicon Macs, so on an Intel Mac or on Windows, Kokoro is the English engine.

Kokoro and Chatterbox are English-only, and they fail quietly instead of loudly: Kokoro deletes the characters its English pronunciation rules cannot map and then reads what is left fluently, so "mañana" is spoken as a confident "maana" and Cyrillic or Greek text comes out as near-silence. A wrong-language read sounds correct to anyone not listening closely, which is exactly why it must not be guessed at.

Maltese has no engine at all. Say so rather than substituting one, and do the same for any other language absent from the Supertonic list above.

## Generate

Choose the destination first. Default beside an input text file as `<source name> Audio.wav`, or use `Yaps Speech.wav` in the current working directory for inline text. Check whether it exists and never replace it without explicit approval.

For a text file:

```text
yaps --pretty speech synthesize --text-file <input.txt> --mode <kokoro|chatterbox|supertonic> --output <output.wav>
```

For short inline text:

```text
yaps --pretty speech synthesize --text <text> --mode <kokoro|chatterbox|supertonic> --output <output.wav>
```

Prefer `--text-file` for long text, multiline text, or text containing shell-sensitive characters. `--mode` applies to that one run and does not change the user's default reading voice, so pass it explicitly rather than switching the app default to synthesize once. Add `--voice <id>` only when the user selected a voice or the request requires one; voice ids belong to a single engine, so never carry one across a `--mode` change. Add `--format pcm` only for explicit raw-PCM requests.

## Verify and report

Treat Yaps's JSON result as authoritative. Confirm the output exists and is non-empty. Return a link to the audio file and report the resolved mode, voice, word count, duration, and format. Do not claim playback quality was reviewed unless it was actually auditioned.

If synthesis fails with an engine that `features list` reports as `installed`, report it as a failure to start or load that engine and offer to retry or use another installed engine. Do not describe it as not installed; that sends the user to re-download files they already have.

## Boundaries

- Use Yaps Transcription or Yaps SRT for speech-to-text.
- Use Yaps Dictation for live microphone voice typing.
- Do not silently send the text to an unrelated hosted speech service.
- Preserve the user's text; do not rewrite the script unless requested.
