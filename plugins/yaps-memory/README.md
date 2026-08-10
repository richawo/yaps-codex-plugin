# Yaps Memory for ChatGPT Desktop, Claude, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. If you are using ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Yaps Memory gives AI clients durable, cross-task memory through a user's private local Markdown vault. It supports remembered facts, prior context, personal knowledge, notes, decisions, ideas, meetings, resources, and dictation history, with disciplined retrieval, citations, and safe updates.

The plugin, [Yaps desktop](https://yaps.ai/download), in-app setup, and trial or Yaps Pro activation can be completed in any order. Once all prerequisites are present, the plugin automatically uses the current account and entitlement from Yaps; signing in, switching accounts, starting a trial, renewing, or signing out does not require reinstalling or reconnecting the plugin. Yaps no longer has a free tier: Memory requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

If the current AI task was already running before Yaps desktop was installed, start one new local-capable task after opening Yaps. This is only needed because AI clients discover local extensions when a task starts; later account or subscription changes are picked up by the same running connection.

No CLI installation, PATH change, MCP configuration, token copying, or separate **Connect** button is required for ChatGPT or Codex. The installed plugin locates Yaps automatically. Hosts that support MCP use Yaps' Agent Access controls; skills-only uploads use the packaged Yaps CLI as a local fallback. Writes through the fallback are limited to actions the user explicitly requests.

The launcher also follows Yaps' canonical settings file automatically. If the
desktop account is already signed in but its verified trial/Pro cache is still
refreshing, the plugin quietly wakes the installed app and retries briefly. It
does not ask the user or the AI agent to copy an application path, reconnect an
account, or configure a token.

Safe automatic account status requires Yaps 2.3.124 or newer. Older helpers are
not probed for account state because their status command can access a system
credential; update Yaps and the plugin will reuse the desktop account without a
separate connection.

**Yaps desktop is required for vault actions.** Installing this plugin alone does not create a local or hosted vault. Without the app, the skill explains the single download step and leaves the current task unchanged.

This design keeps vault data on the user's machine and makes the same Yaps installation usable from Claude Code, Codex, Claude Desktop, Cursor, and the `yaps` CLI.

Build the OpenAI plugin-portal archive with:

```bash
node plugins/yaps-memory/scripts/package-codex-upload.mjs artifacts/yaps-plugin-uploads-YYYYMMDD/yaps-memory.zip
```

That archive intentionally omits the local MCP configuration that the portal would strip, and places the CLI runner inside the skill bundle so Memory remains functional after ingestion.

Yaps does not upload vault contents merely because the plugin is installed. See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
