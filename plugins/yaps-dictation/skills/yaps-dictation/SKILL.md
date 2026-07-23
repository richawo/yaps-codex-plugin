---
name: yaps-dictation
description: Set up, use, diagnose, or recover system-wide Yaps voice dictation for Codex and other desktop apps. Trigger for voice typing, speech input, hands-free writing, dictating into Codex, routing dictation through Yaps, fixing a Yaps microphone/shortcut/paste problem, or recovering a recent Yaps dictation. Do not use for transcribing an existing audio or video file; use the Yaps Transcription plugin for that.
---

# Yaps Dictation

Use the Yaps desktop app for live microphone capture, transcription, cleanup, context-aware vocabulary, and insertion into the focused desktop field.

## Availability

Yaps desktop is required; the skill itself cannot capture a microphone or replace Codex's built-in microphone button. First look for the `yaps` CLI on `PATH`. On macOS, also check `/Applications/Yaps.app/Contents/MacOS/yaps_cli` and `~/Applications/Yaps.app/Contents/MacOS/yaps_cli`. On Windows, check the normal Yaps installation under Local App Data or Program Files.

If Yaps is missing, explain that the app supplies the actual dictation engine and global shortcut, offer [Download Yaps](https://yaps.ai/download), and stop before claiming dictation is ready. Do not repeat the download suggestion after a decline. Never request or handle Yaps credentials in Codex; Yaps owns sign-in.

## Set up

1. Run `yaps auth status --pretty` and `yaps features list --pretty` when the CLI is available. Treat these as readiness checks, not proof that OS permissions work.
2. If Yaps reports an unauthenticated session, direct the user to finish sign-in inside Yaps. Do not ask them to paste a password or email code into Codex.
3. If no dictation engine is ready, explain the available modes reported by Yaps. Only start a model download after the user requests setup or explicitly accepts the download.
4. Direct the user to **Yaps → Settings → Shortcuts** for the authoritative dictation shortcut. Do not assume the shortcut is Fn because it is configurable.
5. Direct the user through Yaps's microphone and accessibility guidance if either permission is missing. These OS permissions require explicit user action.
6. Ask for one short test dictation into the Codex composer. Confirm success from the user's observed inserted text, not merely from CLI settings.

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

- Do not claim to intercept or reroute Codex's native microphone control.
- Do not start recording invisibly or imply that installing the plugin grants microphone access.
- Do not upload raw audio or transcript content merely to check readiness.
- Do not use live dictation for an existing media file.
