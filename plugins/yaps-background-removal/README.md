# Yaps Background Remover for ChatGPT Desktop, Claude, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. If you are using ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Yaps Background Remover cuts the subject out of a JPG, PNG, WebP, or BMP image and exports a transparent PNG, or a version composited onto a solid colour, through the local vision model supplied by Yaps desktop.

[Download Yaps 2.1.0 or newer](https://yaps.ai/download), open the app, and sign in before installing the integration. Older builds, including 2.0.1, do not expose the background-removal command this plugin uses. Yaps no longer has a free tier: Background Removal requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. Enable Background Removal under Yaps Features when prompted.

The plugin processes only the file the user selects and does not upload it to a hosted background-removal service. It cuts out still images; for removing a video's background, use the Yaps app's Media tab instead.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
