# Yaps Memory — persistent local Markdown memory for Codex and AI agents

[![Validate plugin](https://github.com/richawo/yaps-codex-plugin/actions/workflows/validate.yml/badge.svg)](https://github.com/richawo/yaps-codex-plugin/actions/workflows/validate.yml)
[![Latest plugin release](https://img.shields.io/github/v/release/richawo/yaps-codex-plugin?label=plugin)](https://github.com/richawo/yaps-codex-plugin/releases/latest)
[![MIT licensed](https://img.shields.io/badge/plugin-MIT-1D1D1F.svg)](LICENSE)
[![Local first](https://img.shields.io/badge/memory-local--first-D4775B.svg)](https://www.yaps.ai/privacy)

**Yaps Memory gives Codex durable, cross-chat memory through private Markdown files on your computer.** It lets AI agents recall facts and prior context, search personal knowledge, cite the exact notes behind an answer, capture new memories, and update a user-owned vault safely through a local MCP server.

Use it when you want a private alternative to opaque model memory: a persistent memory store that you can inspect, edit, back up, search with ordinary tools, or open in Markdown-compatible apps such as Obsidian.

> Yaps Memory is not hidden ChatGPT or model memory. The vault is an explicit collection of local Markdown files supplied by [Yaps desktop](https://www.yaps.ai/). The plugin alone does not create, host, or upload a vault.

## What Yaps Memory solves

| Need | Yaps Memory behavior |
| --- | --- |
| Remember facts across Codex chats | Stores durable context in the same user-controlled vault and retrieves it in future connected tasks. |
| Understand why an agent believes something | Cites the source note title and path for material vault claims. |
| Keep AI memory private | Runs through the local Yaps MCP server; vault files remain on the user's machine. |
| Avoid stale or overwritten memories | Surfaces conflicting evidence and uses optimistic concurrency checks before updates. |
| Own and move your knowledge | Uses ordinary Markdown rather than a proprietary cloud database. |
| Capture ideas without maintaining a second brain manually | Turns explicit “remember this” requests and selected dictation history into structured notes. |

## Example workflows

- **Cross-chat memory:** “What did I decide about the launch date? Cite the notes you used.”
- **Remembered facts:** “Remember that weekly project updates should put decisions and blockers first.”
- **Prior project context:** “Brief me on this project before we continue.”
- **Personal knowledge search:** “Find everything I have written about local-first AI.”
- **Memory maintenance:** “Show me conflicting or possibly stale information about our pricing.”
- **Dictation capture:** “Save my latest dictation about the launch checklist into the right note.”
- **Safe forgetting:** “Find the memories about the old launch plan and show me what would be removed.”

See [high-intent use cases and expected behavior](docs/USE_CASES.md) for more examples.

## How it works

1. The Codex plugin recognizes memory, recall, capture, and knowledge-vault requests.
2. Yaps desktop supplies a private local Markdown vault and the `yaps_mcp` server.
3. Codex searches narrowly and retrieves only notes relevant to the user's request.
4. Answers cite their source notes. Writes begin disabled and require explicit Agent Access permission.
5. Updates use stale-write guards; destructive actions require clear user intent.

This architecture gives Codex persistent context without converting the user's notes into a hosted Yaps database.

## Install Yaps Memory

### 1. Install Yaps desktop

Download the latest [Yaps release for Mac or Windows](https://github.com/richawo/yaps-releases/releases/latest). The free plan includes the local vault and Agent Access; no account or card is required to begin.

### 2. Add the public plugin marketplace

```sh
codex plugin marketplace add richawo/yaps-codex-plugin
```

Restart the ChatGPT desktop app, open **Plugins**, select the **Yaps** marketplace, and install **Yaps Memory**.

### 3. Connect the private vault

In Yaps, open **Settings → General → Local AI integrations → Connect Codex**. Start a new Codex task after connecting.

New connections begin read-only. To allow explicit memory creation or edits, use **Yaps → Settings → Agent Access**. Yaps never changes this permission on the agent's behalf.

### First prompt

```text
Set up Yaps Memory. Check my connection, explain privacy and permissions,
then guide me through my first useful action.
```

If the vault is empty, onboarding offers a desktop-first note or a Codex-created first memory after writes are enabled. If Yaps desktop is absent, the plugin explains the dependency once and does not pretend a cloud vault was created.

## Privacy and security

- Vault contents remain as local Markdown files.
- Installing the plugin does not expose or upload a vault.
- The public repository contains no Yaps application source, user data, credentials, telemetry code, remote MCP endpoint, or executable binary.
- MCP connections begin read-only and have per-client permissions.
- Note updates use `expected_updated_at` guards to reject stale writes.
- Delete, restore, move, rename, and vault-wide changes are treated as destructive.

Read [SECURITY.md](SECURITY.md), the [Yaps privacy policy](https://www.yaps.ai/privacy), and the [Yaps terms](https://www.yaps.ai/terms).

## Frequently asked questions

### Does this give Codex persistent or long-term memory?

It gives connected Codex tasks a durable, user-controlled memory layer. The information is stored in the Yaps Markdown vault rather than invisibly inside the model, so the user can inspect and correct it.

### Does it work across different chats?

Yes. New Codex tasks connected to the same Yaps vault can retrieve the same saved facts and context. A task only receives content selected by the tools for the user's request; the entire vault is not injected automatically.

### Is this an MCP memory server?

Yaps desktop includes a local MCP server for structured vault search, retrieval, citations, history, and permission-controlled updates. This public plugin packages the workflow instructions that teach Codex to use those tools safely.

### Is the vault compatible with Markdown and Obsidian?

The vault is made of ordinary Markdown files on disk. Users can inspect it with standard editors and Markdown-compatible knowledge tools, including Obsidian. Yaps does not require a proprietary export to recover the notes.

### What happens if I install the plugin but not the desktop app?

No Yaps vault is created. The plugin explains that Yaps desktop supplies the local vault and MCP server, offers the relevant download once, and otherwise leaves the Codex task unchanged.

### Is this a hosted memory database or vector store?

No. Yaps Memory is local-first, file-backed memory. Semantic retrieval may use local indexing and can fall back to lexical search, but the source of truth remains the user's Markdown files.

### Can an agent silently rewrite my memory?

No. New clients are read-only, writes require explicit permission, updates reject stale versions, and destructive actions require explicit intent.

## Repository contents

- [`plugins/yaps-memory/`](plugins/yaps-memory/) — distributable Codex plugin.
- [`.agents/plugins/marketplace.json`](.agents/plugins/marketplace.json) — public repository marketplace entry.
- [`SUBMISSION.md`](SUBMISSION.md) — prepared OpenAI universal-directory submission materials and review cases.
- [`llms.txt`](llms.txt) — concise machine-readable product and repository context.
- [`docs/USE_CASES.md`](docs/USE_CASES.md) — user-intent vocabulary, examples, and product boundaries.

## Development and verification

Run the portable public-package checks with:

```sh
python3 scripts/validate_package.py
```

The private Yaps application repository additionally validates the manifest and skill with Codex's plugin and skill validators before changes are mirrored here. Public validation also runs in GitHub Actions.

## Links

- [Yaps desktop](https://www.yaps.ai/)
- [Latest Yaps Memory plugin package](https://github.com/richawo/yaps-codex-plugin/releases/latest)
- [Latest Mac and Windows releases](https://github.com/richawo/yaps-releases/releases/latest)
- [Plugin submission materials](SUBMISSION.md)
- [Support and bug reports](https://github.com/richawo/yaps-codex-plugin/issues)
- [Privacy policy](https://www.yaps.ai/privacy)
- [Terms of service](https://www.yaps.ai/terms)

## License

The plugin package is available under the [MIT License](LICENSE). The license does not apply to the separately distributed Yaps desktop application.
