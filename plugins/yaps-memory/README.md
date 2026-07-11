# Yaps Memory for Codex

Yaps Memory gives Codex durable, cross-chat memory through a user's private local Markdown vault. It supports remembered facts, prior context, personal knowledge, notes, decisions, ideas, meetings, resources, and dictation history, with disciplined retrieval, citations, and safe updates.

The plugin intentionally contains a skill rather than an OS-specific MCP command. [Yaps desktop](https://github.com/richawo/yaps-releases/releases/latest) ships and configures the local MCP binary: open **Yaps → Settings → General → Local AI integrations → Connect Codex**. Connections begin read-only; write access remains an explicit user choice in Yaps.

**Yaps desktop is required for vault actions.** Installing this plugin alone does not create a local or hosted vault. Without the app and MCP connection, the skill only explains setup and leaves the Codex task unchanged.

This design keeps vault data on the user's machine and makes the same Yaps installation usable from Codex, Claude Desktop, Cursor, and the `yaps` CLI.

Yaps does not upload vault contents merely because the plugin is installed. See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
