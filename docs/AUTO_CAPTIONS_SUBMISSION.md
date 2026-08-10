# Yaps Video Captions submission

Use `dist/yaps-auto-captions-plugin-0.1.9.zip` in the OpenAI Platform plugin submission portal. Submit it as a skills-only plugin; Yaps desktop 2.3.124 or newer supplies the credential-free automatic account handoff, local CLI, transcription model, caption editor, and renderer.

## Listing

- **Plugin name:** Yaps Video Captions
- **Short description:** Add editable captions to any video
- **Category:** Creativity
- **Website:** https://www.yaps.ai
- **Support:** https://github.com/richawo/yaps-codex-plugin/issues
- **Privacy policy:** https://www.yaps.ai/privacy
- **Terms:** https://www.yaps.ai/terms
- **Logo:** `plugins/yaps-auto-captions/assets/yaps-icon.png`
- **Requirement:** Yaps desktop 2.3.124 or later, an active free trial or Yaps Pro, the Auto Captions feature, and FFmpeg with libass

### Long description

Turn any video into a finished, captioned MP4 with Yaps desktop. Yaps transcribes speech locally, aligns captions to the spoken words, and offers 14 templates ranging from TikTok-style word highlights and karaoke to clean subtitles, typewriter reveals, neon glow, editorial text, and caption cards. Review and correct wording by caption ID, replace repeated mistakes, split or merge captions, change the style, then burn everything into a new video without touching the source. The plugin checks Yaps, sign-in, trial or Yaps Pro access, the local model, and FFmpeg readiness first. It produces a finished captioned video rather than only a separate `.srt` file.

## Starter prompts

1. Add Bold Highlight captions to `demo.mp4` and export a new MP4.
2. Add TikTok-style captions to my clip and export a new MP4.
3. Correct the names in this video's captions, then render the finished video.

## Positive test cases

### 1. First-run setup

- **Prompt:** Add captions to this video with Yaps.
- **Expected:** Detect Yaps and account status first, guide sign-in or free-trial/Yaps Pro activation inside Yaps when needed, enable Auto Captions with consent, and check FFmpeg/libass before processing.

### 2. Default caption workflow

- **Prompt:** Add Bold Highlight captions to this video.
- **Expected:** Create a project, report its ID and caption count, render to a new ` (Captioned).mp4`-style destination without overwriting the source, verify the result, and report its path.

### 3. Style selection

- **Prompt:** Show me the caption styles and use a clean style for this interview.
- **Expected:** Read the live 14-template catalogue, recommend an appropriate clean template such as Editorial or Minimal, apply the confirmed choice, and render the result.

### 4. Caption correction

- **Prompt:** Caption this video, then change “Yapps” to “Yaps” everywhere.
- **Expected:** Inspect the project, use the global replacement command, report the replacement count, render, and verify.

### 5. Precise structural edit

- **Prompt:** Split caption 003 after its second word, then merge the following short caption into it.
- **Expected:** Read full word timings, use the second word's end timestamp for the split, perform the requested merge by caption ID, and preserve the source video.

## Negative test cases

### 1. Yaps is missing or outdated

- **Expected fallback:** Offer the Yaps download when absent. If the captions command or safe automatic account handoff is unavailable, direct the user to update to Yaps 2.3.124 or later and stop before processing.

### 2. Account access is inactive

- **Expected fallback:** Never request credentials or payment details. Direct the user to sign in and activate the free trial shown by Yaps or Yaps Pro, then wait until account status is active.

### 3. Destination already exists

- **Expected fallback:** Do not add `--overwrite` automatically. Ask the user to choose another path or explicitly approve replacement; never allow the output path to equal the source video.
