# Yaps Transcription for Claude and Codex

Yaps Transcription turns an existing audio or video file into a plain-text transcript using the local transcription engine supplied by Yaps desktop.

[Download Yaps](https://yaps.ai/download), open the app, and sign in before installing the integration. Yaps no longer has a free tier: file transcription requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps; the plugin never promises a trial the account is not eligible to receive.

After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. The current file-transcription path uses Yaps's local Subtitles/Whisper component and requires FFmpeg for media extraction.

This plugin does not upload a media file merely because it is installed. It invokes the installed Yaps engine only when the user asks to transcribe a specific file. For timed `.srt` output, use the separate Yaps SRT plugin.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
