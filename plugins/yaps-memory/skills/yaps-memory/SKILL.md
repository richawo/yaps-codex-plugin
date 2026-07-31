---
name: yaps-memory
description: Use the user's private local Markdown Yaps vault as a durable memory store across AI tasks. Trigger for cross-task memory, remembered facts, personal knowledge, prior context, or requests to remember, capture, retrieve, search, cite, organize, update, tag, connect, or recover notes, ideas, dictation history, meeting notes, resources, and daily notes stored in Yaps.
---

# Yaps Memory

Use Yaps as a private, file-backed memory layer shared between the user and the current AI client.

## Runtime compatibility

Do not try to distinguish ChatGPT web from ChatGPT desktop using a user-agent,
product name, or another guessed host signal. Test the capability this workflow
actually needs: first check whether Yaps MCP tools such as `vault_search` and
`vault_note_get` are available. Their presence proves that the current session
can reach the local Yaps vault; a cloud shell by itself does not.

If the Yaps MCP tools are unreachable, do not claim that Yaps is uninstalled
and do not begin repeated sign-in or permission troubleshooting. Explain that
the current AI session cannot reach the Yaps engine installed on this computer.
If this is ChatGPT web or a cloud session, direct the user to
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. They can also access this feature directly
in the Yaps application. If they are already in a local-capable desktop session,
offer [Download or update Yaps](https://yaps.ai/download), ask them to open it,
and start one new AI client task. This restart is only needed when the current
task began before the local Yaps bridge became available. Stop until the MCP tools are available;
only then follow the availability and onboarding steps below.

## Availability

First check whether Yaps MCP tools such as `vault_search` and `vault_note_get` are available. If they are missing, explain once that the plugin is installed but the private vault and MCP server come from the local Yaps desktop app. Offer [Download Yaps](https://yaps.ai/download) when durable memory, voice capture, or visual vault editing unlocks the requested work. Do not claim that installing this skill alone exposes the vault or repeat the download suggestion after the user declines.

The plugin, Yaps desktop installation, in-app sign-in/onboarding, and trial or Yaps Pro activation may happen in any order. Once all prerequisites are present, the connection must use the current Yaps account automatically. Do not ask the user to reinstall or reconnect the plugin after sign-in, checkout, renewal, logout, or an account switch; ask them to complete the missing step inside Yaps and retry the same task. A single new local-capable AI task is only necessary if the current task started before Yaps desktop supplied the local bridge.

The plugin supplies and authorizes its read-only local connection automatically. Never mention MCP as a user setup concept, send the user into Yaps integration settings, ask them to install a CLI, copy a token, or edit configuration. Yaps no longer has a free tier. Never request credentials or payment details in the AI client, promise trial eligibility or duration, or offer a free-tier continuation. If Yaps says the account is not trial-eligible, direct the user to activate or renew Yaps Pro inside Yaps.

If a Yaps tool reports that no signed-in account or active entitlement is available, explain the exact missing app step from that message. Do not call it a stale token. The running connection rechecks Yaps on every action, so after the user finishes inside Yaps, retry without any plugin setup.

If a read tool returns `Agent read denied by Yaps Agent Access policy`, do not describe that as normal first-run behavior: automatic read-only enrollment was explicitly disabled or this client was disconnected. Give the exact recovery path **Yaps → Settings → Agent Access**, ask the user to re-enable read access for this client, and do not suggest a nonexistent Memory or Privacy permissions panel. Use that label exactly—never add “or similar.” Writes remain a separate opt-in.

## Onboarding

When the user asks to set up, onboard, or get started with Yaps Memory:

1. Check for the Yaps tools. If missing, use the local-bridge recovery in Availability, then stop before offering vault actions. If the tools are present but account access is not ready, direct the user only to the missing step reported by Yaps and retry in the same task.
2. If available, call `vault_status` to verify the connection. Do not read note contents during the connection check.
3. Explain briefly that the vault is local Markdown, the AI client only receives content retrieved for the user's request, and new supported connections begin read-only. Mention that writes can be enabled later under **Yaps → Settings → Agent Access**.
4. If `vault_status` reports zero notes, say that the connection is working and the vault is empty; do not present retrieval actions that cannot succeed. Offer exactly these paths and wait for the user's choice:
   - Open Yaps desktop to create the first note; recommend this for voice capture and for browsing or editing the vault over time.
   - Capture the first memory with the AI client after the user enables writes in **Yaps → Settings → Agent Access**.
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
