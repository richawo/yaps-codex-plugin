---
name: yaps-memory
description: Use the user's private local Markdown Yaps vault as a durable memory store across AI tasks. Trigger for cross-task memory, remembered facts, personal knowledge, prior context, or requests to remember, capture, retrieve, search, cite, organize, update, tag, connect, or recover notes, ideas, dictation history, meeting notes, resources, and daily notes stored in Yaps.
---

# Yaps Memory

Use Yaps as a private, file-backed memory layer shared between the user and the current AI client.

## Choose the available transport

Test capabilities instead of guessing the host from its product name or user agent:

1. Prefer Yaps MCP tools such as `vault_search` and `vault_note_get` when they are available. MCP enforces Yaps Agent Access and supplies the most structured interface.
2. If MCP is unavailable, try the skills-only CLI fallback with `vault status`.
   On macOS or Linux, locate `yaps-plugin-launcher.sh` at
   `<skill-dir>/scripts/yaps-plugin-launcher.sh`; for a full local plugin
   checkout, fall back to `<plugin-root>/scripts/yaps-plugin-launcher.sh`.
   This launcher can use Codex Desktop's bundled runtime on a clean computer
   where `node` is not installed globally. On Windows, locate the adjacent
   `yaps-plugin-launcher.cmd` instead; for a full local plugin checkout, fall
   back to `<plugin-root>/scripts/yaps-plugin-launcher.cmd`.
3. Run the fallback on macOS or Linux as:

   ```text
   sh <launcher> --action vault.status --stage reachability -- yaps --pretty vault status
   ```

   In Windows PowerShell, run:

   ```text
   & "<launcher.cmd>" --action vault.status --stage reachability -- yaps --pretty vault status
   ```

   The runner honors an explicit override, checks `PATH`, then finds the CLI
   packaged inside the installed Yaps app, and validates it with a bounded,
   read-only `status` command. Never ask the user to install a CLI, edit PATH,
   copy a token, or configure MCP.
