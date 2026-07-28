# Accurate Translation for Claude and Codex

Accurate Translation turns a sentence, a Markdown or plain-text file, or an SRT subtitle file into another language through the local translation model supplied by Yaps desktop. Translation runs on your machine, so the source is not uploaded to a translation service and the translation inference consumes no metered cloud translation/API tokens.

[Download Yaps 2.1.0 or newer](https://yaps.ai/download), open the app, and sign in before installing the integration. Older builds, including 2.0.1, do not expose the translation command this plugin uses. Yaps no longer has a free tier: translation requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. When translation is first requested, the plugin checks language coverage, explains the one-time model size, asks for approval, and then lets Yaps install the appropriate engine automatically: Standard (about 1.7 GB, 28 languages) or Extended (about 2.5 GB, 53 languages and the broadest reach).

Markdown structure, code blocks, and image embeds are preserved, and `.srt` files keep every timestamp and index. The plugin translates only the text or file you point it at, writes a new file beside the source, and never modifies the original. “No tokens” refers to avoiding metered cloud translation/API tokens; Yaps still requires an active free trial or Yaps Pro, and the AI client remains subject to its own product usage. To create subtitles from a video in the first place, use Yaps Subtitle Generator; for audio or video to text, use Yaps Transcription.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
