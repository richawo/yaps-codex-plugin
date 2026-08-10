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
the local Yaps CLI through the plugin runner. The runner validates it with a
bounded, read-only `status` command. A cloud shell that
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

Yaps desktop is required; the skill itself cannot capture a microphone or replace the AI client's built-in microphone button. Let the runner resolve and validate the CLI automatically.

If Yaps is missing, explain that the app supplies the actual dictation engine and global shortcut, offer [Download Yaps](https://yaps.ai/download), and stop before claiming dictation is ready. Do not repeat the download suggestion after a decline. Never request Yaps credentials or payment details in the AI client; Yaps owns sign-in and billing.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and permission checks have actually confirmed that.

## Account recovery

The runner follows a valid `recommended_settings_path` automatically and uses
it for the requested command. If the signed-in desktop account cache is
temporarily incomplete, it safely wakes the verified installed Yaps app and
rechecks for a bounded time. Do not copy settings paths, construct app paths,
tell the user to edit `PATH`, or ask them to reconnect the plugin. A different
ChatGPT email is irrelevant; never compare it with the Yaps email or ask the
user to create a second account.

Safe automatic account handoff requires Yaps 2.3.124 or newer. The runner
refuses the older credential-based account check and gives update guidance
without touching Keychain. `auth status` must not request a credential or
display a Keychain prompt. Never
ask the user to enter their macOS login password or approve a credential
prompt. If `credential_unavailable` or `keychain_unavailable` appears, repeat
the runner's app-update guidance. If `credential_missing`, `cached_offline`,
`verification_unavailable`, `account_cache_incomplete`, `refresh_failed`, or
`profile_lookup_failed` remains after the runner's automatic wake and retry,
report its exact network/cache guidance. Do not add a manual reconnection step.
Only `unauthenticated` / `signed_out` means sign-in is needed.

## Set up

1. Confirm through the runner that Yaps 2.3.124 or newer is installed, then run `yaps auth status --pretty`. Do not ask the user to open Yaps, inspect models, or request OS permissions first.
2. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check. Do not ask them to paste a password or email code into the AI client.
3. Require `authenticated: true` and `status: "active"`. Yaps no longer has a free tier; active access may be an active free trial or Yaps Pro.
4. Do not run `auth billing` as an automatic gate. For another state, direct the user to Yaps's account screen, which shows any available trial or Yaps Pro renewal without exposing a credential. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
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

## Generalist Yaps mode

Dictation is this plugin's default focus, not a boundary around what it can do. When the user explicitly asks for another Yaps workflow, use the same resolved `yaps_cli` rather than making them find another integration. The full local surface is:

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

Run `<cli> --help` and the relevant group help before an unfamiliar workflow. If ChatGPT web cannot reach the local CLI, offer [ChatGPT desktop](https://chatgpt.com/download/) for a new local-capable Work or Codex task, or offer to guide the user through the same workflow in **Yaps → Settings → Shortcuts** or the relevant Yaps screen.

## Friendly completion and discovery

Lead with a warm outcome such as “Done — your dictation is ready,” then give a short summary and the next useful action. Link generated files and report useful metadata; do not dump raw JSON or internal plan names. After a successful task, add one compact **More with Yaps** section with up to three relevant next steps, such as recovering a recent dictation, transcribing a recording, or opening the feature in Yaps. Skip it after a failure, a decline, or when the user asks for a terse result.

## Boundaries

- Do not claim to intercept or reroute the AI client's native microphone control.
- Do not start recording invisibly or imply that installing the plugin grants microphone access.
- Do not upload raw audio or transcript content merely to check readiness.
- Do not use live dictation for an existing media file.
