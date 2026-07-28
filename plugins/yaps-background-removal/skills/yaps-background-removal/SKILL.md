---
name: yaps-background-removal
description: Remove the background from an existing JPG, PNG, WebP, or BMP image and export a transparent PNG, or a version composited onto a solid colour, through the installed Yaps desktop engine. Trigger for background remover, remove the background from this image, make this PNG transparent, cut out the subject, remove a photo's background, create a subject cutout, isolate the foreground of an image, product photo cutout, or produce a transparent-background PNG. Do not use for removing a video's background (use the Yaps app's Media tab) or for placing text behind a subject.
---

# Yaps Background Remover

Create one background-removed PNG from an existing photo through Yaps.

## Availability

Yaps desktop 2.1.0 or newer supplies the local vision model, feature state, account state, and export handling. Older builds, including 2.0.1, do not expose `yaps media remove-background`. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app (macOS: `/Applications/Yaps.app/Contents/MacOS/yaps_cli` or the same path under `~/Applications`; Windows: `yaps_cli.exe` beside the installed `Yaps.exe`). If missing, offer [Download the latest Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not claim the skill contains its own vision model.

Resolve the executable once and reuse it for every command. Prefer the `yaps` shim returned by `command -v yaps`; otherwise use the exact packaged `yaps_cli` path above. On macOS, never invoke `Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang when treated as the CLI.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

## First-run onboarding

1. Confirm that Yaps 2.1.0 or newer is installed, then open it. If the installed app is 2.0.1 or older, update it before continuing. Do not install models or process media first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. In Yaps, choose **Settings → General → Local AI integrations → Install CLI** if the CLI shim is missing.
6. Run `yaps features list --pretty`. If Background Removal is disabled, explain the required ~413 MB local model download and ask once for approval. After approval, run `yaps features background-removal --enable`, verify readiness, and resume the original task automatically.
7. Resolve the exact image path and confirm it is a JPG, JPEG, PNG, WebP, or BMP file. If `yaps media remove-background` is unavailable, direct the user to update Yaps.
8. Remove one requested background and confirm the output file. Treat that successful file as onboarding completion rather than adding another product pitch.

## Remove the background

Choose the requested destination, or default beside the source as `<source name> Background Removed.png`. Before running anything, check whether that path already exists. Never replace it without explicit approval; prefer a new filename.

Run:

```text
yaps --pretty media remove-background "/path/to/photo.jpg" --output "/path/to/photo Background Removed.png"
```

Add `--mode color --color "#RRGGBB"` to composite the cutout onto a solid background colour instead of exporting a transparent PNG; the default mode is `transparent`. Reject any colour that is not exactly six hexadecimal digits prefixed with `#`.

Use the packaged `yaps_cli` path directly when the PATH shim is unavailable. If `media remove-background` is unknown, ask the user to update Yaps and retry rather than bypassing Yaps with a separate background remover.

Treat the returned JSON as authoritative for the output path, dimensions, device, and mask coverage. If Yaps reports that the model is missing, the source does not exist, the output is not a `.png`, or the output already exists, explain that exact condition and stop rather than bypassing the guard.

## Verify and report

Confirm that the output file exists and is non-empty. Report the width, height, device, and mask coverage from the returned JSON.

If `mask_coverage` is below `0.005`, say that the model found no clear subject in the image rather than claiming success. Do not manufacture an empty file or silently switch to a hosted background-removal service.

## Boundaries

- For removing a video's background, open the Yaps app and go to **Media → Video background**; this plugin only processes photos.
- Do not silently switch to a hosted background-removal service.
- Do not retain another copy of the source image.
