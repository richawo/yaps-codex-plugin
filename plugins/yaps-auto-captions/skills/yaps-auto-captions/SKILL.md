---
name: yaps-auto-captions
description: Add editable, styled, word-timed captions to a video and export a new burned-in MP4 through the installed Yaps desktop engine. Trigger for add captions to video, auto caption video, caption a video, video subtitle editor, animated captions, TikTok captions, Instagram Reels captions, YouTube Shorts captions, karaoke captions, word-by-word captions, burn subtitles into video, or subtitle a video into a finished file. Do not use when the user only wants a separate .srt subtitle file (use yaps-srt-generator) or a plain-text transcript.
---

# Yaps Video Captions

Turn one video into a finished, captioned MP4 through Yaps. Yaps transcribes speech locally, aligns captions to the spoken words, and burns them into a new video using one of 14 templates. Make corrections by caption ID, never by hand-editing subtitle markup.

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

Yaps 2.0.1 or later supplies the local Whisper model, feature state, account state, caption editor, and FFmpeg checks. Locate `yaps` on `PATH`, or the packaged `yaps_cli` in the installed Yaps app (macOS: `/Applications/Yaps.app/Contents/MacOS/yaps_cli` or the same path under `~/Applications`; Windows: the `yaps_cli.exe` beside the installed `Yaps.exe`). If missing, offer [Download or update Yaps](https://yaps.ai/download). Do not ask the user to install a PATH shim; the packaged CLI works directly. If `yaps captions styles` is unavailable, direct the user to update Yaps before continuing. Do not claim the skill contains its own transcription or rendering engine.

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

1. Confirm that Yaps 2.0.1 or later is installed, then open it. Do not install models or process media first.
2. Run `yaps auth status --pretty`. Require `authenticated: true` and `status: "active"` (an active free trial or Yaps Pro both count). If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. For any other state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
4. Run `yaps features list --pretty`. Find the `auto_captions` feature. If enabling it requires a model download, explain that Auto Captions reuses the same Whisper model as Subtitles and ask once for approval. If the required model is already installed and only the feature toggle is off, enable it automatically without adding an approval step. Verify readiness and resume the original task.
5. Read the `render_dep` block on the `auto_captions` feature. If `ffmpeg_found` is false, explain that FFmpeg is required (macOS: `brew install ffmpeg`, Windows: `winget install Gyan.FFmpeg`); do not install system packages without explicit approval. If `libass_available` is false, the FFmpeg build cannot burn captions and needs reinstalling with libass.
6. Resolve the exact video path and confirm it exists.

## Workflow

1. Run `yaps captions styles --pretty` and use its returned catalogue as authoritative. If the user did not name a style, use `bold-highlight` as the sensible social-video default without adding a preference question. The Yaps 2.0.1 catalogue is:
   - Social and animated: `bold-highlight`, `color-sweep`, `word-karaoke`, `spotlight`, `shout`, `glow`, `marker`, `outline`, `two-tone`, and `typewriter`.
   - Clean and readable: `boxed-subtitle`, `minimal`, `editorial`, and `caption-card`.
2. Create the project: `yaps captions create <video> --style <style>` (use `bold-highlight` when the user explicitly wants the default; add `--max-words <1-12>` only when they request a caption-length override). Report the returned `project_id`, segment count, and duration.
3. Inspect the result with `yaps captions show <project> --full --pretty`. Present caption IDs and wording in a readable list when the user wants to review or correct them. Apply a different template with `yaps captions style <project> --style <style>`.
4. Make corrections, always addressing captions by their `caption-NNN` id:
   - `yaps captions correct <project> --segment caption-003 --text "..."` fixes one caption's wording.
   - `yaps captions replace <project> --find "old" --with "new"` fixes a phrase everywhere; when a replacement is ambiguous, show the user the proposed change first.
   - `yaps captions split <project> --segment caption-003 --at <seconds>` breaks one caption in two. To split after a specific word, read that word's `end` from `yaps captions show <project> --full` and pass it as `--at`.
   - `yaps captions merge <project> --segment caption-003 --direction previous` (or `next`) joins neighbouring captions.
   - `yaps captions reset <project>` rebuilds every caption from the original transcript.
5. Render the finished video: `yaps captions render <project> --output "<name> (Captioned).mp4"`. Never pass `--overwrite` without explicit user confirmation, and never target the source video — Yaps refuses (`output_is_source`).
6. Verify the result with `yaps captions verify <output>` and report the finished file path. If Yaps returns `no_speech`, say so rather than producing an empty success.

Treat the returned JSON as authoritative. Coded failures arrive as `{ "error": ..., "error_code": ... }`; branch on `error_code` (for example `exists`, `no_audio`, `too_long`, `ffmpeg_missing`).

## Boundaries

- For visual previews, fine positioning, font, size, colours, words per caption, bulk correction, or project history, open the Yaps app and go to **Media → Auto Captions**, where the project sits at the top of Recent projects.
- If the user wants a separate `.srt` subtitle file instead of a burned-in video, use Yaps Subtitle Generator.
- If the user only wants the audio track pulled out of the video, use Yaps Video to Audio.
