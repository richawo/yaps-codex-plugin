# Yaps Subtitle Generator for Claude, ChatGPT Desktop, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. In Claude, use Claude Code or the Claude desktop app on the
computer where Yaps is installed. If you are using ChatGPT web or a cloud
session, [download or open ChatGPT desktop](https://chatgpt.com/download/) and
retry in a local-capable Work or Codex session. You can also access this
feature directly in the Yaps application. The workflow checks actual Yaps
reachability instead of relying on a user-agent guess or assuming that Yaps is
uninstalled.

Yaps Subtitle Generator creates subtitles, closed captions, and a timestamped `.srt` file from an existing video or audio file through the local Whisper component supplied by Yaps desktop.

The plugin and [Yaps](https://yaps.ai/download) can be installed in either order. Before first use, open Yaps and sign in. Yaps no longer has a free tier: SRT generation requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. Enable Subtitles under Yaps Features when prompted. FFmpeg is required for media extraction.

The plugin processes only the file the user selects and does not upload media merely because it is installed. For a plain-text transcript without subtitle timings, use Yaps Transcription.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
