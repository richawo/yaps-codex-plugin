# Yaps plugins for ChatGPT Desktop, Claude Code and Codex

These local-first plugins must be able to reach the Yaps engine installed on
the user's computer. ChatGPT web and cloud sessions cannot directly run that
engine. [Download or open ChatGPT desktop](https://chatgpt.com/download/) and
retry in a local-capable Work or Codex session, or access the feature directly
in the Yaps application. Each plugin checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

This directory contains 11 Yaps integrations. Every plugin shares one
host-neutral skill and carries separate manifests for Claude Code and Codex.
The Claude marketplace catalog lives at
[`plugins/.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json).

## Try the Claude marketplace locally

From the repository root:

```sh
claude plugin marketplace add --scope local ./plugins
claude plugin install yaps-memory@yaps --scope local
```

Replace `yaps-memory` with any marketplace name to install another plugin:

- `yaps-audio-cleaner`
- `yaps-auto-captions`
- `yaps-background-removal`
- `yaps-dictation`
- `yaps-meeting-transcription`
- `yaps-memory`
- `yaps-srt-generator`
- `yaps-text-to-speech`
- `yaps-transcription`
- `yaps-translation`
- `yaps-video-to-audio`

For temporary development without installing a marketplace entry:

```sh
claude --plugin-dir ./plugins/yaps-memory
```

Yaps desktop supplies the local models, processing engine, and packaged CLI.
Every plugin invokes the same bundled discovery runtime: an explicit binary
override wins, then `PATH`, then verified installed-app locations. Candidates
must pass a bounded, read-only `status` check before use. This includes normal
and per-user macOS Applications folders, the per-machine Windows
installation under Program Files, and `/usr/bin` for Linux deb/rpm installs.
Users do not need to install a separate CLI, edit `PATH`, or press a Connect
button. The runner also follows the desktop app's canonical settings file and
uses either an active free trial or Yaps Pro automatically. During an explicit
account readiness check or a trial/Yaps Pro-gated task, it may quietly wake the
verified installed app when a signed-in account cache needs a short refresh.
This uses only the verified application path on macOS, Windows, or an official
Linux deb/rpm installation.
Basic CLI, settings, and feature-readiness checks do not wake the app.
It never launches Yaps for an unsigned-in, expired, or mobile-only account;
those states receive specific guidance. The ten task plugins do not use Yaps
Agent Access: an explicit request such as transcribing a file or removing a
background can run directly, while the AI host's normal file permissions govern
reading inputs and saving outputs.

Credential-free automatic account checks require Yaps 2.3.124 or newer. Some
feature commands existed in older releases, but those older helpers could read
or rotate a system credential during `auth status`. The plugin runner refuses
that legacy check and asks for an app update without touching Keychain. This is
a plugin compatibility floor, not a separate connection or CLI installation.

Yaps Memory is different because it exposes a durable private vault. Its
packaged MCP bridge connects automatically after Yaps desktop onboarding and
starts read-only. The launcher validates the CLI separately from the
`yaps_mcp` connector, so it reports “private-vault connector unavailable” when
the CLI itself is healthy. Vault writes remain opt-in under **Yaps → Settings →
Agent Access**.

## Shared conversation contract

Every Yaps plugin is a friendly, general-purpose front door to the local Yaps
CLI. The plugin name supplies the default intent when a request is ambiguous,
but an explicit request for another Yaps capability should be handled directly
through the same installed CLI rather than bounced to a different integration.

Responses should be easy to scan: lead with the outcome, use short headings and
bullets, link generated files, and report only the useful result fields instead
of dumping raw JSON. After a successful task, add one compact **More with Yaps**
handoff with up to three relevant ideas. A handoff may point to another local
CLI workflow or to the matching screen in the Yaps app; it is discovery, not a
repeated subscription or download pitch. Skip it after a failed task, when the
user declines, or when the user asks for a terse result.

When a cloud or ChatGPT web session cannot reach the local CLI, give the user
two concrete paths: [download or open ChatGPT desktop](https://chatgpt.com/download/)
and start a new local-capable Work or Codex task, or open the relevant place in
Yaps and offer to guide them through the same workflow in the app.

The full generalist command surface is:

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
translate (text, Markdown, plain text, or SRT files)
history-list
usage-local
```

Let the bundled runner resolve and validate `yaps_cli` once, then reuse that
binary. Run group-specific `--help` only after validation when command-version
checking is needed. Never invent a command that the installed version does not
advertise.

Custom Windows installer directories can use `YAPS_CLI_BINARY` (and
`YAPS_MCP_BINARY` for the Memory connector); the signed helper carries
verifiable Windows version metadata. Standalone Linux AppImages are currently
unsupported for account-gated plugin automation because they have neither a
stable host path nor deb/rpm ownership metadata that can prove the account
check is credential-free. Use the official deb/rpm package for Linux plugins.
Do not scan the filesystem for an AppImage or executable.

Setapp CLI automation is deferred because that build uses a separate settings
and entitlement contract. Correct support requires a future Yaps app/CLI
release; plugins do not guess Setapp activation or scan its private data.

## Validate the full Claude port

Run:

```sh
./scripts/validate-claude-plugins.sh
```

The script validates the marketplace, every plugin manifest, and the
cross-platform Yaps Memory MCP resolver. It requires a local Claude Code
installation and Node.js.
