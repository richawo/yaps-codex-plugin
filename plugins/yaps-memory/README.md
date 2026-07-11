# Yaps Memory for Codex

Yaps Memory gives Codex a disciplined workflow for searching, citing, and safely updating a user's private local Yaps vault.

The plugin intentionally contains a skill rather than an OS-specific MCP command. [Yaps desktop](https://github.com/richawo/yaps-releases/releases/latest) ships and configures the local MCP binary: open **Yaps → Settings → General → Local AI integrations → Connect Codex**. Connections begin read-only; write access remains an explicit user choice in Yaps.

This design keeps vault data on the user's machine and makes the same Yaps installation usable from Codex, Claude Desktop, Cursor, and the `yaps` CLI.

Yaps does not upload vault contents merely because the plugin is installed. See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
