# Security and privacy

## Data flow

This repository contains a Codex skill and marketplace metadata. It does not contain an MCP server, network client, executable, authentication secret, or analytics integration.

When Yaps desktop is installed and connected to Codex:

- Codex launches the MCP binary shipped with the local Yaps installation.
- The MCP process reads the user's local Yaps settings and Markdown vault.
- Agent Access is disabled by default and new supported connections begin read-only.
- Users explicitly enable writes inside Yaps.
- MCP client identities are allowlisted independently.
- Note updates can carry `expected_updated_at` to reject stale overwrites.
- Destructive operations remain separately identified and guarded.

Installing or enabling this plugin does not itself upload vault contents. Codex may receive note content when the user asks it to use Yaps Memory, subject to the user's Codex account and data settings.

## Reporting a vulnerability

Please do not open a public issue for an unpatched vulnerability. Email [support@yaps.ai](mailto:support@yaps.ai) with reproduction steps and impact. Avoid including real vault content, credentials, or other personal information.
