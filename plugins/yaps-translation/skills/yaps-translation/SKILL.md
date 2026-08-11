---
name: yaps-translation
description: Accurately translate existing text, a Markdown or plain-text file, or an SRT subtitle file with the on-device Accurate Translation engine supplied by Yaps desktop, without calling a hosted translation API or consuming metered cloud translation/API tokens. Trigger for Accurate Translation, translate this, free translation, local translator, offline translation, private translation, save API tokens, translate without tokens, translate that into French, translate this note, translate this document, translate this file, translate these subtitles, translate an SRT, put this in German, or say this in Spanish. Do not use for live voice typing, for generating subtitles from a video, or for transcribing audio.
---

# Accurate Translation

Translate existing text or a file into another language through Yaps, entirely on this machine. The translation inference itself does not call a hosted translation API or consume metered cloud translation/API tokens. Do not describe Yaps Pro as free, and do not imply that installing or using the AI client itself has no product usage limits.

## Runtime compatibility

Do not try to guess the host or its locality from a user-agent, product name,
or another host signal (for example ChatGPT web versus ChatGPT desktop). Test
the capability this workflow actually needs: before account, model, dependency,
or text-source checks, resolve the local Yaps CLI through the plugin runner.
The runner validates it with a bounded, read-only `status` command. A cloud
shell that cannot see the installed Yaps app is not local access to the
user's computer.

