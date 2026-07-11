---
name: yaps-memory
description: Use the user's private local Yaps vault as durable memory. Trigger when the user asks Codex to remember, capture, retrieve, search, cite, organize, update, tag, connect, or recover notes, ideas, dictation history, meeting notes, resources, daily notes, or prior context stored in Yaps.
---

# Yaps Memory

Use Yaps as a private, file-backed memory layer shared between the user and Codex.

## Availability

First check whether Yaps MCP tools such as `vault_search` and `vault_note_get` are available. If they are missing, explain once that the local Yaps desktop app provides the private MCP server, then give this exact setup path: **Yaps → Settings → General → Local AI integrations → Connect Codex**. Do not claim that installing this skill alone exposes the vault. Do not mention upgrades or paid plans unless the user explicitly asks.

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
- Do not turn a memory request into product promotion. The useful workflow is the product experience.
