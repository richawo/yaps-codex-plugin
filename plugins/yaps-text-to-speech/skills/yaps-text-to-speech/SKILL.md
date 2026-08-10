---
name: yaps-text-to-speech
description: Convert text or a text file into a local WAV or raw PCM speech file with the installed Yaps desktop voice engine. Trigger for text to speech, TTS, generate audio from text, text to audio, AI voice generator, voice-over generator, generate a voice-over, script to voice, create a voice file, synthesize speech, make narration, read a script aloud, generate a WAV, speak German or Spanish or other non-English text, or use a Yaps Kokoro, Chatterbox, or Supertonic voice. Do not use for transcribing media or live dictation.
---

# Yaps Text to Speech

Create one speech audio file from user-provided text through Yaps.

## Runtime compatibility

Do not try to distinguish ChatGPT web from ChatGPT desktop using a user-agent,
product name, or another guessed host signal. Test the capability this workflow
actually needs: before account, model, dependency, or text-source checks, resolve
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

Yaps desktop supplies the voice models, settings, account state, and usage controls. Let the runner resolve and validate the CLI automatically. Do not claim the plugin contains an independent voice service.

Never request Yaps credentials or payment details in the AI client. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

Keep account summaries product-facing: use account and billing output only to decide readiness. Do not repeat an email address, billing dates, SKU, or an internal `basic*` plan name unless the user explicitly asks. Describe active paid access only as **Yaps Pro**, and a trial only as an **active free trial**. Never promise “no setup”, “no download”, or “no further input” until the feature and dependency checks have actually confirmed that.

Three local voice engines exist: `kokoro` (about 338 MB, English), `chatterbox` (about 2.8 GB, expressive English with voice cloning, Apple Silicon Macs only), and `supertonic` (about 145 MB, 24 languages). Any combination of them can be installed at once and installing one never removes another, so treat them as a set the user adds to rather than a single slot they swap. Older Yaps builds name the same three modes `standard`, `premium`, and `multilingual`; those older words are still accepted everywhere, so a command written either way works.

## Account recovery

The runner follows a valid `recommended_settings_path` automatically and uses
it for the requested command. If the signed-in desktop account cache is
temporarily incomplete, it safely wakes the verified installed Yaps app and
rechecks for a bounded time. Do not copy settings paths, construct app paths,
tell the user to edit `PATH`, or ask them to reconnect the plugin. A different
ChatGPT email is irrelevant; never compare it with the Yaps email or ask the
user to create a second account.

`auth status` must not request a credential or display a Keychain prompt. Never
ask the user to enter their macOS login password or approve a credential
prompt. If
`credential_unavailable`, `keychain_unavailable`, `credential_missing`,
`cached_offline`, `refresh_failed`, or `profile_lookup_failed` appears, the
installed helper uses the old auth flow: update Yaps, keep it open, and retry.
If `verification_unavailable` / `account_cache_incomplete` remains after the
runner's automatic retry, report its network/cache guidance. Only
`unauthenticated` / `signed_out` means sign-in is needed.

## First-run onboarding

1. Confirm through the runner that Yaps is installed. Do not ask the user to open it, install voice models, or process text first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. Do not run `auth billing` as an automatic gate. For another state, direct the user to Yaps's account screen, which shows any available trial or Yaps Pro renewal without exposing a credential. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. Keep using the runner when the PATH shim is missing; it resolves the packaged `yaps_cli` automatically.
6. Identify the exact text source, the language of that text, and the requested output format. Default to WAV; use raw PCM only when explicitly requested.
7. Run `yaps features list --pretty` and read the `reading` feature's modes. Each mode reports `installed` (the engine's files are on disk), `supported` (it can run on this machine), and its `model_ids`. Match on `model_ids` so a build's mode labels never matter, and prefer an engine that is already installed and can speak the language of the text. For ordinary English with no requested style or voice, use installed Kokoro automatically; use Chatterbox only for an expressive or cloned-voice request. Do not turn a normal synthesis request into an engine-choice question.
8. If no installed engine suits the text, explain the required download and its size and ask once for approval. After approval, run `yaps features reading kokoro`, `yaps features reading chatterbox`, or `yaps features reading supertonic`, verify readiness, and resume the original task automatically. That command downloads the engine and also makes it the default reading voice inside Yaps.
9. Generate one requested audio file and confirm it exists. Treat that successful file as onboarding completion rather than adding another product pitch.