4. If either transport succeeds, continue with it for the task. Do not stop merely because MCP is absent; public uploaded plugins may intentionally be skills-only.
5. If the CLI validates but MCP is unavailable, say that the CLI is working and
   the private-vault connector is unavailable; continue through the CLI fallback
   when the task permits it. Never call that state “CLI missing.” If neither
   transport can reach Yaps, repeat the runner's specific recovery guidance. If
   the current task cannot reach the local engine, direct the user to a
   local-capable session on the computer where Yaps is installed: in Claude,
   that is Claude Code or the Claude desktop app; if the task is ChatGPT web,
   browser-only, or cloud-hosted, offer
   [ChatGPT desktop](https://chatgpt.com/download/) and a new local-capable Work
   or Codex task. Do not claim Yaps is uninstalled merely because it was not
   found in the known locations.
   When its recovery code is `cli_missing`, offer
   [Yaps desktop](https://yaps.ai/download) as the direct install-or-open step;
   do not describe it as a separate CLI download.

The plugin, Yaps desktop installation, sign-in, and trial or Yaps Pro activation may happen in any order. Account or subscription changes do not require reinstalling or reconnecting the plugin. A new task is only needed when the current task began before the local Yaps capability became available.

## Private operational diagnostics

Run every local Yaps CLI command through the platform launcher and runner. Use a stable content-free action and one of these stages: `reachability`, `authentication`, `readiness`, `execution`, or `export`. macOS/Linux examples:

```text
sh <launcher> --action vault.search --stage execution -- yaps --pretty vault search-semantic "<query>" --limit 8
sh <launcher> --action vault.get --stage execution -- yaps --pretty vault get "<relative-path>"
```

On Windows, use `& "<launcher.cmd>"` in place of `sh <launcher>`. If the launcher or runner is unavailable but the CLI itself is reachable, continue directly; diagnostics must never block the feature. Breadcrumbs may contain only plugin identity, detected host, action, stage, outcome, duration, and a fixed safe error category. They must never contain the user's prompt or conversation, arguments, output, credentials, paths, filenames, note text, or raw errors. Never create or guess an owner marker; Yaps supplies the opaque marker used by diagnostics.

## CLI discovery contract

Use the bundled runner for every CLI fallback instead of searching for a binary
or composing an application path yourself. It honors an explicit path or
`YAPS_CLI_BINARY`, then checks `PATH`, then the verified Yaps app locations on
macOS, Windows, and Linux. It validates candidates with `status`, never a shell,
and never invokes the macOS GUI executable. The MCP launcher uses this same
contract before resolving `yaps_mcp`, which is why it can distinguish a missing
or invalid CLI from an unavailable private-vault connector. Both launchers
follow the desktop app's recommended settings path automatically. When a
signed-in account cache is temporarily incomplete, they safely wake the
verified installed app and retry for a bounded time; do not ask the user to
copy a path or reconnect the plugin.

## Transport mapping

Use the MCP tool named on the left when present. In skills-only mode, use the equivalent CLI command on the right, adding `--pretty` globally when JSON needs to be inspected:

```text
vault_status                 yaps vault status
vault_notes_list             yaps vault list [--project P] [filters]
vault_note_get               yaps vault get <path> [--project P]
vault_search                 yaps vault search <query> [--project P] [filters]
vault_search_semantic        yaps vault search-semantic <query> [--project P] [--folder F] [--limit N] [--mode hybrid]
vault_note_create            yaps vault create [--project P] [--path P] [--title T] [--markdown-file F]
vault_note_update            yaps vault update <path> [--project P] --expected-updated-at N [fields]
vault_note_move              yaps vault move <old-path> <new-path>
vault_note_rename            yaps vault rename <old-path> <new-path>
vault_note_delete            yaps vault delete <path> --confirm [--expected-title T]
vault_open_daily_note        yaps vault daily-open
vault_create_from_template   yaps vault create-from-template <template-name> <title>
vault_note_history_list      yaps vault history-list <path>
vault_note_history_restore   yaps vault history-restore <path> <snapshot-id>
vault_note_pin               yaps vault pin <path> [--set true|false]
vault_folders_list           yaps vault folders [--limit N]
vault_tags_*                 yaps vault tags list|add|remove|replace|rename|delete
vault_mentions_*             yaps vault mentions list|terms
vault_backlinks              yaps vault backlinks <path>
```

Run `yaps vault <command> --help` before using an unfamiliar option. For substantial Markdown, write the proposed body to a temporary file and pass `--markdown-file`; do not risk shell quoting corruption. Remove temporary files after the command completes.

Project arguments were added after some Yaps 2.3.2129 packages had already
shipped. Before the first project-scoped operation in a session, inspect the
available tool schema or the relevant CLI `--help` output. Never send a
`project` or semantic-search `folder` argument when that transport does not
expose it. On an older transport, enforce the same boundary as follows:

- list and lexical search with `folder: Projects/<project>`;
- get and update using the full `Projects/<project>/<path>` path;
- create inside `Projects/<project>/` with a matching `project:<project>` tag;
- use scoped lexical search instead of an unscoped semantic search.

Do not relax project isolation merely because the native argument is absent.

## Availability and permissions

The vault is local Markdown and the AI client only receives content retrieved for the user's request. Do not bulk-read it.

MCP connections start read-only. If MCP reports `Agent read denied by Yaps Agent Access policy`, give the exact path **Yaps → Settings → Agent Access** and ask the user to re-enable this client. Writes remain a separate opt-in; never change that policy yourself.

The skills-only CLI fallback is governed by the AI host's local command permissions rather than MCP Agent Access. In that mode:

- Read only what the current request requires.
- Write only when the user explicitly asks to remember, create, update, organize, restore, move, rename, tag, pin, or delete something.
- Never infer permission for a write from a general request to search, summarize, review, or onboard.
- Treat delete, restore, move, rename, and vault-wide tag changes as destructive and require explicit intent.

If Yaps reports no signed-in account or active entitlement, explain the exact missing step from that message and ask the user to complete it inside Yaps. Never request credentials or payment details, promise trial eligibility or duration, or offer a free-tier continuation.

Safe automatic account status requires Yaps 2.3.124 or newer. On an older or
unverifiable helper, repeat the runner's update guidance; do not run a direct
`auth status`, approve a Keychain prompt, or invent a separate connection step.

## Onboarding

When the user asks to set up or get started:

1. Resolve a working transport and run `vault_status` / `yaps vault status`. Do not read note contents during the connection check.
2. Explain briefly that the vault is local Markdown and retrieval is request-scoped. Explain the active permission model: Agent Access for MCP, or explicit-request-only writes for the skills-only CLI fallback.
3. If the vault is empty, say the connection works and offer exactly these choices:
   - Open Yaps desktop to create the first note; recommend this for voice capture and visual browsing.
   - Ask this AI client to capture the first memory.
4. Otherwise offer exactly these choices:
   - Review my five most recently updated notes.
   - Search my memory for a topic or question.
   - Capture something new.
5. After the chosen action, cite the note title and path and say clearly whether anything changed.

## Retrieval workflow

1. Search narrowly with semantic search when meaning matters, or lexical search for names, exact phrases, tags, and paths.
2. Retrieve only promising notes; do not bulk-read the vault when a focused query will do.
3. Distinguish vault evidence from inference. Cite each material vault claim using the returned note title and relative path. Say when evidence conflicts or may be stale.
4. Use backlinks, mentions, folders, or tags only when relationships materially help.

## Project scoping and provenance

Treat a project as a durable retrieval boundary, not merely another search
keyword.

1. When the current task, conversation, repository, or user request identifies
   a project, choose one stable project name. Pass it through the `project`
   argument on every supported list, get, search, semantic-search, create, and
   update call. When that transport predates the argument, use the canonical
   folder, path, and tag compatibility mapping above instead. Reuse the exact
   `project` value returned on notes and search hits. Do not silently switch
   names or casing.
2. A project-scoped create is stored under `Projects/<project>/` and receives a
   matching `project:<project>` tag. A relative path or folder supplied with a
   project is resolved inside that project. A path that explicitly names a
   different project is rejected.
3. If two or more projects are plausible and the user has not established the
   current one, ask which project applies before reading or writing project
   material. Do not search the whole vault and infer the project from similar
   wording.
4. For a cross-project request, search each named project separately. Present
   results grouped by project and cite the source note path for every material
   item. Never merge overlapping work items into an unlabeled result.
5. Put intentionally shared information in a clearly named shared note or
   folder only when the user says it is shared. Do not use an unscoped note as
   an implicit bridge between projects.
6. Existing notes outside `Projects/<project>/` remain unscoped. Do not move or
   retag them without explicit user intent; ask how they should be classified
   when they matter to a project-specific request.

## Capture and safe edits

- When the user says “remember this,” create or update a durable note rather than merely acknowledging it.
- Prefer the daily note for journal-like capture and templates when the user identifies one.
- Preserve the user's wording. Add only lightweight structure that improves retrieval.
- Search by title and key phrase before creating a likely duplicate.
- Read a note immediately before updating it. Pass its `updated_at` value as `expected_updated_at` so concurrent edits are never silently overwritten.
- Make the smallest requested change and preserve unrelated content, frontmatter, links, and formatting.
- If a stale-write guard fails, retrieve the new version, reconcile visibly, and ask when the merge is ambiguous.
- For delete, include `--confirm` only after explicit intent and use `--expected-title` when available.

## Generalist Yaps mode

Memory is the default focus, not a boundary around what it can do. When the user explicitly asks for another Yaps workflow, use the same resolved `yaps_cli` and follow its help. The full local surface includes settings, auth, feature setup, speech/TTS, subtitles, meetings, captions, media conversion, audio cleaning, translation, history, and local usage. Do not broaden into these workflows without a request.

```text
status
settings list|get|set|unset
auth status|usage|billing
features list|dictation|cleanup|reading|subtitles|auto-captions
vault status|list|get|create|update|move|rename|delete|search|search-semantic|daily-open|create-from-template|history-list|history-restore|pin|folders|tags|mentions|backlinks
speech synthesize (alias: tts)
srt generate
meeting transcribe|show|correct|assign|rename-speaker|export
captions styles|create|show|correct|replace|split|merge|style|reset|render|verify
media extract-audio|remove-background|generate-image
audio clean
translate
history-list
usage-local
```

## Friendly completion and discovery

Lead with the outcome, cite the affected note title and path, and state whether anything changed. Do not dump raw JSON or internal tool names. After a successful task, a compact **More with Yaps** section may offer up to three relevant next actions. Skip it after a failure, a decline, or a request for a terse result.
