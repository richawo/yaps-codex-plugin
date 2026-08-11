---
name: yaps-srt-generator
description: Generate subtitles, closed captions, or a timestamped .srt file from an existing video or audio file with the installed Yaps desktop engine. Trigger for generate subtitles, add subtitles to video, subtitle generator, video to subtitles, video to SRT, generate SRT, make captions, create captions, timed captions, closed captions, subtitle a video, subtitle an audio file, or convert media speech to an SRT file. Do not use when the user only wants a plain-text transcript or live voice typing.
---

# Yaps Subtitle Generator

Create one timestamped `.srt` file from an existing media file through Yaps.

## Runtime compatibility

Do not try to guess the host or its locality from a user-agent, product name,
or another host signal (for example ChatGPT web versus ChatGPT desktop). Test
the capability this workflow actually needs: before account, model, dependency,
or input-file checks, resolve the local Yaps CLI through the plugin runner. The
runner validates it with a bounded, read-only `status` command. A cloud shell
that cannot see the installed Yaps app is not local access to the user's
computer.

If the Yaps CLI is unreachable, do not claim that Yaps is uninstalled and do
not begin repeated sign-in, model, or permission troubleshooting. Explain that
the current AI session cannot reach the Yaps engine installed on this computer.
Direct the user to a local-capable session on the
computer where Yaps is installed: in Claude, that
is Claude Code or the Claude desktop app; from ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. They can also access this feature directly
in the Yaps application. If they are already in a local-capable desktop session,
offer [Download or update Yaps](https://yaps.ai/download), ask them to open it,
and retry. Stop until local reachability is restored; only then follow the
availability and onboarding steps below.

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

Yaps desktop supplies the local Whisper model, feature state, account state, and usage controls. Let the runner resolve and validate the CLI automatically. Do not claim the skill contains its own transcription engine.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and dependency checks have actually confirmed that.

## Account recovery

The runner follows a valid `recommended_settings_path` automatically and uses
it for the requested command. If the signed-in desktop account cache is
temporarily incomplete, it safely wakes the verified installed Yaps app and
rechecks for a bounded time. Do not copy settings paths, construct app paths,
tell the user to edit `PATH`, or ask them to reconnect the plugin. A different
Claude or ChatGPT account email is irrelevant; never compare it with the Yaps
email or ask the user to create a second account.

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

## First-run onboarding

1. Confirm through the runner that Yaps 2.3.124 or newer is installed. Do not ask the user to open it, install models, or process media first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. Do not run `auth billing` as an automatic gate. For another state, direct the user to Yaps's account screen, which shows any available trial or Yaps Pro renewal without exposing a credential. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. Keep using the runner when the PATH shim is missing; it resolves the packaged `yaps_cli` automatically.
6. Run `yaps features list --pretty`. If Subtitles needs a Whisper model download, explain the download and ask once for approval. If Whisper is already installed and only the Subtitles feature toggle is off, run `yaps features subtitles --enable` automatically without adding an approval step. Verify readiness and resume the original task.
7. Resolve the exact media path and confirm it exists. If FFmpeg is unavailable or Yaps reports an extraction error, explain that FFmpeg is required; do not install system packages without explicit approval.
8. Generate one requested SRT and confirm the output file. Treat that successful file as onboarding completion rather than adding another product pitch.

## Generate

Choose the requested destination, or default beside the source as `<source name> Subtitles.srt`. Before running anything, check whether that path already exists. Never replace it without explicit approval.

Run:

```text
yaps --pretty srt generate <media-path> --output <output.srt>
```

Keep using the runner when the PATH shim is unavailable. Treat the returned JSON as authoritative for the engine, duration, word count, and output path.

## Verify and report

Confirm that the output exists and is non-empty. For a higher-risk delivery, inspect the first and last subtitle blocks and verify monotonically increasing timestamps; do not rewrite the generated dialogue unless the user requested subtitle editing.

Return a link to the `.srt` file and report the engine, duration, and word count. If Yaps detects no speech, say so rather than producing an empty success.

## Generalist Yaps mode

Subtitle generation is this plugin's default focus, not a boundary around what it can do. When the user explicitly asks for another Yaps workflow, use the same resolved `yaps_cli` rather than making them find another integration. The full local surface is:

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

Run `<cli> --help` and the relevant group help before an unfamiliar workflow. If the session cannot reach the local CLI (for example ChatGPT web), offer a local-capable session — Claude Code, or [ChatGPT desktop](https://chatgpt.com/download/) for a Work or Codex task — or offer to guide the user through the same workflow in **Yaps → Media → Subtitles**.

## Friendly completion and discovery

Lead with a warm outcome such as “Done — your subtitles are ready,” then link the SRT and give a short summary of what was processed. Do not dump raw JSON or internal plan names. After a successful task, add one compact **More with Yaps** section with up to three relevant next steps, such as styling captions, translating the SRT, or opening the media in Yaps. Skip it after a failure, a decline, or when the user asks for a terse result.

## Boundaries

- Use Yaps Transcription for plain `.txt` output.
- Use Yaps Dictation for live microphone voice typing.
- Do not silently switch to a hosted transcription service.
- Do not retain another copy of the source media.
