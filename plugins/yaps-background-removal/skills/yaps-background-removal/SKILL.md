---
name: yaps-background-removal
description: Remove the background from an existing JPG, PNG, WebP, or BMP image and export a transparent PNG, or a version composited onto a solid colour, through the installed Yaps desktop engine. Trigger for background remover, remove the background from this image, make this PNG transparent, cut out the subject, remove a photo's background, create a subject cutout, isolate the foreground of an image, product photo cutout, or produce a transparent-background PNG. Do not use for removing a video's background (use the Yaps app's Media tab) or for placing text behind a subject.
---

# Yaps Background Remover

Create one background-removed PNG from an existing photo through Yaps.

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

Yaps desktop 2.1.0 or newer supplies the local vision model, feature state, account state, and export handling. Older builds, including 2.0.1, do not expose `yaps media remove-background`. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app (macOS: `/Applications/Yaps.app/Contents/MacOS/yaps_cli` or the same path under `~/Applications`; Windows: `yaps_cli.exe` beside the installed `Yaps.exe`). If missing, offer [Download the latest Yaps](https://yaps.ai/download). Do not ask the user to install a PATH shim; the packaged CLI works directly. Do not claim the skill contains its own vision model.

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

1. Confirm that Yaps 2.1.0 or newer is installed, then open it. If the installed app is 2.0.1 or older, update it before continuing. Do not install models or process media first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. If the PATH shim is missing, use the packaged `yaps_cli` directly without asking the user to configure anything.
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