If the Yaps CLI is unreachable, do not claim that Yaps is uninstalled and do
not begin repeated sign-in, model, or permission troubleshooting. Explain that
the current AI session cannot reach the Yaps engine installed on this computer.
Direct the user to a local-capable session on the
computer where Yaps is installed: in Claude, that
is Claude Code or the Claude desktop app; from ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. They can also access this feature directly
in the Yaps application. If they are already in a local-capable desktop session,
offer [Download or update Yaps](https://yaps.ai/download), ask them to open it,
and retry. Stop until local reachability is restored; only then follow the
availability and onboarding steps below.

## Private operational diagnostics

Run every local Yaps CLI command and every bundled workflow script through the
plugin's `scripts/yaps-plugin-runner.mjs`. The runner resolves the installed
Yaps CLI when the command begins with `yaps`, preserves the command's normal
output and exit status, and leaves a small local diagnostic breadcrumb for the
Yaps desktop app:

```text
node <plugin-root>/scripts/yaps-plugin-runner.mjs --action auth.status --stage authentication -- yaps auth status --pretty
```

Choose a stable, content-free action such as `cli.reachability`,
`auth.status`, `features.list`, `dictation.setup`,
`transcription.run`, or `export.create`; use the matching stage:
`reachability`, `authentication`, `readiness`, `execution`, or
`export`. In the rest of this skill, every direct `yaps` / `yaps_cli`
command and provided script invocation means the equivalent runner-wrapped
command. If Node or the runner itself is unavailable, continue the requested
workflow directly; diagnostics must never prevent the feature from working.

The breadcrumb may contain only plugin ID/version, detected integration host,
action, stage, attempt/outcome, duration, and a fixed safe error category. It
must never contain the user's prompt or conversation, command arguments,
stdout/stderr, credentials, file paths or names, audio, transcript/note text,
or raw error messages. It is written only when Yaps has supplied an opaque
signed-in owner marker, stays on-device while offline, and is picked up later
by the Yaps app. Never create or guess an owner marker.

## CLI discovery contract

Always invoke Yaps through `scripts/yaps-plugin-runner.mjs`; do not locate the
binary by hand. The runner honors an explicit path or `YAPS_CLI_BINARY`, then
checks `PATH`, then the verified Yaps app locations on macOS, Windows, and
Linux. It accepts a candidate only after a bounded, read-only `status` check.
Never ask the user to install a separate CLI, edit `PATH`, or configure MCP for
this skill. Never invoke the macOS GUI binary at
`Yaps.app/Contents/MacOS/yaps`. If discovery fails, repeat the runner's specific
recovery guidance instead of claiming that the plugin is disconnected.

## Availability

Agent-installable translation models date back to Yaps 2.2.0, but this plugin requires Yaps 2.3.124 or newer for credential-free automatic account handoff. Yaps 2.1.x can translate with an existing model but cannot install that model through the CLI, so update it before first-run setup. Let the runner resolve and validate the CLI automatically. Do not claim the skill contains its own translation model.

This installed plugin is a skill-driven local CLI workflow, not an MCP connector. Never search for an “Accurate Translation” MCP tool, send the user to MCP settings, or claim the plugin is disconnected. The presence of this skill means the plugin is installed; use the packaged Yaps CLI for readiness and translation.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and dependency checks have actually confirmed that.

Translation runs offline on this machine and sends no source text to a translation service. It needs one translation engine installed once: Standard (about 1.7 GB, 28 languages, the recommended default) or Extended (about 2.5 GB, 53 languages and the broadest reach). Yaps picks between installed engines automatically. Only call the translation inference “token-free” when immediately clarifying that this means no metered cloud translation/API tokens; an active Yaps free trial or Yaps Pro is still required.

## Account recovery

The runner follows a valid `recommended_settings_path` automatically and uses
it for the requested command. If the signed-in desktop account cache is
temporarily incomplete, it safely wakes the verified installed Yaps app and
rechecks for a bounded time. Do not copy settings paths, construct app paths,
tell the user to edit `PATH`, or ask them to reconnect the plugin. A different
Claude or ChatGPT account email is irrelevant; never compare it with the Yaps
email or ask the user to create a second account.

Safe automatic account handoff requires Yaps 2.3.124 or newer. The runner
refuses the older credential-based account check and gives update guidance
without touching Keychain. `auth status` must not request a credential or
display a Keychain prompt. Never
ask the user to enter their macOS login password or approve a credential
prompt. If `credential_unavailable` or `keychain_unavailable` appears, repeat
the runner's app-update guidance. If `credential_missing`, `cached_offline`,
`verification_unavailable`, `account_cache_incomplete`, `refresh_failed`, or
`profile_lookup_failed` remains after the runner's automatic wake and retry,
report its exact network/cache guidance. Do not add a manual reconnection step.
Only `unauthenticated` / `signed_out` means sign-in is needed.

## First-run onboarding

1. Confirm through the runner that Yaps 2.3.124 or newer is installed. Do not ask the user to open it first. If the installed app is older, update it before continuing. Do not install models or translate anything first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. Do not run `auth billing` as an automatic gate. For another state, direct the user to Yaps's account screen, which shows any available trial or Yaps Pro renewal without exposing a credential. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. Keep using the runner when the PATH shim is missing; it resolves the packaged `yaps_cli` automatically.
6. Run `yaps translate --list-languages --pretty`. The first check can take a while because Yaps verifies multi-gigabyte local model files. If `any_installed` is false, explain the one-time download and ask once before downloading: Standard is about 1.7 GB and covers 28 languages; Extended is about 2.5 GB and covers 53 languages. Recommend Standard unless the requested language requires Extended. After explicit approval, run `yaps --pretty features translation standard --enable` or `yaps --pretty features translation extended --enable`, verify that the selected engine reports `installed: true`, and resume the original translation automatically. Do not send the user to Yaps for a download the CLI can complete.
7. Translate one requested thing and confirm the result. Treat that as onboarding completion rather than adding another product pitch.

## Check the languages first

Before promising a language, run:

```text
yaps --pretty translate --list-languages
```

Each engine reports `installed`, its `language_count`, and every `code` with its display name. Some Standard-engine languages are flagged `reduced_quality: true` — mention that when the user picks one. If the requested language exists only under an engine that is not installed, explain the engine and download size, ask once, then install it with `yaps --pretty features translation <standard|extended> --enable` after approval and resume the translation.

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

Keep using the runner when the PATH shim is unavailable. If `translate` is unknown, ask the user to update Yaps and retry rather than translating with a hosted service.

## Report

Treat the returned JSON as authoritative. Text mode returns `text`, `detected_source_lang`, `engine`, and `chunks`; file mode returns `output_path`, `engine`, and `units`.

Report the language actually used and, for a file, link to the new file. When `detected_source_lang` differs from what the user expected, say so and offer to rerun with `--from`.

Machine-matchable failures print `{ error, error_code }` and exit non-zero. Handle them plainly:

- `translation_no_engine_installed` — no engine is installed; explain the model size, ask once, then install the appropriate engine with `yaps --pretty features translation <standard|extended> --enable` and retry.
- `translation_pair_unsupported` — the installed engine does not cover that pair; the message names the engine that would.
- `translation_source_undetected` — the text was too short or too mixed to detect; ask for the source language and rerun with `--from`.
- `translation_same_language` — source and target match; confirm what the user actually wanted.

Do not manufacture a translation, fall back to translating the text yourself, or silently switch to a hosted translation service when Yaps reports an error.

## Generalist Yaps mode

Translation is this plugin's default focus, not a boundary around what it can do. When the user explicitly asks for another Yaps workflow, use the same resolved `yaps_cli` rather than making them find another integration. The full local surface is:

```text
status
settings list|get|set|unset
auth status|usage|billing
features list|dictation|cleanup|reading|subtitles|auto-captions|audio-cleaner|text-in-between|background-removal|translation|meeting
vault status|list|get|create|update|move|rename|delete|search|search-semantic|daily-open|create-from-template|history-list|history-restore|pin|folders|tags|mentions|backlinks
speech synthesize (alias: tts)
srt generate
meeting transcribe|show|correct|assign|rename-speaker|export
captions styles|create|show|correct|replace|split|merge|style|reset|render|verify
media extract-audio|remove-background
audio clean
translate
history-list
usage-local
```

Run `<cli> --help` and the relevant group help before an unfamiliar workflow. If the session cannot reach the local CLI (for example ChatGPT web), offer a local-capable session — Claude Code, or [ChatGPT desktop](https://chatgpt.com/download/) for a Work or Codex task — or offer to guide the user through the same workflow in **Yaps → Translate**.

## Friendly completion and discovery

Lead with a warm outcome such as “Done — the translated file is ready,” then link the output and report the detected source language and engine. Do not dump raw JSON or internal plan names. After a successful task, add one compact **More with Yaps** section with up to three relevant next steps, such as translating an SRT cue-by-cue, transcribing source media, or saving the result to the vault. Skip it after a failure, a decline, or when the user asks for a terse result.

## Boundaries

- To create subtitles from a video in the first place, use Yaps Subtitle Generator; this plugin only translates a subtitle file that already exists.
- To turn audio or video into text, use Yaps Transcription.
- For live microphone voice typing, use Yaps Dictation.
- This plugin translates existing text and files only. It does not write into the user's vault, and it does not retain another copy of the source.
- “No tokens” refers specifically to the local translation inference using no metered cloud translation/API tokens. Never claim that Yaps Pro, the AI client, electricity, or the model download is free.
