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
local Yaps CLI and run its harmless `--help` command. A cloud shell that cannot
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

## Availability

Yaps desktop supplies the media workflow, account state, and local CLI. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If it is missing, offer [Download or update Yaps](https://yaps.ai/download). Do not ask the user to install a PATH shim; the packaged CLI works directly.

Resolve the executable once and reuse it for every command. Honor an explicit `YAPS_CLI_BINARY`; otherwise prefer the packaged `yaps_cli` from the installed app and fall back to the `yaps` shim returned by `command -v yaps`. Run `--help` on the candidate before using it. On macOS, never invoke `Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the dependency checks have actually confirmed that.

## Account recovery

If `auth status` is not active and returns `recommended_settings_path`, rerun
it with `--settings-path "<recommended_settings_path>"`. When that succeeds,
use the same option for every later Yaps command and resume automatically. A
different ChatGPT email is irrelevant; never compare it with the Yaps email or
ask the user to create a second account.

Handle diagnostics before calling the user signed out. For
`credential_unavailable` / `keychain_unavailable`, keep Yaps open, approve the
system credential prompt (on macOS choose **Always Allow** in Keychain), and
retry. For `credential_missing`, reopen Yaps; only if it remains stuck, sign out
and back in inside Yaps. For `cached_offline`, `verification_unavailable`,
`refresh_failed`, or `profile_lookup_failed`, check connectivity and retry
without changing accounts. Only `unauthenticated` / `signed_out` means sign-in
is needed. If an older CLI lacks these fields while Yaps visibly shows a
signed-in account, update Yaps and retry first.

## First-run onboarding

1. Confirm that Yaps is installed, then open it before processing media.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
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

## Boundaries

- Use Yaps Transcription for plain-text speech transcription.
- Use Yaps Subtitle Generator for timed SRT captions.
- Use Yaps Text to Speech when the source is text rather than video.
- Do not retain another copy of the source video.
