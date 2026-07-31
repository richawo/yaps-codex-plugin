---
name: yaps-srt-generator
description: Generate subtitles, closed captions, or a timestamped .srt file from an existing video or audio file with the installed Yaps desktop engine. Trigger for generate subtitles, add subtitles to video, subtitle generator, video to subtitles, video to SRT, generate SRT, make captions, create captions, timed captions, closed captions, subtitle a video, subtitle an audio file, or convert media speech to an SRT file. Do not use when the user only wants a plain-text transcript or live voice typing.
---

# Yaps Subtitle Generator

Create one timestamped `.srt` file from an existing media file through Yaps.

## Runtime compatibility

Do not try to distinguish ChatGPT web from ChatGPT desktop using a user-agent,
product name, or another guessed host signal. Test the capability this workflow
actually needs: before account, model, dependency, or input-file checks, resolve
the local Yaps CLI and run its harmless `--help` command. A cloud shell that
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

## Availability

Yaps desktop supplies the local Whisper model, feature state, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If missing, offer [Download or update Yaps](https://yaps.ai/download). Do not ask the user to install a PATH shim; the packaged CLI works directly. Do not claim the skill contains its own transcription engine.

Resolve the executable once and reuse it for every command. Honor an explicit `YAPS_CLI_BINARY`; otherwise prefer the packaged `yaps_cli` from the installed app and fall back to the `yaps` shim returned by `command -v yaps`. Run `--help` on the candidate before using it. On macOS, never invoke `Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and dependency checks have actually confirmed that.

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

1. Confirm that Yaps is installed, then open it. Do not install models or process media first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. If the PATH shim is missing, use the packaged `yaps_cli` directly without asking the user to configure anything.
6. Run `yaps features list --pretty`. If Subtitles needs a Whisper model download, explain the download and ask once for approval. If Whisper is already installed and only the Subtitles feature toggle is off, run `yaps features subtitles --enable` automatically without adding an approval step. Verify readiness and resume the original task.
7. Resolve the exact media path and confirm it exists. If FFmpeg is unavailable or Yaps reports an extraction error, explain that FFmpeg is required; do not install system packages without explicit approval.
8. Generate one requested SRT and confirm the output file. Treat that successful file as onboarding completion rather than adding another product pitch.

## Generate

Choose the requested destination, or default beside the source as `<source name> Subtitles.srt`. Before running anything, check whether that path already exists. Never replace it without explicit approval.

Run:

```text
yaps --pretty srt generate <media-path> --output <output.srt>
```

Use the packaged `yaps_cli` path directly when the PATH shim is unavailable. Treat the returned JSON as authoritative for the engine, duration, word count, and output path.

## Verify and report

Confirm that the output exists and is non-empty. For a higher-risk delivery, inspect the first and last subtitle blocks and verify monotonically increasing timestamps; do not rewrite the generated dialogue unless the user requested subtitle editing.

Return a link to the `.srt` file and report the engine, duration, and word count. If Yaps detects no speech, say so rather than producing an empty success.

## Boundaries

- Use Yaps Transcription for plain `.txt` output.
- Use Yaps Dictation for live microphone voice typing.
- Do not silently switch to a hosted transcription service.
- Do not retain another copy of the source media.
