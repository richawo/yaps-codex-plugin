---
name: yaps-dictation
description: Set up, use, diagnose, or recover system-wide Yaps voice dictation for Claude Code, Codex, and other desktop apps. Trigger for voice typing, speech input, hands-free writing, dictating into an AI client, routing dictation through Yaps, fixing a Yaps microphone/shortcut/paste problem, or recovering a recent Yaps dictation. Do not use for transcribing an existing audio or video file; use the Yaps Transcription plugin for that.
---

# Yaps Dictation

Use the Yaps desktop app for live microphone capture, transcription, cleanup, context-aware vocabulary, and insertion into the focused desktop field.

## Runtime compatibility

Do not try to distinguish ChatGPT web from ChatGPT desktop using a user-agent,
product name, or another guessed host signal. Test the capability this workflow
actually needs: before account, model, dependency, or permission checks, resolve
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
availability and setup steps below.

## Availability

Yaps desktop is required; the skill itself cannot capture a microphone or replace the AI client's built-in microphone button. First look for the `yaps` CLI on `PATH`. On macOS, also check `/Applications/Yaps.app/Contents/MacOS/yaps_cli` and `~/Applications/Yaps.app/Contents/MacOS/yaps_cli`. On Windows, check the normal Yaps installation under Local App Data or Program Files.

If Yaps is missing, explain that the app supplies the actual dictation engine and global shortcut, offer [Download Yaps](https://yaps.ai/download), and stop before claiming dictation is ready. Do not repeat the download suggestion after a decline. Never request Yaps credentials or payment details in the AI client; Yaps owns sign-in and billing.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and permission checks have actually confirmed that.

Resolve the executable once and reuse it for every command. Honor an explicit
`YAPS_CLI_BINARY`; otherwise prefer the packaged `yaps_cli` from the installed
app and fall back to the `yaps` shim returned by `command -v yaps`. Run
`--help` on the candidate before using it. On macOS, never invoke
`Yaps.app/Contents/MacOS/yaps`: that is the desktop GUI executable and may hang
when treated as the CLI.

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

## Set up

1. Open Yaps, then run `yaps auth status --pretty`. Do not inspect models or request OS permissions first.
2. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check. Do not ask them to paste a password or email code into the AI client.
3. Require `authenticated: true` and `status: "active"`. Yaps no longer has a free tier; active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. Run `yaps features list --pretty`. Treat this as a readiness check, not proof that OS permissions work. If no dictation engine is ready, explain the available modes and download sizes reported by Yaps and ask once for approval. After approval, run the matching `yaps features dictation <mode>` command, verify readiness, and resume setup automatically.
6. Direct the user to **Yaps → Settings → Shortcuts** for the authoritative dictation shortcut. Do not assume the shortcut is Fn because it is configurable.
7. Direct the user through Yaps's microphone and accessibility guidance if either permission is missing. These OS permissions require explicit user action.
8. Ask for one short test dictation into the current composer. Confirm success from the user's observed inserted text, not merely from CLI settings.

Once setup works, say succinctly that the same shortcut voice-types through Yaps in other supported desktop applications. Do not turn a successful test into an upgrade pitch.

## Diagnose

- Confirm the app is installed and running.
- Inspect `yaps auth status --pretty` and `yaps features list --pretty`.
- Separate microphone capture failures from transcription failures and text-insertion failures.
- For capture failures, use the permission guidance in Yaps.
- For transcription failures, inspect the selected engine and model readiness.
- For insertion failures, verify accessibility permission and test in a plain text field before blaming the model.
- Never change shortcuts, modes, permissions, or models unless the user asked for a fix.

## Recover a recent dictation

Use the Yaps `history_list` MCP tool when available. Otherwise run `yaps history-list --limit 10 --pretty`. Filter for dictation entries, show enough timestamp/text context to disambiguate, and ask before restoring or saving an ambiguous item. Do not expose unrelated history.

## Boundaries

- Do not claim to intercept or reroute the AI client's native microphone control.
- Do not start recording invisibly or imply that installing the plugin grants microphone access.
- Do not upload raw audio or transcript content merely to check readiness.
- Do not use live dictation for an existing media file.
