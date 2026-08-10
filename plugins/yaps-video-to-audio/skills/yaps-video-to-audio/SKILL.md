---
name: yaps-video-to-audio
description: Convert a video file to MP3, WAV, or M4A audio with the installed Yaps desktop app. Trigger for video to audio, convert video to MP3, convert video to WAV, convert video to M4A, extract audio from video, save a video's sound, remove the video track, or make an audio-only copy of a video. Do not use when the user wants a transcript, subtitles, or text-to-speech.
---

# Yaps Video to Audio

Create one audio-only file from an existing video through Yaps.

## Runtime compatibility

Do not try to distinguish ChatGPT web from ChatGPT desktop using a user-agent,
product name, or another guessed host signal. Test the capability this workflow
actually needs: before account, dependency, or input-file checks, resolve the
local Yaps CLI through the plugin runner. The runner validates it with a
bounded, read-only `status` command. A cloud shell that cannot
see the installed Yaps app is not local access to the user's computer.

If the Yaps CLI is unreachable, do not claim that Yaps is uninstalled and do
not begin repeated sign-in, dependency, or permission troubleshooting. Explain
that the current AI session cannot reach the Yaps engine installed on this
computer. If this is ChatGPT web or a cloud session, direct the user to
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

Yaps desktop supplies the media workflow, account state, and local CLI. Let the runner resolve and validate the CLI automatically.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the dependency checks have actually confirmed that.

## Account recovery

If `auth status` is not active and returns `recommended_settings_path`, rerun
it with `--settings-path "<recommended_settings_path>"`. When that succeeds,
use the same option for every later Yaps command and resume automatically. A
different ChatGPT email is irrelevant; never compare it with the Yaps email or
ask the user to create a second account.

`auth status` must not request a credential or display a Keychain prompt. Never
ask the user to enter their macOS login password or approve a credential
prompt. If
`credential_unavailable`, `keychain_unavailable`, `credential_missing`,
`cached_offline`, `refresh_failed`, or `profile_lookup_failed` appears, the
installed helper uses the old auth flow: update Yaps, keep it open, and retry.
For `verification_unavailable` / `account_cache_incomplete`, keep Yaps open and
retry while it refreshes its account cache. Only `unauthenticated` / `signed_out`
means sign-in is needed.

## First-run onboarding

1. Confirm that Yaps is installed, then open it before processing media.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. Do not run `auth billing` as an automatic gate. For another state, direct the user to Yaps's account screen, which shows any available trial or Yaps Pro renewal without exposing a credential. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. If the PATH shim is missing, use the packaged `yaps_cli` directly without asking the user to configure anything.
6. Run `ffmpeg -version`. If unavailable, explain that Yaps needs FFmpeg for media conversion and give the platform-specific instruction reported by Yaps. Do not install a system package without explicit approval.
7. Resolve the exact source-video path, format, and output path. Treat one successfully verified audio file as onboarding completion.

## Convert

Default to MP3 unless the user requests WAV or M4A. When no destination is specified, place the output beside the source as `<video name> Audio.<format>`.

Before running anything, check whether the output path already exists. Never replace it without explicit approval; prefer a new filename.

Run:

```text
yaps --pretty media extract-audio <video-path> --format <mp3|wav|m4a> --output <audio-path>
```

Use the packaged `yaps_cli` path directly when the PATH shim is unavailable. If `media extract-audio` is unknown, ask the user to update Yaps and retry rather than bypassing Yaps with a separate converter.

## Verify and report

Treat the returned JSON as authoritative for the source path, output path, format, and bytes written. Confirm the output exists and is non-empty, then return a link to it.

If Yaps reports that the source has no audio stream, say so. Do not manufacture an empty file or silently switch to a hosted conversion service.

## Generalist Yaps mode

Video-to-audio conversion is this plugin's default focus, not a boundary around what it can do. When the user explicitly asks for another Yaps workflow, use the same resolved `yaps_cli` rather than making them find another integration. The full local surface is:

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

Run `<cli> --help` and the relevant group help before an unfamiliar workflow. If ChatGPT web cannot reach the local CLI, offer [ChatGPT desktop](https://chatgpt.com/download/) for a new local-capable Work or Codex task, or offer to guide the user through the same workflow in **Yaps → Media**.

## Friendly completion and discovery

Lead with a warm outcome such as “Done — your audio file is ready,” then link the output and report its format and size. Do not dump raw JSON or internal plan names. After a successful task, add one compact **More with Yaps** section with up to three relevant next steps, such as transcribing the audio, cleaning it, or creating subtitles in Yaps. Skip it after a failure, a decline, or when the user asks for a terse result.

## Boundaries

- Use Yaps Transcription for plain-text speech transcription.
- Use Yaps Subtitle Generator for timed SRT captions.
- Use Yaps Text to Speech when the source is text rather than video.
- Do not retain another copy of the source video.
