# Yaps Memory plugin submission pack

Use this copy for the OpenAI Platform plugin submission portal. Submit as **Skills only**: the desktop app supplies the private, machine-local MCP server after installation, so there is no public MCP URL in this plugin package.

## Listing

- **Plugin name:** Yaps Memory
- **Short description:** Private local Markdown memory across Codex chats.
- **Category:** Productivity
- **Requirement:** Yaps desktop 2.3.124 or newer and an active free trial or Yaps Pro are required to supply the local Markdown vault, automatic account handoff, and MCP connection. Installing the plugin alone does not create a local or hosted vault.
- **Website:** https://www.yaps.ai
- **Support:** https://github.com/richawo/yaps-codex-plugin/issues
- **Privacy policy:** https://www.yaps.ai/privacy
- **Terms:** https://www.yaps.ai/terms
- **Logo:** `plugins/yaps-memory/assets/yaps-icon.png`
- **Plugin bundle:** Upload `yaps-memory-plugin-<version>.zip`. The public uploader requires the complete plugin bundle with `.codex-plugin/plugin.json` at the ZIP root, not the standalone skill ZIP.
- **Country availability:** Select only countries where the current Yaps desktop release, support, terms, and billing are available.

### Long description

Yaps Memory requires Yaps desktop, which supplies the private local Markdown vault and MCP connection; installing the plugin alone does not create a local or hosted vault. Once Yaps is installed and signed in, the plugin finds and validates the packaged connector automatically. It gives Codex durable cross-chat memory: search remembered facts, retrieve focused evidence with note citations, capture new memories, and make conflict-aware edits. Yaps does not upload or host the vault. When a user asks Codex to retrieve content, only the selected tool results are provided to that user's Codex environment. New connections begin read-only, and the user controls write access in Yaps.

## Reviewer setup

Use [`REVIEWER.md`](REVIEWER.md) and the synthetic vault under [`reviewer/vault/`](reviewer/vault/). The release assets contain a portal-ready plugin ZIP, a standalone skill ZIP for local inspection, and a separate reviewer-vault ZIP. A signed-in Yaps reviewer account with an active free trial or Yaps Pro is required; no private network, private repository, or Yaps internal data is required.

## Starter prompts

1. Set up Yaps Memory. Check my connection, explain privacy and permissions, then guide me through my first useful action.
2. Help me capture a new memory in Yaps. Ask what I want to remember and where it belongs.
3. Summarize my five most recently updated Yaps notes and cite each note's title and path.

## Positive test cases

### 1. Onboard an established vault

- **Prompt:** Set up Yaps Memory. Check my connection, explain privacy and permissions, then guide me through my first useful action.
- **Fixture:** The supplied reviewer vault, added to Yaps as an existing vault; Yaps desktop signed in with active access; read access allowed.
- **Expected behavior:** Check tool availability, call `vault_status` without reading note bodies, explain local Markdown and read-only defaults, then offer the three established-vault actions.
- **Expected result:** A concise connection summary and a choice of recent-note review, topic search, or opt-in capture; no vault mutation.

### 2. Onboard an empty vault

- **Prompt:** Set up Yaps Memory for the first time.
- **Fixture:** Yaps desktop signed in with active access; `vault_status` reports zero notes; writes disabled.
- **Expected behavior:** Confirm the connection works, avoid offering impossible search/recent-note actions, and offer either desktop-first creation or Codex capture after the user enables writes.
- **Expected result:** Two clear first-note paths, one gentle explanation of the desktop benefit, and no paid-plan pitch or mutation.

### 3. Retrieve and cite a focused answer

- **Prompt:** What did I decide about the launch date? Use my Yaps memory and cite the evidence.
- **Fixture:** The supplied `Projects/Aurora/Launch decision.md` and `Projects/Aurora/Launch proposal.md` notes.
- **Expected behavior:** Search narrowly, retrieve only promising notes, distinguish the final decision from stale evidence, and cite titles and paths.
- **Expected result:** A concise answer with note title/path citations and any conflict or staleness called out.

### 4. Capture a durable memory safely

- **Prompt:** Remember that weekly project updates should put decisions and blockers first.
- **Fixture:** Writes enabled; use the supplied `Preferences/Project updates.md` note.
- **Expected behavior:** Search for duplicates, retrieve the related note, update the smallest relevant section with `expected_updated_at`, and preserve unrelated content.
- **Expected result:** Confirmation of the single changed note and its path, including what changed.

### 5. Recover a recent dictation

- **Prompt:** Save my most recent dictation about the launch checklist into my vault.
- **Fixture:** Follow `REVIEWER.md` to create the specified launch-checklist dictation in Yaps history; writes enabled.
- **Expected behavior:** List relevant history, confirm the intended item if ambiguous, check for duplicates, and save it with minimal structure.
- **Expected result:** One created or updated note with its title/path and a clear mutation summary.

## Negative test cases

### 1. Plugin installed but Yaps desktop is unavailable

- **Scenario:** The onboarding prompt is used, but Yaps MCP tools are absent.
- **Expected fallback:** Distinguish a missing or invalid CLI from an installed CLI whose private-vault connector is unavailable. Link the Yaps download or update as appropriate, explain that no separate CLI or Connect step is required, and stop before vault actions.
- **Why it must not continue:** The skill cannot truthfully inspect or mutate a vault without the local tools.

### 2. Write attempted while access is read-only

- **Prompt:** Delete every note tagged `old`.
- **Fixture:** Read access allowed; writes disabled.
- **Expected fallback:** Do not attempt deletion; explain that write access is user-controlled under Yaps Agent Access. Even after writes are enabled, require explicit confirmation of the destructive targets.
- **Why it must not continue:** Permission is absent and the requested bulk deletion is destructive.

### 3. Concurrent edit makes an update stale

- **Prompt:** Add this paragraph to my launch plan.
- **Fixture:** The note changes after retrieval but before `vault_note_update`.
- **Expected fallback:** The stale-write guard rejects the update; retrieve the new version and ask for direction when reconciliation is ambiguous.
- **Why it must not continue:** Silently overwriting a newer user edit risks data loss.

## Initial release notes

Initial submission of Yaps Memory, a skills-only plugin for focused retrieval, cited answers, and safe updates in a user's private local Yaps vault. Yaps desktop is required and supplies the automatically discovered local MCP connection; installing the plugin alone does not create a vault. The plugin and Yaps do not upload or host vault data. A synthetic reviewer vault, exact setup instructions, and expected results for all eight cases are supplied with the submission.

## Portal prerequisites

- Submitter has **Apps Management: Write** in the publishing OpenAI organization.
- Publisher has completed individual or business identity verification in that same organization.
- Listing identity matches the public website, support, privacy, and terms pages.
- Upload the complete plugin ZIP containing `.codex-plugin/plugin.json` and use exactly five positive and three negative cases above.
- Review the draft and policy attestations, submit it for review, then publish it after approval.
