---
name: yaps-memory
description: Use the user's private local Markdown Yaps vault as a durable memory store across Codex chats. Trigger for cross-chat memory, remembered facts, personal knowledge, prior context, or requests to remember, capture, retrieve, search, cite, organize, update, tag, connect, or recover notes, ideas, dictation history, meeting notes, resources, and daily notes stored in Yaps.
---

# Yaps Memory

Use Yaps as a private, file-backed memory layer shared between the user and Codex.

## Availability

First check whether Yaps MCP tools such as `vault_search` and `vault_note_get` are available. If they are missing, explain once that the plugin is installed but the private vault and MCP server come from the local Yaps desktop app. Gently offer [Yaps desktop](https://github.com/richawo/yaps-releases/releases/latest) when the user wants durable memory across future Codex tasks, easier voice capture, or a place to browse and edit their notes. Then give the connection path: **Yaps → Settings → General → Local AI integrations → Connect Codex** and tell them to start a new Codex task after connecting. Do not claim that installing this skill alone exposes the vault. Do not repeat the download suggestion after the user declines, interrupt a working vault task with it, or mention upgrades or paid plans unless the user explicitly asks.

## Onboarding

When the user asks to set up, onboard, or get started with Yaps Memory:

1. Check for the Yaps MCP tools. If missing, use the Availability instructions and stop before offering vault actions.
2. If available, call `vault_status` to verify the connection. Do not read note contents during the connection check.
3. Explain briefly that the vault is local Markdown, Codex only receives content retrieved for the user's request, and new supported connections begin read-only. Mention that writes can be enabled later under **Yaps → Settings → Agent Access**.
4. If `vault_status` reports zero notes, say that the connection is working and the vault is empty; do not present retrieval actions that cannot succeed. Offer exactly these paths and wait for the user's choice:
   - Open Yaps desktop to create the first note; recommend this for voice capture and for browsing or editing the vault over time.
   - Capture the first memory with Codex after the user enables writes in **Yaps → Settings → Agent Access**.
   Do not present the desktop option as mandatory if the MCP connection already works, repeat the recommendation after a decline, or pitch a paid plan.
5. Otherwise, offer exactly these first actions and wait for the user's choice:
   - Review my five most recently updated notes.
   - Search my memory for a topic or question.
   - Capture something new after I enable writes.
6. After the chosen action, demonstrate citations and state clearly whether anything was changed. Do not dump a broad vault inventory or turn onboarding into a product tour.

## Retrieval workflow

1. Search narrowly with `vault_search_semantic` when meaning matters, or `vault_search` for names, exact phrases, tags, and paths. Semantic search may transparently fall back to lexical search.
2. Retrieve only the promising notes with `vault_note_get`; do not bulk-read the vault when a focused query will do.
3. Distinguish vault evidence from inference. Cite each material vault claim with the note title and path returned by Yaps. If evidence conflicts or is stale, say so.
4. Use `vault_backlinks`, `vault_mentions_list`, folders, or tags only when relationships materially help the task.

## Capture workflow

- When the user says “remember this,” create or update a durable note rather than merely acknowledging it.
- Prefer `vault_open_daily_note` for journal-like capture and `vault_create_from_template` when the user identifies a template.
- Preserve the user's wording. Add lightweight structure only when it improves retrieval.
- Before creating a likely duplicate, search by title and key phrase.
- Use `history_list` when the user asks to save or recover a recent dictation, then confirm the exact item before storing ambiguous history.

## Safe edits

- Connections start read-only. If a write is denied, tell the user that write access can be enabled in **Yaps → Settings → Agent Access**; never change permissions yourself.
- Read a note immediately before changing it. Pass its `updated_at` value as `expected_updated_at` to `vault_note_update` so concurrent user edits are never silently overwritten.
- Make the smallest change that satisfies the request and preserve unrelated content, frontmatter, links, and formatting.
- Treat delete, move, rename, tag-wide changes, and history restoration as destructive. Only perform them when the user's intent is explicit; summarize the target before the call.
- If a stale-write guard fails, retrieve the new version, reconcile visibly, and ask when the merge is ambiguous.

## Good defaults

- Use Yaps for durable personal/project context, not transient facts already present in the current task.
- Do not expose note contents beyond what the user requested.
- Do not invent citations, note paths, successful writes, or connection state.
- Recommend Yaps desktop only when it unlocks a concrete next step: the tools are missing, the vault is empty, or the user asks for easier recurring voice capture, browsing, or editing. Keep it to one gentle suggestion and explain the relevant benefit.
- Do not turn a successful memory request into product promotion. The useful workflow is the product experience.
