# Security and privacy

## Data flow

This repository contains Codex skills, marketplace metadata, icons, and a small wrapper that extracts the transcript returned by the installed Yaps CLI. It contains no speech model, hosted media proxy, account secret, analytics integration, or private Yaps application source.

When Yaps desktop is installed:

- Memory requests use the local `yaps_mcp` binary shipped by Yaps.
- Transcription, SRT, and text-to-speech requests use the local `yaps_cli` binary shipped by Yaps.
- Live dictation remains owned by the visible Yaps desktop app and its configurable shortcut.
- Authentication happens inside Yaps. Plugins never receive passwords, email codes, access tokens, or refresh tokens.
- Yaps applies its normal feature, permission, entitlement, and usage controls.

Yaps Memory connections begin read-only. Users explicitly enable writes inside Yaps, MCP identities are allowlisted independently, stale timestamps can reject overwrites, and destructive operations remain separately guarded.

Installing or enabling a plugin does not itself upload vault contents, recordings, media files, or text. Codex receives content only when the user asks it to perform a corresponding workflow, subject to the user's Codex account and data settings.

## Reporting a vulnerability

Do not open a public issue for an unpatched vulnerability. Email [support@yaps.ai](mailto:support@yaps.ai) with reproduction steps and impact. Avoid including real vault content, credentials, raw recordings, or other personal information.
