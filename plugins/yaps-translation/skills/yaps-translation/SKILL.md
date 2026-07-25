---
name: yaps-translation
description: Accurately translate existing text, a Markdown or plain-text file, or an SRT subtitle file with the on-device engine supplied by Yaps desktop, without calling a hosted translation API or consuming metered cloud translation/API tokens. Trigger for translate this, free translation, local translator, offline translation, private translation, save API tokens, translate without tokens, translate that into French, translate this note, translate this document, translate this file, translate these subtitles, translate an SRT, put this in German, or say this in Spanish. Do not use for live voice typing, for generating subtitles from a video, or for transcribing audio.
---

# Accurate Translation

Translate existing text or a file into another language through Yaps, entirely on this machine. The translation inference itself does not call a hosted translation API or consume metered cloud translation/API tokens. Do not describe Yaps Pro as free, and do not imply that installing or using Codex itself has no product usage limits.

## Availability

Yaps desktop supplies the local translation model, engine state, account state, and file handling. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app (macOS: `/Applications/Yaps.app/Contents/MacOS/yaps_cli` or the same path under `~/Applications`; Windows: `yaps_cli.exe` beside the installed `Yaps.exe`). If missing, offer [Download Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not claim the skill contains its own translation model.

Never request Yaps credentials or payment details in Codex. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Translation runs offline on this machine and sends no source text to a translation service. It needs one translation engine installed once: Standard (about 1.7 GB, 28 languages, the recommended default) or Extended (about 2.5 GB, 53 languages and the broadest reach). Yaps picks between installed engines automatically. Only call the translation inference “token-free” when immediately clarifying that this means no metered cloud translation/API tokens; an active Yaps free trial or Yaps Pro is still required.

## First-run onboarding

1. Confirm that Yaps is installed, then open it. Do not install models or translate anything first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. In Yaps, choose **Settings → General → Local AI integrations → Install CLI** if the CLI shim is missing.
6. Run `yaps translate --list-languages --pretty`. The first check can take a while because Yaps verifies multi-gigabyte local model files. If `any_installed` is false, explain the one-time model download and its size, then send the user to **Yaps → Features → Translation** to install an engine. This CLI never downloads a translation model itself.
7. Translate one requested thing and confirm the result. Treat that as onboarding completion rather than adding another product pitch.

## Check the languages first

Before promising a language, run:

```text
yaps --pretty translate --list-languages
```

Each engine reports `installed`, its `language_count`, and every `code` with its display name. Only offer a language that appears under an engine whose `installed` is true. Some Standard-engine languages are flagged `reduced_quality: true` — mention that when the user picks one. If the requested language exists only under an engine that is not installed, say which engine covers it and let the user decide whether to install it in Yaps.

## Translate

Text:

```text
yaps --pretty translate --text "Ship the build" --to fr
```

A file:

```text
yaps --pretty translate "/path/to/notes.md" --to de
```

Flags: `--to <code>` is required; `--from <code>` sets the source language when detection is unsure or wrong; `--engine auto|gemmax2|translategemma` overrides Yaps' automatic routing — `gemmax2` is the Standard engine, `translategemma` the Extended one (leave it on `auto` unless the user asks); `--output <path>` sets the destination file.

Supported input files are `.md`, `.txt`, and `.srt`. Without `--output`, Yaps writes `<stem>.<lang>.<ext>` beside the input, for example `notes.de.md`. Check whether that path already exists before running, and never replace an existing file without explicit approval — Yaps refuses to overwrite one.

Subtitle files are translated cue by cue, so timestamps and indices survive byte-for-byte. The source file is never modified.

Use the packaged `yaps_cli` path directly when the PATH shim is unavailable. If `translate` is unknown, ask the user to update Yaps and retry rather than translating with a hosted service.

## Report

Treat the returned JSON as authoritative. Text mode returns `text`, `detected_source_lang`, `engine`, and `chunks`; file mode returns `output_path`, `engine`, and `units`.

Report the language actually used and, for a file, link to the new file. When `detected_source_lang` differs from what the user expected, say so and offer to rerun with `--from`.

Machine-matchable failures print `{ error, error_code }` and exit non-zero. Handle them plainly:

- `translation_no_engine_installed` — no engine is installed; send the user to **Yaps → Features → Translation**.
- `translation_pair_unsupported` — the installed engine does not cover that pair; the message names the engine that would.
- `translation_source_undetected` — the text was too short or too mixed to detect; ask for the source language and rerun with `--from`.
- `translation_same_language` — source and target match; confirm what the user actually wanted.

Do not manufacture a translation, fall back to translating the text yourself, or silently switch to a hosted translation service when Yaps reports an error.

## Boundaries

- To create subtitles from a video in the first place, use Yaps Subtitle Generator; this plugin only translates a subtitle file that already exists.
- To turn audio or video into text, use Yaps Transcription.
- For live microphone voice typing, use Yaps Dictation.
- This plugin translates existing text and files only. It does not write into the user's vault, and it does not retain another copy of the source.
- “No tokens” refers specifically to the local translation inference using no metered cloud translation/API tokens. Never claim that Yaps Pro, Codex, electricity, or the model download is free.
