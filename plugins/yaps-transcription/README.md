# Yaps Transcription for ChatGPT Desktop, Claude, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. If you are using ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Yaps Transcription turns an existing audio or video file into a plain-text transcript using the local transcription engine supplied by Yaps desktop.

The plugin and [Yaps](https://yaps.ai/download) can be installed in either order. Before first use, open Yaps and sign in. Yaps no longer has a free tier: file transcription requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps; the plugin never promises a trial the account is not eligible to receive.

After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. The current file-transcription path uses Yaps's local Subtitles/Whisper component and requires FFmpeg for media extraction.

This plugin does not upload a media file merely because it is installed. It invokes the installed Yaps engine only when the user asks to transcribe a specific file. For timed `.srt` output, use the separate Yaps SRT plugin.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
