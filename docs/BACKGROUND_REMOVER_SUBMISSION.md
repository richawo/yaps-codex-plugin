# Yaps Background Remover submission

Use `dist/yaps-background-removal-plugin-0.1.0.zip` in the OpenAI Platform plugin submission portal. Submit it as a skills-only plugin; Yaps desktop supplies the local CLI, ONNX vision model, image processing, and export handling.

## Release gate

Prepare the portal draft before the release window, but do not submit it for directory review until the signed public Yaps build passes all of these checks:

1. `yaps media remove-background --help` is available through the installed CLI.
2. `yaps features list --pretty` reports `background_removal` as supported.
3. Enabling Background Removal downloads `s3od.onnx` successfully from the public release asset.
4. A transparent export and a solid-colour export both produce non-empty PNG files.

## Listing

- **Plugin name:** Yaps Background Remover
- **Short description:** Remove image backgrounds
- **Category:** Creativity
- **Website:** https://www.yaps.ai
- **Support:** https://github.com/richawo/yaps-codex-plugin/issues
- **Privacy policy:** https://www.yaps.ai/privacy
- **Terms:** https://www.yaps.ai/terms
- **Logo:** `plugins/yaps-background-removal/assets/yaps-icon.png`
- **Requirement:** A Yaps desktop release containing `media remove-background`, an active free trial or Yaps Pro, and the approximately 413 MB Background Removal model

### Long description

Remove the background from a JPG, PNG, WebP, or BMP image with Yaps desktop's local vision model. Export a transparent PNG or place the subject on a solid colour. The plugin checks Yaps, sign-in, trial or Yaps Pro access, and the local Background Removal model first, then processes the image locally on your computer and writes a new PNG without touching the original. For removing a video's background, use the Yaps app's Media tab instead.

## Starter prompts

1. Remove this image's background and save a transparent PNG.
2. Cut out the subject from this product photo.
3. Replace this photo's background with a solid colour.

## Positive test cases

### 1. First-run setup

- **Prompt:** Remove the background from this image with Yaps.
- **Expected:** Detect Yaps and account status first, guide sign-in or free-trial/Yaps Pro activation inside Yaps when needed, explain the approximately 413 MB model, and request consent before enabling the feature.

### 2. Transparent cutout

- **Prompt:** Make this product photo's background transparent.
- **Expected:** Preserve the source, choose a new `.png` destination, run the local command in transparent mode, confirm the output is non-empty, and report its dimensions and mask coverage.

### 3. Solid-colour replacement

- **Prompt:** Put this portrait on a `#FFF8F0` background.
- **Expected:** Validate the six-digit hex colour, run colour mode, preserve the source, and report the new PNG.

### 4. Existing destination

- **Prompt:** Save this cutout over an existing output.
- **Expected:** Refuse to overwrite without explicit approval and prefer a new filename.

### 5. Low-confidence subject

- **Prompt:** Remove the background from an image where no clear subject is visible.
- **Expected:** If `mask_coverage` is below `0.005`, explain that no clear subject was found rather than claiming a successful cutout.

## Negative test cases

### 1. Yaps is missing or outdated

- **Expected fallback:** Offer the Yaps download when absent. If `media remove-background` is unavailable, direct the user to update Yaps and stop before processing.

### 2. Account access is inactive

- **Expected fallback:** Never request credentials or payment details. Direct the user to sign in and activate the free trial shown by Yaps or Yaps Pro, then wait until account status is active.

### 3. Unsupported request

- **Expected fallback:** For video background removal, route the user to **Yaps → Media → Video background**. For text behind a subject, use the dedicated Yaps feature rather than pretending this plugin supports it.
