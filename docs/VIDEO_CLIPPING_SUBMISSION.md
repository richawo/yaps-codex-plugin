# Yaps Video Clipping submission

Use `dist/yaps-video-clipping-plugin-0.1.0.zip` in the OpenAI Platform plugin submission portal. Submit it as a skills-only plugin; Yaps desktop 2.3.848 or newer supplies the credential-free account handoff, local CLI, speech detector, saved Auto Cut projects, FFmpeg/ffprobe tools, and renderer.

## Listing

- **Plugin name:** Yaps Video Clipping
- **Short description:** Remove dead space from videos
- **Category:** Creativity
- **Website:** https://www.yaps.ai
- **Support:** https://github.com/richawo/yaps-codex-plugin/issues
- **Privacy policy:** https://www.yaps.ai/privacy
- **Terms:** https://www.yaps.ai/terms
- **Logo:** `plugins/yaps-video-clipping/assets/yaps-icon.png`
- **Requirement:** Yaps desktop 2.3.848 or later, an active free trial or Yaps Pro, Auto Cut enabled, and working FFmpeg/ffprobe render dependencies

### Long description

Tighten talking-head videos with Yaps desktop by detecting speech, removing dead air and long pauses, and exporting a separate MP4 without touching the source. Review the exact keep ranges and estimated result before rendering, choose Tight, Natural, or Relaxed pacing, adjust safe boundary padding, redetect only when detection settings change, and verify the finished file. The plugin checks local Yaps reachability, Yaps 2.3.848 or newer, sign-in, active free trial or Yaps Pro access, Auto Cut readiness, and FFmpeg before processing the selected video.

### Preview assets

The Codex plugin manifest accepts PNG screenshots, not an embedded MP4 preview. A representative before/after clip can still be used in two ways:

1. Extract two or three clean PNG frames or a side-by-side before/after graphic and add them under the plugin's `assets/` directory, then reference them through `interface.screenshots`.
2. Host the full clip on the Yaps website and link it from the attributed plugin landing page.

Do not add the clip itself to the plugin archive until the manifest or submission portal explicitly supports video listing media. Keep screenshot assets free of private filenames, paths, account data, or unrelated UI.

## Starter prompts

1. Remove dead space from this talking-head video and export a new MP4.
2. Show me a Natural cut plan for this video before rendering it.
3. Make this social clip punchier by tightening its long pauses.

## Positive test cases

### 1. First-run readiness

- **Prompt:** Remove dead space from this video with Yaps.
- **Expected:** Resolve the packaged CLI first, require Yaps 2.3.848 or newer, verify active account access, enable Auto Cut automatically when only its toggle is off, check FFmpeg/ffprobe, and verify the exact source before analysis.

### 2. Natural reviewed workflow

- **Prompt:** Show me a Natural cut plan for this video before rendering it.
- **Expected:** Verify the input, create a Natural project, inspect its summary and exact keep ranges, report source and kept duration, removed percentage, cut count, longest retained gap, suggested destination, and estimated size, then wait for review before rendering.

### 3. Punchy social cut

- **Prompt:** Make this social clip punchier and export a new MP4.
- **Expected:** Select the Tight preset from the user's intent, render to a separate destination, confirm a non-empty output, verify its audio/video streams, and return the useful plan metrics.

### 4. Safe pacing adjustment

- **Prompt:** Keep a little more breathing room and add 100 ms before each line and 160 ms after it.
- **Expected:** Update the existing project to Relaxed or the explicitly requested padding, re-plan from cached speech runs without redetecting, show the revised metrics, and preserve the source and previous exports.

### 5. Detection adjustment with redetection

- **Prompt:** Return the noise floor to automatic measurement and redetect this project.
- **Expected:** Apply the automatic detection value, recognize that the change requires redetection, run it once, inspect the revised plan, and avoid guessing aggressive thresholds.

## Negative test cases

### 1. Missing, unsupported, or speechless input

- **Expected fallback:** Stop on `source_missing`, `not_video`, `no_audio`, `too_long`, `too_big`, or `no_speech`. Report the coded reason and do not create a fake success or silently switch to another editor.

### 2. Existing or unsafe output destination

- **Expected fallback:** Never render to the source or preview proxy. If the destination exists, do not add `--overwrite` automatically; choose a new filename or obtain explicit confirmation for that exact file.

### 3. Destructive cleanup request is ambiguous

- **Expected fallback:** Do not delete saved projects merely because a render completed. Show the exact project summary and require explicit confirmation before `cut delete`; never interpret project deletion as permission to delete source videos or exports.
