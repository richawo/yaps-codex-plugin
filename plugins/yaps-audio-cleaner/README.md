# Yaps Audio Cleaner for ChatGPT Desktop, Claude, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. If you are using ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Yaps Audio Cleaner removes background noise, hiss, static, room noise, and
other distractions from speech recordings on the user's own computer. It
exports a new WAV and never changes the source file.

The plugin exposes three quality routes selected from blind listening tests:

- **Recommended** is the default and the best general-purpose balance.
- **Quick** is a fast first pass for long recordings; the result can be kept
  while Yaps creates a more thorough version.
- **Maximum accuracy** is for difficult audio when quality matters more than
  processing time.

For visual before/after listening, several retained attempts, time estimates,
and one-click deeper cleaning, use **Yaps → Media → Audio Cleaner**.

The plugin and [Yaps](https://yaps.ai/download) can be installed in either
order. Before first use, open Yaps and sign in. Yaps has no free tier: Audio
Cleaner requires an active free trial or Yaps Pro. Trial eligibility and the
current offer are confirmed inside Yaps.

After account access is active, the plugin uses the CLI already packaged inside
Yaps; no separate CLI install or Agent Access permission is required. Add Audio
Cleaner from **Yaps → Features** when prompted. The Audio Cleaner engines are
supplied by a compatible Yaps release; the plugin never downloads an unverified
third-party model on its own.

See the [Yaps privacy policy](https://www.yaps.ai/privacy),
[terms](https://www.yaps.ai/terms), or contact
[support@yaps.ai](mailto:support@yaps.ai).
