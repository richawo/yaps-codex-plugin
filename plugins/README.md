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
The ten task plugins find that packaged CLI automatically; users do not need
to install a PATH command or press a Connect button. They do not use Yaps
Agent Access: an explicit request such as transcribing a file or removing a
background can run directly, while the AI host's normal file permissions
govern reading inputs and saving outputs.

Yaps Memory is different because it exposes a durable private vault. Its
packaged MCP bridge connects automatically after Yaps desktop onboarding and
starts read-only. Vault writes remain opt-in under **Yaps → Settings → Agent
Access**.

## Validate the full Claude port

Run:

```sh
./scripts/validate-claude-plugins.sh
```

The script validates the marketplace, every plugin manifest, and the
cross-platform Yaps Memory MCP resolver. It requires a local Claude Code
installation and Node.js.
