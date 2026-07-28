---
name: yaps-audio-cleaner
description: Remove background noise, hiss, static, room noise, and other distractions from an existing speech recording through the installed Yaps desktop audio-cleaning engines. Trigger for remove background noise from audio, clean audio, denoise audio, enhance a voice recording, remove hiss or static, improve podcast audio, clean an interview, speech enhancement, voice cleaner, or audio restoration. Do not use for separating music stems or editing the spoken words.
---

# Yaps Audio Cleaner

Create a new cleaned WAV from one existing audio file through Yaps. Keep the
source untouched and let the user compare attempts when the best result is
subjective.

## Availability and account access

Yaps desktop 2.2.0 or newer supplies the audio-cleaning commands and local
engines. Locate `yaps` on `PATH`, or the packaged `yaps_cli` in the installed Yaps app
(macOS: `/Applications/Yaps.app/Contents/MacOS/yaps_cli` or the same path under
`~/Applications`; Windows: `yaps_cli.exe` beside the installed `Yaps.exe`). If
missing, offer [Download Yaps](https://yaps.ai/download), then direct the user
to **Yaps → Settings → General → Local AI integrations → Install CLI**.

Resolve the executable once and reuse it for every command. Prefer the `yaps`
shim returned by `command -v yaps`; otherwise use the exact packaged
`yaps_cli` path above. On macOS, never invoke
`Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang
when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier.
An active free trial or Yaps Pro subscription is required, and only Yaps
may confirm trial eligibility or the current offer.

## First-run onboarding

1. Confirm that Yaps 2.2.0 or newer is installed and that
   `yaps audio clean --help` is available. If not, ask the user to update Yaps;
   do not claim this plugin carries its own cleaning engine.
2. Open Yaps before processing. Run `yaps auth status --pretty` and require
   `authenticated: true` with `status: "active"`. An active trial and Yaps Pro
   both count.
3. If unauthenticated, direct the user to sign in or create an account inside
   Yaps, then rerun the check. For another inactive state, inspect
   `yaps auth billing --pretty`. If `trial_eligible` is true, direct the user to
   the trial shown in Yaps without inventing its length or terms; otherwise
   direct them to activate or renew Yaps Pro. Stop until status is active.
4. Run `yaps features list --pretty` and find `audio_cleaner`. If it is not
   installed, explain the download and ask once for approval. After approval,
   run `yaps features audio-cleaner --enable`, verify readiness, and resume the
   original task automatically. If Yaps reports that the runtime is not
   included, the installed app must be updated.
5. Resolve the exact input path and confirm it exists. Supported formats include
   WAV, MP3, M4A, AAC, FLAC, OGG, OPUS, WMA, AIFF, and other formats FFmpeg can
   decode.

## Choosing quality

- Use `recommended` by default. It is the blind-test winner overall and is the
  normal choice even for long files when the user prioritises quality.
- Use `quick` when the user asks for speed, wants a test pass, or explicitly
  prefers a faster first attempt on a long file. Afterward, offer to keep that
  result and create a Recommended version too.
- Use `maximum` for the hardest noise or when the user explicitly values
  accuracy over processing time. Set expectations that it can take several
  times the recording duration.

Do not silently choose Quick solely because a file is long.

## Workflow

1. State the selected quality and why in one sentence.
2. Run:

   `yaps audio clean "<input>" --quality recommended --output "<output>.wav" --pretty`

   Substitute `quick` or `maximum` as selected. Omit `--output` to let Yaps
   create a safe name beside the source.
3. Never add `--overwrite` unless the user explicitly approves replacing the
   exact existing output. Yaps always refuses to target the source itself.
4. Treat returned JSON as authoritative. Report `output_path`, selected mode,
   recording duration, processing time, and output size.
5. If Quick was used, ask whether the user wants a Recommended attempt too.
   Keep both files so they can compare by ear.
6. For listening comparison or more attempts, direct the user to
   **Yaps → Media → Audio Cleaner**.

## Boundaries

- Audio quality is subjective. Do not declare an attempt perfect without the
  user listening to it.
- Do not upload the source to a web service. The Yaps engines run locally.
- Do not promise removal of every sound; severe noise can leave artifacts.
- This feature enhances speech. It is not a music stem separator, voice
  changer, transcript editor, or video captioning tool.