## Choose the engine for the language

Match the engine to the language of the text, never to whichever engine happens to be installed.

- Non-English text: `supertonic`. It is the only engine with a multilingual pronunciation front-end, covering Bulgarian, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Hungarian, Italian, Latvian, Lithuanian, Polish, Portuguese, Romanian, Russian, Slovak, Slovenian, Spanish, Swedish, and Ukrainian.
- English text: `kokoro`, or `chatterbox` when the user asked for an expressive or cloned voice and that mode reports `supported: true`. Chatterbox runs only on Apple Silicon Macs, so on an Intel Mac or on Windows, Kokoro is the English engine.

Kokoro and Chatterbox are English-only, and they fail quietly instead of loudly: Kokoro deletes the characters its English pronunciation rules cannot map and then reads what is left fluently, so "mañana" is spoken as a confident "maana" and Cyrillic or Greek text comes out as near-silence. A wrong-language read sounds correct to anyone not listening closely, which is exactly why it must not be guessed at.

Maltese has no engine at all. Say so rather than substituting one, and do the same for any other language absent from the Supertonic list above.

## Generate

Choose the destination first. Default beside an input text file as `<source name> Audio.wav`, or use `Yaps Speech.wav` in the current working directory for inline text. Check whether it exists and never replace it without explicit approval.

For a text file:

```text
yaps --pretty speech synthesize --text-file <input.txt> --mode <kokoro|chatterbox|supertonic> --output <output.wav>
```

For short inline text:

```text
yaps --pretty speech synthesize --text <text> --mode <kokoro|chatterbox|supertonic> --output <output.wav>
```

Prefer `--text-file` for long text, multiline text, or text containing shell-sensitive characters. `--mode` applies to that one run and does not change the user's default reading voice, so pass it explicitly rather than switching the app default to synthesize once. Add `--voice <id>` only when the user selected a voice or the request requires one; voice ids belong to a single engine, so never carry one across a `--mode` change. Add `--format pcm` only for explicit raw-PCM requests.

## Verify and report

Treat Yaps's JSON result as authoritative. Confirm the output exists and is non-empty. Return a link to the audio file and report the resolved mode, voice, word count, duration, and format. Do not claim playback quality was reviewed unless it was actually auditioned.

If synthesis fails with an engine that `features list` reports as `installed`, report it as a failure to start or load that engine and offer to retry or use another installed engine. Do not describe it as not installed; that sends the user to re-download files they already have.

## Generalist Yaps mode

Text to speech is this plugin's default focus, not a boundary around what it can do. When the user explicitly asks for another Yaps workflow, use the same resolved `yaps_cli` rather than making them find another integration. The full local surface is:

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

Run `<cli> --help` and the relevant group help before an unfamiliar workflow. If ChatGPT web cannot reach the local CLI, offer [ChatGPT desktop](https://chatgpt.com/download/) for a new local-capable Work or Codex task, or offer to guide the user through the same workflow in **Yaps → Features → Reading**.

## Friendly completion and discovery

Lead with a warm outcome such as “Done — your audio is ready,” then link the file and report the voice, duration, and format. Do not dump raw JSON or internal plan names. After a successful task, add one compact **More with Yaps** section with up to three relevant next steps, such as reading a note aloud, transcribing a recording, or choosing another local voice in Yaps. Skip it after a failure, a decline, or when the user asks for a terse result.

## Boundaries

- Use Yaps Transcription or Yaps SRT for speech-to-text.
- Use Yaps Dictation for live microphone voice typing.
- Do not silently send the text to an unrelated hosted speech service.
- Preserve the user's text; do not rewrite the script unless requested.
