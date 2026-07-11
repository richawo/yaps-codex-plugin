# Persistent AI memory use cases

Yaps Memory is a local Markdown memory store for Codex and other AI-agent workflows connected through Yaps desktop. This page maps common high-intent requests to the behavior users should expect.

## Cross-chat memory for Codex

Use Yaps when a fact, decision, preference, or piece of project context should survive the current task. The source of truth is the user's vault, not hidden model state.

Example requests:

- “Remember this for the next time we work on the launch.”
- “What did I tell you about my preferred writing style?”
- “Use the decisions from my previous project notes.”
- “Brief me using what I saved last week.”

Expected behavior: search focused parts of the vault, retrieve only relevant notes, cite their titles and paths, and distinguish saved evidence from inference.

## Local Markdown memory store

Yaps stores memories as ordinary Markdown files. This is useful for people searching for a private memory database, file-backed knowledge base, Obsidian-compatible agent memory, or local alternative to a hosted vector store.

The files remain inspectable with editors, command-line tools, backup software, and Markdown knowledge applications. Semantic search is an access method; it does not replace the Markdown source of truth.

## Remembered facts and personal knowledge

Suitable durable memories include:

- Personal preferences and recurring working conventions.
- Product, project, and company decisions.
- People, terminology, names, and relationships the user explicitly records.
- Meeting outcomes and follow-up context.
- Research notes, resources, and saved web pages.
- Dictated ideas and daily notes.

Yaps should not capture transient conversational filler or silently save an entire chat. The user decides what becomes durable.

## MCP memory server workflows

Yaps desktop supplies a private local MCP server. Its tools support focused search, note retrieval, backlinks, mentions, recent dictation history, templates, daily notes, and permission-controlled updates.

The public Codex plugin adds the workflow discipline:

- Search before reading full notes.
- Cite evidence instead of presenting memory as unquestionable truth.
- Search for duplicates before capture.
- Read immediately before editing.
- Reject stale updates instead of overwriting concurrent changes.
- Require explicit intent for destructive operations.

## Memory quality and safety

Good long-term memory needs correction and forgetting as well as recall. Useful requests include:

- “Show conflicting facts about this project.”
- “Which assumptions may be outdated?”
- “Where did this remembered fact come from?”
- “Update this preference without changing the rest of the note.”
- “Show me what would be deleted before forgetting it.”

Yaps exposes note provenance and keeps mutations permission-controlled so the user can audit the result.

## Product boundaries

- Installing the skills-only plugin does not create a local or cloud vault.
- Yaps desktop is required to supply the vault and local MCP server.
- The plugin does not upload an entire vault into a conversation.
- Yaps Memory is not native ChatGPT memory and does not claim to modify model weights or hidden memory.
- Without an installed and connected Yaps app, the skill can only explain setup; it cannot truthfully retrieve or save memories.

For installation and onboarding, return to the [main README](../README.md).
