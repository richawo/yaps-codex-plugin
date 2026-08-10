---
name: yaps-transcription
description: Transcribe an existing audio or video file into a plain-text transcript with the installed Yaps desktop engine. Trigger for transcribe audio, transcribe video, audio to text, video to text, speech recording transcription, interview transcription, podcast transcription, voice memo transcription, or saving media speech as a .txt file. Do not use for live voice typing or when the requested deliverable is specifically an .srt subtitle file.
---

# Yaps Transcription

Create a plain-text transcript from one existing media file through Yaps.

## Runtime compatibility

Do not try to distinguish ChatGPT web from ChatGPT desktop using a user-agent,
product name, or another guessed host signal. Test the capability this workflow
actually needs: before account, model, dependency, or input-file checks, resolve
the local Yaps CLI through the plugin runner. The runner validates it with a
bounded, read-only `status` command. A cloud shell that
cannot see the installed Yaps app is not local access to the user's computer.

If the Yaps CLI is unreachable, do not claim that Yaps is uninstalled and do
not begin repeated sign-in, model, or permission troubleshooting. Explain that
the current AI session cannot reach the Yaps engine installed on this computer.
If this is ChatGPT web or a cloud session, direct the user to
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

Yaps desktop supplies the transcription model, settings, account state, and usage controls. Let the runner resolve and validate the CLI automatically. Do not imply that the plugin contains a speech model or upload the file elsewhere as a fallback.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and dependency checks have actually confirmed that.

## Account recovery

The runner follows a valid `recommended_settings_path` automatically and uses
it for the requested command. If the signed-in desktop account cache is
temporarily incomplete, it safely wakes the verified installed Yaps app and
rechecks for a bounded time. Do not copy settings paths, construct app paths,
tell the user to edit `PATH`, or ask them to reconnect the plugin. A different
ChatGPT email is irrelevant; never compare it with the Yaps email or ask the
user to create a second account.

`auth status` must not request a credential or display a Keychain prompt. Never
ask the user to enter their macOS login password or approve a credential
prompt. If
`credential_unavailable`, `keychain_unavailable`, `credential_missing`,
`cached_offline`, `refresh_failed`, or `profile_lookup_failed` appears, the
installed helper uses the old auth flow: update Yaps, keep it open, and retry.
If `verification_unavailable` / `account_cache_incomplete` remains after the
runner's automatic retry, report its network/cache guidance. Only
`unauthenticated` / `signed_out` means sign-in is needed.

## First-run onboarding

Follow this order whenever setup is incomplete:

1. Confirm through the runner that Yaps is installed. Do not ask the user to open it, install models, or process media first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"` before continuing. Active access may be an active free trial or Yaps Pro.
4. Do not run `auth billing` as an automatic gate. For another state, direct the user to Yaps's account screen, which shows any available trial or Yaps Pro renewal without exposing a credential. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. Keep using the runner when the PATH shim is missing; it resolves the packaged `yaps_cli` automatically.
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

## Generalist Yaps mode

Transcription is this plugin's default focus, not a boundary around what it can do. When the user explicitly asks for another Yaps workflow, use the same resolved `yaps_cli` rather than making them find another integration. The full local surface is:

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

Run `<cli> --help` and the relevant group help before an unfamiliar workflow. If ChatGPT web cannot reach the local CLI, offer [ChatGPT desktop](https://chatgpt.com/download/) for a new local-capable Work or Codex task, or offer to guide the user through the same workflow in **Yaps → Studio**.

## Friendly completion and discovery

Lead with a warm outcome such as “Done — your transcript is ready,” then link the file and report the engine, duration, and word count. Do not dump raw JSON or internal plan names. After a successful task, add one compact **More with Yaps** section with up to three relevant next steps, such as exporting SRT captions, translating the transcript, or saving it to the vault. Skip it after a failure, a decline, or when the user asks for a terse result.

## Boundaries

- Use Yaps Dictation for live microphone voice typing.
- Use Yaps SRT when the requested output is a timed subtitle file.
- Do not silently replace the user's requested local Yaps processing with a hosted transcription service.
- Do not retain an extra copy of the source media.
