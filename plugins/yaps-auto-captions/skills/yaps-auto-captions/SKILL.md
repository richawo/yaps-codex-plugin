---
name: yaps-auto-captions
description: Add editable, styled, word-timed captions to a video and export a new burned-in MP4 through the installed Yaps desktop engine. Trigger for add captions to video, auto caption video, caption a video, video subtitle editor, animated captions, TikTok captions, Instagram Reels captions, YouTube Shorts captions, karaoke captions, word-by-word captions, burn subtitles into video, or subtitle a video into a finished file. Do not use when the user only wants a separate .srt subtitle file (use yaps-srt-generator) or a plain-text transcript.
---

# Yaps Video Captions

Turn one video into a finished, captioned MP4 through Yaps. Yaps transcribes speech locally, aligns captions to the spoken words, and burns them into a new video using one of 14 templates. Make corrections by caption ID, never by hand-editing subtitle markup.

## Availability

Yaps 2.0.1 or later supplies the local Whisper model, feature state, account state, caption editor, and FFmpeg checks. Locate `yaps` on `PATH`, or the packaged `yaps_cli` in the installed Yaps app (macOS: `/Applications/Yaps.app/Contents/MacOS/yaps_cli` or the same path under `~/Applications`; Windows: the `yaps_cli.exe` beside the installed `Yaps.exe`). If missing, offer [Download Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**. If `yaps captions styles` is unavailable, direct the user to update Yaps before continuing. Do not claim the skill contains its own transcription or rendering engine.

Resolve the executable once and reuse it for every command. Prefer the `yaps` shim returned by `command -v yaps`; otherwise use the exact packaged `yaps_cli` path above. On macOS, never invoke `Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

## First-run onboarding

1. Confirm that Yaps 2.0.1 or later is installed, then open it. Do not install models or process media first.
2. Run `yaps auth status --pretty`. Require `authenticated: true` and `status: "active"` (an active free trial or Yaps Pro both count). If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. For any other state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
4. Run `yaps features list --pretty`. Find the `auto_captions` feature. If it is not installed, explain that Auto Captions reuses the same Whisper model as Subtitles and ask once for approval. After approval, run `yaps features auto-captions --enable`, verify readiness, and resume the original task automatically.
5. Read the `render_dep` block on the `auto_captions` feature. If `ffmpeg_found` is false, explain that FFmpeg is required (macOS: `brew install ffmpeg`, Windows: `winget install Gyan.FFmpeg`); do not install system packages without explicit approval. If `libass_available` is false, the FFmpeg build cannot burn captions and needs reinstalling with libass.
6. Resolve the exact video path and confirm it exists.

## Workflow

1. Run `yaps captions styles --pretty` and use its returned catalogue as authoritative. If the user did not name a style, briefly recommend a suitable one and confirm before creating the project. The Yaps 2.0.1 catalogue is:
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
