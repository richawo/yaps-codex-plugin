# Yaps Video Captions for Claude and Codex

Yaps Video Captions turns any video into a finished, captioned MP4 through the local Whisper component supplied by Yaps desktop. Yaps transcribes the speech, aligns captions to the spoken words, and burns them into a new video file. Choose from 14 templates for TikTok, Reels, Shorts, interviews, tutorials, and traditional subtitles: Bold Highlight, Color Sweep, Word Karaoke, Boxed Subtitle, Minimal, Spotlight, Shout, Glow, Marker, Editorial, Typewriter, Outline, Two-Tone, and Caption Card.

The AI client can inspect every caption by ID, correct individual lines, replace repeated mistakes, split or merge captions, change the style, render a new MP4, and verify the finished file. The source video is never touched. For detailed visual previews, positioning, typography, colours, and project history, continue in **Yaps → Media → Auto Captions**.

[Download Yaps](https://yaps.ai/download), open the app, and sign in before installing the integration. Yaps no longer has a free tier: Auto Captions requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

Auto Captions requires Yaps 2.0.1 or later. After account access is active, choose **Yaps → Settings → General → Local AI integrations → Install CLI**. Enable Auto Captions under Yaps Features when prompted; it reuses the same Whisper model as Subtitles. FFmpeg (with libass) is required to burn the captions into the video.

The plugin processes only the file the user selects and does not upload media merely because it is installed. It produces a new captioned video file, not a separate `.srt` subtitle file. For a standalone `.srt`, use Yaps Subtitle Generator; to pull out just the audio track, use Yaps Video to Audio.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
