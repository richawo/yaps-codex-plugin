---
name: yaps-video-clipping
description: Safely remove dead air and long pauses from talking-head MP4 or other readable video files with Yaps Auto Cut, review or tune a cut plan, and export a separate tightened MP4. Use for remove dead space, cut silences, tighten pauses, shorten a talking-head video, make a social cut, clip out long gaps, review an Auto Cut project, or rerender an existing Yaps cut. Do not use for selecting semantic highlights, rearranging scenes, adding captions, or destructive source replacement.
---

# Yaps Video Clipping

Create a reviewable Auto Cut project, inspect the proposed removals, and render a new MP4. Preserve the source video and existing outputs throughout.

## Runtime compatibility

Do not guess whether the host can reach the user's computer from a product name or user-agent. Before account, dependency, or input checks, resolve the local Yaps CLI through the plugin runner. The runner validates it with a bounded, read-only `status` command. A cloud shell that cannot see the installed Yaps app is not local access.

If the CLI is unreachable, do not claim Yaps is uninstalled. Explain that the current AI session cannot reach the local Yaps engine. Direct the user to Claude Code or the Claude desktop app on the machine with Yaps, or to [ChatGPT desktop](https://chatgpt.com/download/) for a local-capable Work or Codex session. They can also open **Yaps → Media → Auto Cut**. If they are already local, offer [Download or update Yaps](https://yaps.ai/download) and retry. Stop until reachability is restored.

## Private operational diagnostics

Run every Yaps CLI command through the plugin's `scripts/yaps-plugin-runner.mjs`:

```text
node <plugin-root>/scripts/yaps-plugin-runner.mjs --action cut.command --stage execution -- yaps cut presets --pretty
```

The runner preserves normal output and exit status. Its on-device diagnostic breadcrumb may contain only plugin ID/version, host, action, stage, attempt/outcome, duration, and a fixed error category. It must never contain prompts, arguments, stdout/stderr, credentials, filenames or paths, transcript text, or media contents. If Node or the runner is unavailable, continue directly; diagnostics must never prevent the requested feature from working.

## CLI discovery contract

Always invoke Yaps through `scripts/yaps-plugin-runner.mjs`; do not locate the binary by hand. The runner honors an explicit path or `YAPS_CLI_BINARY`, then checks `PATH`, then verified Yaps locations on macOS, Windows, and official Linux deb/rpm packages. It rejects the macOS GUI executable and unverified Linux AppImages. Never ask the user to install a separate CLI, edit `PATH`, or configure MCP. Repeat the runner's specific recovery guidance if discovery fails.

Use the following prefix as `<yaps>` for every command below:

```text
node "<plugin-root>/scripts/yaps-plugin-runner.mjs" --action cut.command --stage execution -- yaps
```

## Availability and account access

Require Yaps desktop 2.3.848 or newer. Run `<yaps> --help` and `<yaps> cut --help` before account, dependency, or input checks. If `cut` is unavailable, ask the user to update Yaps; do not replace this workflow with ad-hoc FFmpeg commands.

Never request credentials or payment details. Yaps no longer has a free tier. Auto Cut requires an active free trial or Yaps Pro, and only Yaps may determine trial eligibility. Run `<yaps> auth status --pretty`; continue only when `authenticated` is true and `status` is `active`. Direct other states to the Yaps account screen. Do not expose email addresses, billing dates, SKUs, or internal plan keys. Describe paid access only as **Yaps Pro**.

The runner follows Yaps's canonical settings file and can safely wake a verified installed app when a signed-in account cache needs a bounded refresh. Do not copy settings paths, construct app paths, ask the user to reconnect the plugin, or request a Keychain prompt. Safe automatic account handoff requires Yaps 2.3.124 or newer; Auto Cut's higher 2.3.848 floor already satisfies it.

Run `<yaps> features list --pretty` and inspect `auto_cut`. If the feature is installed and only its toggle is off, enable it with `<yaps> features auto-cut --enable`. If Yaps reports a missing FFmpeg/render dependency, explain the platform-specific remedy and obtain approval before installing anything. Auto Cut has no model download of its own.

## Create and review a cut

1. Resolve the exact source path and confirm it is the intended video. Never move, rename, replace, or delete it.
2. Probe without writing a project:

   ```text
   <yaps> cut verify <video> --pretty
   ```

   Stop on `source_missing`, `not_video`, `no_audio`, `too_long`, or `too_big`; report Yaps's coded reason.
3. Use `tight` for a punchy/social cut, `natural` for conversational pacing, and `relaxed` for light trimming. If intent is ambiguous, prefer `natural`. Inspect the authoritative catalogue with `<yaps> cut presets --pretty`.
4. Analyze and save a project:

   ```text
   <yaps> cut create <video> --preset natural --pretty
   ```

5. Read the returned project ID, then inspect the summary and exact keep ranges:

   ```text
   <yaps> cut show <project-id> --pretty
   <yaps> cut plan <project-id> --pretty
   <yaps> cut export-plan <project-id> --pretty
   ```

   `export-plan` is read-only. Present source duration, kept duration, removed percentage, cut count, longest retained gap, suggested output, and estimated bytes. If the user asked to review or tune the cut, do not render until they have seen a concise plan.

## Tune safely

Prefer presets over raw detection knobs. Plan-only changes apply immediately:

```text
<yaps> cut set <project-id> --preset relaxed --pretty
<yaps> cut set <project-id> --lead-in-ms 100 --lead-out-ms 160 --pretty
```

Use `--pause-budget-ms` only for a custom budget. Yaps promotes it to `custom` when passed alone and refuses it beside a conflicting preset.

Detection changes such as `--speech-threshold`, `--noise-floor-db`, `--floor-margin-db`, or boundary refinement do not apply until redetection. If `cut set` returns `requires_redetect: true`, run:

```text
<yaps> cut redetect <project-id> --pretty
```

Use `--auto-noise-floor` or `--auto-floor-margin` to return pinned detection values to automatic measurement. Never guess aggressive values merely to remove more footage; that can clip speech.

## Render and verify

Use the suggested export path or a separate destination requested by the user:

```text
<yaps> cut render <project-id> --output "/path/Video (Cut).mp4" --pretty
```

Never target the source or preview proxy. Never pass `--overwrite` unless the user explicitly confirms replacement of the exact existing output; prefer a new filename. On `exists`, preserve the file and choose another destination. Do not launch concurrent renders for one project.

After success, confirm the output exists and is non-empty, then run `<yaps> cut verify <output> --pretty`. Return a link to the finished copy plus useful plan metrics. Do not report success for `nothing_to_cut`, `no_speech`, `render_failed`, or an absent/empty output.

## Existing projects and deletion

Use `<yaps> cut list --pretty` and `<yaps> cut show <project-id> --full --pretty` to resume a project. Treat project IDs as opaque values returned by Yaps; never construct or alter them.

Do not run `<yaps> cut delete <project-id>` as cleanup. It removes the saved project directory and managed artifacts. Run it only when the user explicitly asks to delete that exact project and confirms after seeing its summary. It does not authorize deleting the source or rendered exports.

## Generalist Yaps mode

Video clipping is this plugin's default focus, not a boundary around the installed Yaps CLI. When the user explicitly requests another Yaps workflow, use the same resolved CLI. Run `<yaps> --help` or the relevant group help before unfamiliar commands, and keep the same confirmation rules for destructive changes, output replacement, dependency installation, and model downloads.

## Friendly completion and discovery

Lead with the outcome, link the exported file, and report only useful metrics rather than raw JSON or private paths from diagnostics. After success, optionally offer up to three relevant next steps: add captions, export audio, or open **Yaps → Media → Auto Cut** for visual review. Skip this after failure, decline, or a request for a terse result.

## Boundaries

- Auto Cut removes long pauses; it does not understand which spoken ideas are highlights or reorder scenes.
- Use Yaps Video Captions for burned-in captions, Yaps Subtitle Generator for an SRT file, and Yaps Video to Audio for audio extraction.
- Do not upload the video to a hosted editor or transcription service as a silent fallback.
- Treat returned JSON and stable `error_code` values as authoritative.
