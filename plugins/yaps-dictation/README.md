# Yaps Dictation for Claude, ChatGPT Desktop, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. In Claude, use Claude Code or the Claude desktop app on the
computer where Yaps is installed. If you are using ChatGPT web or a cloud
session, [download or open ChatGPT desktop](https://chatgpt.com/download/) and
retry in a local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Yaps Dictation helps people set up, verify, and troubleshoot system-wide voice typing through Yaps. The Yaps desktop app performs microphone capture, transcription, cleanup, context-aware vocabulary, and insertion into the focused app.

[Download Yaps](https://yaps.ai/download), open the app, and sign in before installing models or granting permissions. Yaps no longer has a free tier: Dictation requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

After account access is active, finish the app's microphone and accessibility guidance, then use the shortcut shown under **Yaps → Settings → Shortcuts**. The shortcut is configurable, so this plugin never assumes a specific key.

The plugin does not intercept the AI client's built-in microphone button and does not record audio by itself. It guides users into the Yaps-powered workflow and can recover recent dictation history through the connected local Yaps tools.

Yaps does not upload raw audio merely because this plugin is installed. See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
