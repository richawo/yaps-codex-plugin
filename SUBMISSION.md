# Yaps Memory plugin submission pack

Use this copy for the OpenAI Platform plugin submission portal. Submit as **Skills only**: the desktop app supplies the private, machine-local MCP server after installation, so there is no public MCP URL in this plugin package.

## Listing

- **Plugin name:** Yaps Memory
- **Short description:** Private local Markdown memory across Codex chats.
- **Category:** Productivity
- **Website:** https://www.yaps.ai
- **Support:** https://github.com/richawo/yaps-codex-plugin/issues
- **Privacy policy:** https://www.yaps.ai/privacy
- **Terms:** https://www.yaps.ai/terms
- **Logo:** `plugins/yaps-memory/assets/yaps-icon.png`
- **Skill bundle:** `plugins/yaps-memory/skills/yaps-memory/`
- **Country availability:** Select only countries where the current Yaps desktop release, support, terms, and billing are available.

### Long description

Yaps Memory gives Codex durable, cross-chat memory through a private local Markdown vault. It can search remembered facts, prior context, personal knowledge, notes, decisions, ideas, meetings, resources, and dictation history; retrieve focused evidence with note citations; capture new memories; and make conflict-aware edits through the local MCP server supplied by Yaps desktop. Vault contents remain on the user's machine unless Codex retrieves specific content for the user's request. New connections begin read-only, and the user controls write access in Yaps.

## Starter prompts

1. Set up Yaps Memory. Check my connection, explain privacy and permissions, then guide me through my first useful action.
2. Help me capture a new memory in Yaps. Ask what I want to remember and where it belongs.
3. Summarize my five most recently updated Yaps notes and cite each note's title and path.

## Positive test cases

### 1. Onboard an established vault

- **Prompt:** Set up Yaps Memory. Check my connection, explain privacy and permissions, then guide me through my first useful action.
- **Fixture:** Yaps desktop connected to Codex; read access allowed; vault contains at least five notes.
- **Expected behavior:** Check tool availability, call `vault_status` without reading note bodies, explain local Markdown and read-only defaults, then offer the three established-vault actions.
- **Expected result:** A concise connection summary and a choice of recent-note review, topic search, or opt-in capture; no vault mutation.

### 2. Onboard an empty vault

- **Prompt:** Set up Yaps Memory for the first time.
- **Fixture:** Yaps desktop connected to Codex; `vault_status` reports zero notes; writes disabled.
- **Expected behavior:** Confirm the connection works, avoid offering impossible search/recent-note actions, and offer either desktop-first creation or Codex capture after the user enables writes.
- **Expected result:** Two clear first-note paths, one gentle explanation of the desktop benefit, and no paid-plan pitch or mutation.

### 3. Retrieve and cite a focused answer

- **Prompt:** What did I decide about the launch date? Use my Yaps memory and cite the evidence.
- **Fixture:** Two notes mention launch timing; one contains the final decision and one contains an older proposal.
- **Expected behavior:** Search narrowly, retrieve only promising notes, distinguish the final decision from stale evidence, and cite titles and paths.
- **Expected result:** A concise answer with note title/path citations and any conflict or staleness called out.

### 4. Capture a durable memory safely

- **Prompt:** Remember that weekly project updates should put decisions and blockers first.
- **Fixture:** Writes enabled; no exact duplicate; one related preferences note exists.
- **Expected behavior:** Search for duplicates, retrieve the related note, update the smallest relevant section with `expected_updated_at`, and preserve unrelated content.
- **Expected result:** Confirmation of the single changed note and its path, including what changed.

### 5. Recover a recent dictation

- **Prompt:** Save my most recent dictation about the launch checklist into my vault.
- **Fixture:** History contains multiple recent dictations, including exactly one about the launch checklist; writes enabled.
- **Expected behavior:** List relevant history, confirm the intended item if ambiguous, check for duplicates, and save it with minimal structure.
- **Expected result:** One created or updated note with its title/path and a clear mutation summary.

## Negative test cases

### 1. Plugin installed but Yaps desktop is unavailable

- **Scenario:** The onboarding prompt is used, but Yaps MCP tools are absent.
- **Expected fallback:** Explain once that the desktop app supplies the private vault and MCP server; link the download; give the exact Connect Codex path; stop before vault actions.
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

Initial submission of Yaps Memory, a skills-only plugin for focused retrieval, cited answers, and safe updates in a user's private local Yaps vault. Yaps desktop supplies the local MCP connection; the plugin itself does not upload or host vault data. Reviewers can evaluate onboarding without note access, while retrieval and write cases require a local Yaps fixture with the permissions described above.

## Portal prerequisites

- Submitter has **Apps Management: Write** in the publishing OpenAI organization.
- Publisher has completed individual or business identity verification in that same organization.
- Listing identity matches the public website, support, privacy, and terms pages.
- Upload the final skill directory and use exactly five positive and three negative cases above.
- Review the draft and policy attestations, submit it for review, then publish it after approval.
