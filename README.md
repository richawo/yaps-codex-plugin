# Yaps Memory for Codex

Yaps Memory lets Codex search, cite, and safely update a private, local-first Markdown vault supplied by the Yaps desktop app.

The public plugin contains workflow instructions and presentation metadata. It contains no Yaps application source, user data, credentials, telemetry code, remote MCP endpoint, or executable binary.

## Install

1. Install the latest [Yaps desktop release](https://github.com/richawo/yaps-releases/releases/latest).
2. Add this marketplace source:

   ```sh
   codex plugin marketplace add richawo/yaps-codex-plugin
   ```

3. Restart the ChatGPT desktop app, open Plugins, select the **Yaps** marketplace, and install **Yaps Memory**.
4. In Yaps, open **Settings → General → Local AI integrations** and select **Connect Codex**.
5. Restart Codex. The connection starts read-only; writes remain an explicit choice under **Yaps → Settings → Agent Access**.

## What it does

- Searches the local vault narrowly before reading full notes.
- Cites note titles and paths used as evidence.
- Captures “remember this” requests as durable notes.
- Can organize recent Yaps dictations into notes.
- Uses optimistic concurrency guards for note updates.
- Treats deletion, restoration, moves, renames, and vault-wide tag changes as destructive.

## Architecture and privacy

The plugin is intentionally skills-only. Yaps desktop ships the local `yaps_mcp` process and writes the OS-specific Codex configuration. Vault access stays on the user's machine; installing this repository alone does not expose or upload a vault.

See [SECURITY.md](SECURITY.md), the [Yaps privacy policy](https://www.yaps.ai/privacy), and the [Yaps terms of service](https://www.yaps.ai/terms).

## Development

Run the portable package checks with:

```sh
python3 scripts/validate_package.py
```

The plugin manifest and skill are also validated in the private Yaps application repository with Codex's plugin-creator and skill-creator validators before releases are mirrored here.

## License

The files in this repository are licensed under the [MIT License](LICENSE). This license applies to the plugin package, not to the separately distributed Yaps desktop application.
