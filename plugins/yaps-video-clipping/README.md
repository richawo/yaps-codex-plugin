# Yaps Video Clipping for Claude, ChatGPT Desktop, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. In Claude, use Claude Code or the Claude desktop app on the
computer where Yaps is installed. If you are using ChatGPT web or a cloud
session, [download or open ChatGPT desktop](https://chatgpt.com/download/) and
retry in a local-capable Work or Codex session. You can also access this
feature directly in the Yaps application. The workflow checks actual Yaps
reachability instead of relying on a user-agent guess or assuming that Yaps is
uninstalled.

Yaps Video Clipping removes dead air and long pauses from talking-head videos through Auto Cut. It detects speech locally, builds a reviewable keep-range plan, and exports a separate tightened MP4 without changing the source.

Choose Tight for punchy social edits, Natural for conversational pacing, or Relaxed for light trimming. The AI client can show the exact proposed ranges, source and kept durations, removed percentage, cut count, longest retained gap, output estimate, and destination before rendering. It can also adjust boundary padding or redetect after deliberate detection changes.

The plugin and [Yaps 2.3.848 or newer](https://yaps.ai/download) can be installed in either order. Before first use, open Yaps and sign in. Yaps no longer has a free tier: Auto Cut requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. Auto Cut has no model download of its own. It uses Yaps's local speech detector and the FFmpeg/ffprobe render tools shipped with supported Yaps desktop packages when available.

The plugin processes only the video the user selects. It never uploads the file to a hosted editor as a silent fallback, never replaces the source, and never overwrites an existing export without explicit approval. Auto Cut removes pauses; it does not choose semantic highlights, reorder scenes, or add captions.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
