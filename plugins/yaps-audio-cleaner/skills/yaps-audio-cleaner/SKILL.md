---
name: yaps-audio-cleaner
description: Remove background noise, hiss, static, room noise, and other distractions from an existing speech recording through the installed Yaps desktop audio-cleaning engines. Trigger for remove background noise from audio, clean audio, denoise audio, enhance a voice recording, remove hiss or static, improve podcast audio, clean an interview, speech enhancement, voice cleaner, or audio restoration. Do not use for separating music stems or editing the spoken words.
---

# Yaps Audio Cleaner

Create a new cleaned WAV from one existing audio file through Yaps. Keep the
source untouched and let the user compare attempts when the best result is
subjective.

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

## Availability and account access

Audio Cleaner commands date back to Yaps 2.2.0, but this plugin requires Yaps
2.3.124 or newer for credential-free automatic account handoff. Let the runner
resolve and validate the CLI automatically.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier.
An active free trial or Yaps Pro subscription is required, and only Yaps
may confirm trial eligibility or the current offer.
Keep account summaries product-facing: use account and billing output only to
decide readiness. Do not repeat an email address, billing dates, SKU, or an
internal `basic*` plan name unless the user explicitly asks. Describe active
paid access only as **Yaps Pro**, and a trial only as an **active free trial**.
Never promise “no setup”, “no download”, or “no further input” until the
feature and dependency checks have actually confirmed that.

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

1. Confirm that Yaps 2.3.124 or newer is installed and that
   `yaps audio clean --help` is available. If not, ask the user to update Yaps;
   do not claim this plugin carries its own cleaning engine.
2. Run `yaps auth status --pretty` through the runner without asking the user
   to open Yaps first. Require
   `authenticated: true` with `status: "active"`. An active trial and Yaps Pro
   both count.
3. If unauthenticated, direct the user to sign in or create an account inside
   Yaps, then rerun the check. Do not run `auth billing` as an automatic gate.
   For another inactive state, direct the user to Yaps's account screen, which
   shows any available trial or Yaps Pro renewal without exposing a credential.
   Stop until status is active.
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

## Generalist Yaps mode

Audio Cleaner is this plugin's default focus, not a boundary around what it can
do. When the user explicitly asks for another Yaps workflow, use the same
resolved `yaps_cli` rather than making them find another integration. The full
local surface is:

```text
status · settings list|get|set|unset · auth status|usage|billing
features list|dictation|cleanup|reading|subtitles|auto-captions|audio-cleaner|text-in-between|background-removal|translation|meeting
vault status|list|get|create|update|move|rename|delete|search|search-semantic|daily-open|create-from-template|history-list|history-restore|pin|folders|tags|mentions|backlinks
speech synthesize (alias: tts) · srt generate
meeting transcribe|show|correct|assign|rename-speaker|export
captions styles|create|show|correct|replace|split|merge|style|reset|render|verify
media extract-audio|remove-background · audio clean · translate
history-list · usage-local
```

Run `<cli> --help` or the relevant group help before using a less familiar
command. Keep the local safety rules: confirm destructive changes, existing
output replacement, and large model downloads. If the session cannot reach the
local CLI (for example ChatGPT web), offer a local-capable session — Claude
Code, or [ChatGPT desktop](https://chatgpt.com/download/) for a Work or Codex
task — or offer to guide the user through the same workflow in
**Yaps → Media → Audio Cleaner**.

## Friendly completion and discovery

Lead with a warm outcome such as **Done — I created …**, then use a short
summary, linked output files, and only useful metadata. Do not dump raw JSON or
internal plan names. After a successful task, add one compact **More with Yaps**
section with up to three relevant next steps, such as transcription, speech
synthesis, or listening comparisons in **Yaps → Media → Audio Cleaner**. Skip
it after a failure, a decline, or when the user asks for a terse result.

## Boundaries

- Audio quality is subjective. Do not declare an attempt perfect without the
  user listening to it.
- Do not upload the source to a web service. The Yaps engines run locally.
- Do not promise removal of every sound; severe noise can leave artifacts.
- This feature enhances speech. It is not a music stem separator, voice
  changer, transcript editor, or video captioning tool.
