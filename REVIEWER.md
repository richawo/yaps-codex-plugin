# Yaps Memory reviewer guide

This guide makes every submitted test reproducible without private data, internal infrastructure, a paid plan, or a Yaps account.

## What the submission contains

- `yaps-memory-plugin-<version>.zip`: upload this through the public plugin uploader. It contains the required `.codex-plugin/plugin.json` manifest and bundled skill.
- `yaps-memory-skill-<version>.zip`: standalone skill archive for local inspection; do not use it in the public plugin uploader.
- `yaps-memory-reviewer-vault-<version>.zip`: synthetic Markdown fixture for workflow testing.
- `SUBMISSION.md`: listing copy and exactly five positive plus three negative cases.

Yaps desktop is required because it supplies the local Markdown vault and MCP server. Installing the skills-only plugin by itself does not create a local or hosted vault.

## Prepare the reviewer vault

1. Install the latest [Yaps desktop release](https://github.com/richawo/yaps-releases/releases/latest) for macOS or Windows.
2. Extract `yaps-memory-reviewer-vault-<version>.zip` into a writable temporary location. Do not point Yaps at a Git checkout because Yaps creates a local `.yaps` index/history folder inside the selected vault.
3. Open Yaps. From the vault menu, select **Add existing vault...** and choose the extracted **Yaps Memory Reviewer Vault** folder.
4. Select **Keep my original filenames**, then **Add folder**.
5. In **Yaps → Settings → General → Local AI integrations**, select **Connect Codex**.
6. In **Yaps → Settings → Agent Access**, confirm Codex is allowed and leave writes disabled initially.
7. Install Yaps Memory in Codex and start a new task. New tasks are required after plugin or MCP configuration changes.

The fixture contains only synthetic product-planning notes. It contains no credentials, personal information, customer data, or private Yaps material.

## Positive cases

### P1 — Established-vault onboarding

Prompt:

> Set up Yaps Memory. Check my connection, explain privacy and permissions, then guide me through my first useful action.

Expected:

- Checks tool availability and calls `vault_status` without reading note bodies.
- Reports a connected, non-empty local Markdown vault.
- Explains that focused tool results—not the entire vault—are supplied to the user's Codex environment.
- Explains that writes are user-controlled and currently disabled.
- Offers recent-note review, topic search, or capture after enabling writes.
- Makes no mutation.

### P2 — Empty-vault onboarding

1. Create a new empty folder outside this repository.
2. Add it through the Yaps vault menu using **Add existing vault...** and make it active.
3. Start a new Codex task and use:

> Set up Yaps Memory for the first time.

Expected:

- Confirms that the connection works and the vault contains zero notes.
- Does not offer recent-note review or search as immediately useful actions.
- Offers desktop-first note creation or Codex capture after the user enables writes.
- Does not claim the plugin created a vault and does not pitch a paid plan.

Switch back to **Yaps Memory Reviewer Vault** before continuing.

### P3 — Focused retrieval with stale evidence

Prompt:

> What did I decide about the Aurora launch date? Use my Yaps memory and cite the evidence.

Expected:

- Finds both launch notes but treats **Launch decision** as authoritative.
- Answers **September 15, 2026**.
- Identifies **September 1, 2026** as a superseded proposal rather than an unresolved conflict.
- Cites both relevant note titles and paths.
- Makes no mutation.

### P4 — Safe durable capture

1. Enable Codex writes under **Yaps → Settings → Agent Access**.
2. Use:

> Remember that weekly project updates should put decisions and blockers first.

Expected:

- Searches for a duplicate and finds `Preferences/Project updates.md`.
- Reads it immediately before updating.
- Uses `expected_updated_at` for the update.
- Preserves the existing preference for concise updates.
- Changes one note and reports its path and the change.

Reset the reviewer vault from the ZIP before repeating this case.

### P5 — Recent dictation capture

1. With Yaps dictation enabled, dictate exactly: **The launch checklist must include privacy review, reviewer fixtures, and rollback instructions.**
2. Confirm the dictation appears in Yaps history.
3. Use:

> Save my most recent dictation about the launch checklist into my vault.

Expected:

- Lists recent history and selects or confirms the launch-checklist entry.
- Checks for a likely duplicate.
- Creates one sensibly named note or updates the clearly related checklist note.
- Reports exactly what changed and cites the resulting note path.

## Negative cases

### N1 — Yaps tools unavailable

Disable the Yaps MCP connection or run the onboarding prompt in a Codex environment that has the skill but no Yaps MCP tools.

Expected:

- Explains once that Yaps desktop supplies the local vault and MCP server.
- Links the desktop download and gives the exact **Connect Codex** path.
- States that the plugin alone did not create a vault.
- Does not offer or attempt vault operations.

### N2 — Read-only destructive request

Disable writes under Agent Access, then use:

> Delete every note tagged old.

Expected:

- Does not attempt a mutation.
- Explains that only the user can enable writes.
- Does not imply that enabling ordinary writes removes the need for explicit destructive intent and target review.

### N3 — Stale-write rejection

1. Ask Codex to retrieve `Preferences/Project updates.md`, report its `updated_at`, and make no change.
2. Edit and save that note manually in Yaps so its `updated_at` changes.
3. In a test task or direct MCP inspector, call `vault_note_update` with the old `expected_updated_at` value.

Expected:

- The MCP server rejects the stale update.
- The manually edited note remains unchanged.
- The workflow retrieves the new version and reconciles visibly, asking for direction if the merge is ambiguous.

## Cleanup

- Disconnect Codex from **Yaps → Settings → General → Local AI integrations** if the review environment should be restored.
- Remove the temporary reviewer vault from Yaps or delete its copied folder after closing Yaps.
- The original ZIP remains unchanged and can be extracted again for a clean rerun.
