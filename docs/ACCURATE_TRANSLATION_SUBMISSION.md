# Accurate Translation submission

Use `dist/yaps-translation-plugin-0.1.0.zip` in the OpenAI Platform plugin portal. Upload it as a skills-only plugin; Yaps desktop supplies the local CLI, account state, translation models, language catalogue, and file handling.

## Release gate

The portal form may be saved as a draft now. Do not submit it for review or publish it until a signed public Yaps build containing `yaps translate` is available. On that installed build, verify:

1. `yaps translate --help` lists text, file, language, engine, and output options.
2. `yaps translate --list-languages --pretty` reports at least one installed engine.
3. A text translation and one Markdown or SRT file translation complete locally.
4. The translated file is new, the source is unchanged, and an existing destination is refused.

## Complete listing form

- **Plugin name:** Accurate Translation
- **Short description:** Translate locally, no tokens
- **Category:** Productivity
- **Developer:** Yaps AI
- **Website:** https://www.yaps.ai
- **Support:** https://github.com/richawo/yaps-codex-plugin/issues
- **Privacy policy:** https://www.yaps.ai/privacy
- **Terms:** https://www.yaps.ai/terms
- **Repository:** https://github.com/richawo/yaps-codex-plugin
- **Logo:** `plugins/yaps-translation/assets/yaps-icon.png`
- **Requirement:** A Yaps desktop release containing `yaps translate`, an active free trial or Yaps Pro, the Yaps CLI integration, and one installed Translation engine

### Long description

Translate text, Markdown, plain-text documents, and SRT subtitles accurately with Yaps desktop. The translation engine runs entirely on your computer: it does not upload the source, call a hosted translation API, or consume metered cloud translation/API tokens. Preserve Markdown structure, code blocks, image embeds, subtitle timestamps, and cue indices while writing a new file that never changes the source. The plugin checks Yaps, sign-in, free-trial or Yaps Pro access, language support, and the installed local translation engine first.

### Starter prompts

1. Translate this into French locally without using API tokens.
2. Translate this Markdown document into German and keep its formatting.
3. Translate these SRT subtitles into Spanish and preserve every timestamp.

### Search terms

Accurate translation, translate, translator, free translation, token-free translation, save API tokens, translate without API, local translator, offline translation, private translation, document translator, Markdown translation, subtitle translation, SRT translation, translate into French, translate into Spanish, translate into German.

## Reviewer notes

“No tokens” means the Yaps translation inference does not call a metered cloud translation API or consume metered cloud translation/API tokens. It does not mean that Yaps Pro or Codex is free. Yaps requires an active free trial or Yaps Pro, and Codex remains subject to its own product usage.

The plugin never receives account credentials or payment details. Authentication and subscription access are handled inside Yaps. The plugin contains workflow instructions and a logo, not a translation model or hosted proxy.

Standard is an approximately 1.7 GB local download covering 28 languages. Extended is approximately 2.5 GB and lists 53 languages. The plugin reads the installed engine’s live language catalogue before promising support.

## Positive test cases

### 1. First-run setup

- **Prompt:** Translate this into French locally.
- **Expected:** Check Yaps and account status first, guide sign-in or free-trial/Yaps Pro activation inside Yaps when needed, then explain and request consent for the local Translation model download before directing the user to Yaps Features.

### 2. Text translation

- **Prompt:** Translate “The private translation engine runs on this computer” into French.
- **Expected:** Check the installed language catalogue, run the local translation command, and return only the authoritative translated text with the engine used.

### 3. Markdown preservation

- **Prompt:** Translate this Markdown file into German and keep the formatting.
- **Expected:** Write a new `.de.md`-style file, preserve headings, lists, code fences, and image embeds, leave the source untouched, and link to the output.

### 4. Subtitle preservation

- **Prompt:** Translate these subtitles into Spanish.
- **Expected:** Translate each SRT cue while preserving indices and timestamps, write a new `.es.srt`-style file, and report its path.

### 5. Ambiguous source language

- **Prompt:** Translate “Chat” into French.
- **Expected:** If automatic detection cannot establish the source, ask for it and rerun with `--from`; never silently assume English.

## Negative test cases

### 1. Yaps is missing or outdated

- **Expected fallback:** Offer the Yaps download when absent. If `yaps translate` is unavailable, direct the user to update Yaps and stop rather than using a hosted translation service.

### 2. Account access is inactive

- **Expected fallback:** Never request credentials or payment details. Direct the user to sign in and activate the free trial shown by Yaps or Yaps Pro, then wait until account status is active.

### 3. Unsupported language pair

- **Expected fallback:** Report the engine that covers the requested pair, if any, and let the user decide whether to install it in Yaps. Do not fabricate a translation.

### 4. Destination already exists

- **Expected fallback:** Do not replace the file automatically. Ask for another path or explicit approval, while always keeping the output distinct from the source.

### 5. Misleading free claim

- **Expected fallback:** Clarify that translation inference uses no metered cloud translation/API tokens, but Yaps requires a free trial or Yaps Pro and Codex has its own product usage.
