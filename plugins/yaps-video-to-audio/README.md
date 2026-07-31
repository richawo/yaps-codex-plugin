# Yaps Video to Audio for ChatGPT Desktop, Claude, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. If you are using ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Convert a video file to MP3, WAV, or M4A through the installed Yaps desktop
application.

The plugin handles first-run Yaps sign-in and access checks, uses the CLI
already packaged inside Yaps, refuses silent overwrites, and verifies the
generated audio file. No separate CLI install or Agent Access permission is
required. FFmpeg is still required for media conversion.

## Example requests

- Convert this video to MP3.
- Extract the audio from this video as WAV.
- Turn this MP4 into an M4A audio file.

Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is
required. Download Yaps at <https://yaps.ai/download> or contact
[support@yaps.ai](mailto:support@yaps.ai).
