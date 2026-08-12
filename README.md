# Yaps plugins for Claude Code and Codex

[![Validate plugins](https://github.com/richawo/yaps-codex-plugin/actions/workflows/validate.yml/badge.svg)](https://github.com/richawo/yaps-codex-plugin/actions/workflows/validate.yml)
[![MIT licensed](https://img.shields.io/badge/plugins-MIT-1D1D1F.svg)](LICENSE)
[![Powered by Yaps](https://img.shields.io/badge/powered%20by-Yaps-D4775B.svg)](https://www.yaps.ai/)

Yaps plugins give Claude Code and Codex focused creative, voice, and memory workflows powered by the Yaps desktop application. Each listing has one clear job, while one Yaps installation supplies the local models, account session, permissions, history, vault, and automation binaries behind them.

## Choose one clear function

| Plugin | What it does | Example request |
| --- | --- | --- |
| **Yaps Memory** | Persistent private Markdown memory across Codex tasks | “Remember this decision for next time.” |
| **Yaps Dictation** | Set up and troubleshoot voice typing into AI clients and desktop apps | “Set up Yaps voice typing for Claude Code.” |
| **Yaps Transcription** | Turn an existing audio or video file into plain text | “Transcribe this interview to a text file.” |
| **Yaps Meeting Transcription** | Create timed transcripts with editable speaker labels | “Transcribe this meeting and identify each speaker.” |
| **Yaps Subtitle Generator** | Generate subtitles, closed captions, or a timestamped `.srt` file | “Generate subtitles for this video.” |
| **Yaps Video to Audio** | Convert a video to MP3, WAV, or M4A audio | “Convert this video to MP3.” |
| **Yaps Audio Cleaner** | Remove noise, hiss, and static from speech recordings locally | “Clean the background noise from this interview.” |
| **Yaps Text to Speech** | Turn text or a text file into WAV audio | “Create narration from this script.” |
| **Yaps Video Captions** | Add editable, styled captions and export a finished video | “Add TikTok-style captions to this video.” |
| **Yaps Background Remover** | Remove an image background and export a transparent PNG | “Cut out the subject from this product photo.” |
| **Accurate Translation** | Translate text, documents, and SRT subtitles locally without metered translation API tokens | “Translate this Markdown document into French.” |

The plugins are deliberately separate so search intent stays obvious. Subtitle generation does not masquerade as general transcription, video-to-audio conversion does not imply speech recognition, live dictation does not pretend to process existing media, and text-to-speech never competes with speech-to-text triggers.

## Install for Claude Code

Add the Yaps marketplace once:

```sh
claude plugin marketplace add richawo/yaps-codex-plugin
```

Then install only the workflows you want:

```sh
claude plugin install yaps-memory@yaps
claude plugin install yaps-dictation@yaps
claude plugin install yaps-transcription@yaps
claude plugin install yaps-meeting-transcription@yaps
claude plugin install yaps-srt-generator@yaps
claude plugin install yaps-video-to-audio@yaps
claude plugin install yaps-audio-cleaner@yaps
claude plugin install yaps-text-to-speech@yaps
claude plugin install yaps-auto-captions@yaps
claude plugin install yaps-background-removal@yaps
claude plugin install yaps-translation@yaps
```

Run `/reload-plugins` in an existing Claude Code session, or start a new session.

## Install for Codex

```sh
codex plugin marketplace add richawo/yaps-codex-plugin
```

Install only the workflows you want:

```sh
codex plugin add yaps-memory@yaps
codex plugin add yaps-dictation@yaps
codex plugin add yaps-transcription@yaps
codex plugin add yaps-meeting-transcription@yaps
codex plugin add yaps-srt-generator@yaps
codex plugin add yaps-video-to-audio@yaps
codex plugin add yaps-audio-cleaner@yaps
codex plugin add yaps-text-to-speech@yaps
codex plugin add yaps-auto-captions@yaps
codex plugin add yaps-background-removal@yaps
codex plugin add yaps-translation@yaps
```

Start a new Codex task after installing or updating a plugin.

## Shared Yaps setup

1. [Download Yaps for Mac, Windows, or Linux](https://yaps.ai/download). On Linux, use the official deb/rpm package so the plugin can verify the installed CLI and account-safe version metadata.
2. Open Yaps and sign in or create an account inside the app. Plugins never collect Yaps credentials or payment details.
3. Activate the free trial shown by Yaps when the account is eligible, or activate Yaps Pro. Yaps no longer has a free tier, and the plugins never invent trial eligibility, duration, or terms.
4. Ask Claude Code or Codex to use the installed plugin. The task plugins automatically find the CLI packaged inside Yaps; no PATH setup or Connect button is required.
5. Complete Yaps's guided microphone and accessibility permissions for Dictation.

One active Yaps session—free trial or Yaps Pro—is shared by every plugin. Installing another plugin does not create another account or another copy of the models.

Safe automatic account handoff requires Yaps 2.3.124 or newer. This is an
update requirement for older installations, not a separate CLI installation
or plugin connection step. The standard macOS and Windows downloads and the
official Linux deb/rpm packages are supported. Standalone Linux AppImages do
not yet expose a stable, package-verifiable plugin automation path. The Setapp
edition currently uses a separate activation store and is not yet supported by
plugin automation.

The plugin runner follows Yaps' canonical settings file automatically. If an
already signed-in account cache is temporarily incomplete, it quietly wakes
the verified installed app—including an official Linux deb/rpm install—and
retries briefly. Users and AI agents never need
to copy an application path, edit `PATH`, reconnect an account, or press a
plugin-specific Connect button.

## Set up each plugin

### Yaps Memory

1. Open Yaps and finish account setup.
2. Start a new Claude Code or Codex task.
3. Ask: `Set up Yaps Memory and guide me through my first useful action.`
4. Connections begin read-only. Enable writes separately under **Yaps → Settings → Agent Access** only when you want the AI client to create or edit notes.

Yaps supplies the private local Markdown vault and MCP server. Installing the plugin alone does not create or upload a vault.

### Yaps Dictation

1. Finish Yaps's microphone and accessibility guidance.
2. Open **Yaps → Settings → Shortcuts** and note the configured dictation shortcut.
3. Ask: `Set up Yaps voice typing for Claude Code.`
4. Perform one short test dictation into the AI client's composer.

The plugin does not intercept an AI client's built-in microphone button. Yaps performs system-wide capture, transcription, cleanup, and insertion through its own configurable shortcut.

### Yaps Transcription

1. Enable the local Subtitles/Whisper component when the plugin asks for approval.
2. Ensure FFmpeg is available for media extraction.
3. Attach or identify an audio/video file and ask: `Transcribe this media file to plain text with Yaps.`

The bundled workflow saves `<source name> Transcript.txt` by default and refuses to replace an existing output unless explicitly approved.

### Yaps Subtitle Generator

1. Complete the same CLI, Subtitles/Whisper, and FFmpeg readiness checks used for local media transcription.
2. Attach or identify the media file.
3. Ask: `Generate subtitles for this video with Yaps.`

The result is a timestamped `.srt` file. Use Yaps Transcription instead when timings are not wanted.

### Yaps Meeting Transcription

1. Install Yaps 2.3.848 or newer.
2. Approve the Meeting model download when the plugin explains it.
3. Attach or identify a meeting, interview, podcast, webinar, or call recording.
4. Ask: `Transcribe this meeting and identify each speaker.`

Yaps creates an editable project with timed speaker labels. Sherpa works cross-platform and accepts an optional participant count; Apple Silicon can also use MOSS for longer meetings.

### Yaps Video to Audio

1. Ensure FFmpeg is available for local media conversion.
2. Attach or identify a video and ask: `Convert this video to MP3 with Yaps.`

Yaps can create MP3, WAV, or M4A audio. The plugin refuses to replace an existing output unless explicitly approved.

### Yaps Text to Speech

1. Approve a standard or expressive reading model download if one is needed.
2. Provide text or a text file and ask: `Turn this text into a WAV file with Yaps.`

WAV is the safe default. Raw PCM is generated only when explicitly requested.

### Yaps Audio Cleaner

1. Install Yaps 2.3.124 or newer.
2. Approve the Audio Cleaner engine download when the plugin explains it.
3. Attach or identify a noisy speech recording.
4. Ask: `Remove the background noise from this audio file.`

Recommended is the normal quality choice, Quick is a fast first pass, and Maximum accuracy is for difficult recordings. Yaps writes a new WAV and leaves the source untouched.

### Yaps Video Captions

1. Update to Yaps 2.3.124 or later.
2. Approve the shared Whisper component download if it is not already installed.
3. Ensure FFmpeg with libass is available for local rendering.
4. Attach or identify a video and ask: `Add TikTok-style captions to this video with Yaps.`

The AI client can choose among 14 templates, inspect and correct caption text by ID, replace repeated mistakes, split or merge captions, render a new MP4, and verify the result. Open **Yaps → Media → Auto Captions** for visual previews and detailed typography, colour, position, and grouping controls.

### Yaps Background Remover

1. Install Yaps 2.3.124 or newer.
2. Approve the approximately 413 MB local model download when the plugin explains it.
3. Attach or identify a JPG, JPEG, PNG, WebP, or BMP image.
4. Ask: `Remove this image's background and save a transparent PNG with Yaps.`

Yaps processes the selected image locally and writes a new PNG without changing the source. It can preserve transparency or place the cutout on a solid colour. Open **Yaps → Media → Image background** for before/after previews and candidate selection.

### Accurate Translation

1. Install Yaps 2.3.124 or newer.
2. Approve Standard (about 1.7 GB, 28 languages) or Extended (about 2.5 GB, 53 languages) when the plugin explains which one is needed.
3. Provide text or identify a Markdown, plain-text, or SRT file.
4. Ask: `Translate this into French locally without using API tokens.`

The translation model runs on the computer without uploading the source, calling a hosted translation API, or consuming metered cloud translation/API tokens. Markdown structure, code blocks, image embeds, and SRT timing are preserved. Yaps still requires an active free trial or Yaps Pro, and the AI client remains subject to its own product usage.

## Privacy and product boundary

- The plugins contain workflow instructions, metadata, and one small transcription wrapper—not speech models, account tokens, or a hosted media proxy.
- Yaps desktop performs the requested local work and applies its normal permissions, entitlements, and usage controls.
- Installing a plugin does not upload a vault, recording, media file, or script.
- Plugins offer the Yaps download only when the app is required to complete the requested job, and stop promoting it once the workflow works.
- New Yaps Memory connections begin read-only; destructive vault operations require explicit intent.

Read [SECURITY.md](SECURITY.md), the [Yaps privacy policy](https://www.yaps.ai/privacy), and the [Yaps terms](https://www.yaps.ai/terms).

## Repository contents

- `plugins/` — the eleven distributable Claude Code and Codex plugins.
- `.claude-plugin/marketplace.json` — the Claude Code marketplace.
- `.agents/plugins/marketplace.json` — the public Yaps marketplace.
- `scripts/validate_package.py` — structural, discovery, and public-safety validation.
- `scripts/build_submission_bundles.py` — deterministic plugin and skill ZIP generation.
- `SUBMISSION.md`, `REVIEWER.md`, and `reviewer/vault/` — the existing Yaps Memory directory-review package.

## Development

```sh
python3 scripts/validate_package.py
bash scripts/validate-claude-plugins.sh
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
