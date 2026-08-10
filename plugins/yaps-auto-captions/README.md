# Yaps Video Captions for ChatGPT Desktop, Claude, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. If you are using ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Yaps Video Captions turns any video into a finished, captioned MP4 through the local Whisper component supplied by Yaps desktop. Yaps transcribes the speech, aligns captions to the spoken words, and burns them into a new video file. Choose from 14 templates for TikTok, Reels, Shorts, interviews, tutorials, and traditional subtitles: Bold Highlight, Color Sweep, Word Karaoke, Boxed Subtitle, Minimal, Spotlight, Shout, Glow, Marker, Editorial, Typewriter, Outline, Two-Tone, and Caption Card.

The AI client can inspect every caption by ID, correct individual lines, replace repeated mistakes, split or merge captions, change the style, render a new MP4, and verify the finished file. The source video is never touched. For detailed visual previews, positioning, typography, colours, and project history, continue in **Yaps → Media → Auto Captions**.

The plugin and [Yaps](https://yaps.ai/download) can be installed in either order. Before first use, open Yaps and sign in. Yaps no longer has a free tier: Auto Captions requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

Auto Captions commands date back to Yaps 2.0.1, but this plugin requires Yaps 2.3.124 or later so automatic account handoff never reads a system credential. After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. Enable Auto Captions under Yaps Features when prompted; it reuses the same Whisper model as Subtitles. FFmpeg (with libass) is required to burn the captions into the video.

The plugin processes only the file the user selects and does not upload media merely because it is installed. It produces a new captioned video file, not a separate `.srt` subtitle file. For a standalone `.srt`, use Yaps Subtitle Generator; to pull out just the audio track, use Yaps Video to Audio.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
