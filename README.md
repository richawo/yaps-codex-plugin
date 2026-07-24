# Yaps plugins for Codex

[![Validate plugins](https://github.com/richawo/yaps-codex-plugin/actions/workflows/validate.yml/badge.svg)](https://github.com/richawo/yaps-codex-plugin/actions/workflows/validate.yml)
[![MIT licensed](https://img.shields.io/badge/plugins-MIT-1D1D1F.svg)](LICENSE)
[![Powered by Yaps](https://img.shields.io/badge/powered%20by-Yaps-D4775B.svg)](https://www.yaps.ai/)

Yaps plugins give Codex focused voice and memory workflows powered by the Yaps desktop application. Each listing has one clear job, while one Yaps installation supplies the local models, account session, permissions, history, vault, and automation binaries behind them.

## Choose one clear function

| Plugin | What it does | Example request |
| --- | --- | --- |
| **Yaps Memory** | Persistent private Markdown memory across Codex tasks | “Remember this decision for next time.” |
| **Yaps Dictation** | Set up and troubleshoot voice typing into Codex and desktop apps | “Set up Yaps voice typing for Codex.” |
| **Yaps Transcription** | Turn an existing audio or video file into plain text | “Transcribe this interview to a text file.” |
| **Yaps Subtitle Generator** | Generate subtitles, closed captions, or a timestamped `.srt` file | “Generate subtitles for this video.” |
| **Yaps Video to Audio** | Convert a video to MP3, WAV, or M4A audio | “Convert this video to MP3.” |
| **Yaps Text to Speech** | Turn text or a text file into WAV audio | “Create narration from this script.” |
| **Yaps Video Captions** | Add editable, styled captions and export a finished video | “Add TikTok-style captions to this video.” |

The plugins are deliberately separate so search intent stays obvious. Subtitle generation does not masquerade as general transcription, video-to-audio conversion does not imply speech recognition, live dictation does not pretend to process existing media, and text-to-speech never competes with speech-to-text triggers.

## Install the marketplace

```sh
codex plugin marketplace add richawo/yaps-codex-plugin
```

Install only the workflows you want:

```sh
codex plugin add yaps-memory@yaps
codex plugin add yaps-dictation@yaps
codex plugin add yaps-transcription@yaps
codex plugin add yaps-srt-generator@yaps
codex plugin add yaps-video-to-audio@yaps
codex plugin add yaps-text-to-speech@yaps
codex plugin add yaps-auto-captions@yaps
```

Start a new Codex task after installing or updating a plugin.

## Shared Yaps setup

1. [Download Yaps for Mac or Windows](https://yaps.ai/download).
2. Open Yaps and sign in or create an account inside the app. Plugins never collect Yaps credentials or payment details.
3. Activate the free trial shown by Yaps when the account is eligible, or activate Yaps Pro. Yaps no longer has a free tier, and the plugins never invent trial eligibility, duration, or terms.
4. Open **Yaps → Settings → General → Local AI integrations**.
5. Use **Connect Codex** for Yaps Memory.
6. Use **Install CLI** for Transcription, Subtitle Generator, Video to Audio, Text to Speech, and Auto Captions.
7. Complete Yaps's guided microphone and accessibility permissions for Dictation.

One active Yaps session—free trial or Yaps Pro—is shared by every plugin. Installing another plugin does not create another account or another copy of the models.

## Set up each plugin

### Yaps Memory

1. In Yaps, choose **Connect Codex** under Local AI integrations.
2. Start a new Codex task.
3. Ask: `Set up Yaps Memory and guide me through my first useful action.`
4. Connections begin read-only. Enable writes separately under **Yaps → Settings → Agent Access** only when you want Codex to create or edit notes.

Yaps supplies the private local Markdown vault and MCP server. Installing the plugin alone does not create or upload a vault.

### Yaps Dictation

1. Finish Yaps's microphone and accessibility guidance.
2. Open **Yaps → Settings → Shortcuts** and note the configured dictation shortcut.
3. Ask: `Set up Yaps voice typing for Codex.`
4. Perform one short test dictation into the Codex composer.

The plugin does not intercept Codex's built-in microphone button. Yaps performs system-wide capture, transcription, cleanup, and insertion through its own configurable shortcut.

### Yaps Transcription

1. Choose **Install CLI** under Local AI integrations.
2. Enable the local Subtitles/Whisper component in Yaps Features when prompted.
3. Ensure FFmpeg is available for media extraction.
4. Attach or identify an audio/video file and ask: `Transcribe this media file to plain text with Yaps.`

The bundled workflow saves `<source name> Transcript.txt` by default and refuses to replace an existing output unless explicitly approved.

### Yaps Subtitle Generator

1. Complete the same CLI, Subtitles/Whisper, and FFmpeg readiness checks used for local media transcription.
2. Attach or identify the media file.
3. Ask: `Generate subtitles for this video with Yaps.`

The result is a timestamped `.srt` file. Use Yaps Transcription instead when timings are not wanted.

### Yaps Video to Audio

1. Choose **Install CLI** under Local AI integrations.
2. Ensure FFmpeg is available for local media conversion.
3. Attach or identify a video and ask: `Convert this video to MP3 with Yaps.`

Yaps can create MP3, WAV, or M4A audio. The plugin refuses to replace an existing output unless explicitly approved.

### Yaps Text to Speech

1. Choose **Install CLI** under Local AI integrations.
2. Install a standard or expressive reading component from Yaps Features.
3. Provide text or a text file and ask: `Turn this text into a WAV file with Yaps.`

WAV is the safe default. Raw PCM is generated only when explicitly requested.

### Yaps Video Captions

1. Update to Yaps 2.0.1 or later and choose **Install CLI** under Local AI integrations.
2. Enable Auto Captions from Yaps Features; it reuses the local Whisper component used by Subtitle Generator.
3. Ensure FFmpeg with libass is available for local rendering.
4. Attach or identify a video and ask: `Add TikTok-style captions to this video with Yaps.`

Codex can choose among 14 templates, inspect and correct caption text by ID, replace repeated mistakes, split or merge captions, render a new MP4, and verify the result. Open **Yaps → Media → Auto Captions** for visual previews and detailed typography, colour, position, and grouping controls.

## Privacy and product boundary

- The plugins contain workflow instructions, metadata, and one small transcription wrapper—not speech models, account tokens, or a hosted media proxy.
- Yaps desktop performs the requested local work and applies its normal permissions, entitlements, and usage controls.
- Installing a plugin does not upload a vault, recording, media file, or script.
- Plugins offer the Yaps download only when the app is required to complete the requested job, and stop promoting it once the workflow works.
- New Yaps Memory connections begin read-only; destructive vault operations require explicit intent.

Read [SECURITY.md](SECURITY.md), the [Yaps privacy policy](https://www.yaps.ai/privacy), and the [Yaps terms](https://www.yaps.ai/terms).

## Repository contents

- `plugins/` — the seven distributable Codex plugins.
- `.agents/plugins/marketplace.json` — the public Yaps marketplace.
- `scripts/validate_package.py` — structural, discovery, and public-safety validation.
- `scripts/build_submission_bundles.py` — deterministic plugin and skill ZIP generation.
- `SUBMISSION.md`, `REVIEWER.md`, and `reviewer/vault/` — the existing Yaps Memory directory-review package.

## Development

```sh
python3 scripts/validate_package.py
python3 scripts/build_submission_bundles.py
```

## Links

- [Download Yaps](https://yaps.ai/download)
- [Yaps website](https://www.yaps.ai/)
- [Support and bug reports](https://github.com/richawo/yaps-codex-plugin/issues)
- [Privacy policy](https://www.yaps.ai/privacy)
- [Terms of service](https://www.yaps.ai/terms)

## License

The plugin packages are available under the [MIT License](LICENSE). The license does not apply to the separately distributed Yaps desktop application.
