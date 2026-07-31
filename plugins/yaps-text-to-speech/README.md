# Yaps Text to Speech for ChatGPT Desktop, Claude, and Codex

This local-first plugin must be able to reach the Yaps engine installed on the
user's computer. If you are using ChatGPT web or a cloud session,
[download or open ChatGPT desktop](https://chatgpt.com/download/) and retry in a
local-capable Work or Codex session. You can also access this feature directly
in the Yaps application. The workflow checks actual Yaps reachability instead of
relying on a user-agent guess or assuming that Yaps is uninstalled.

Yaps Text to Speech turns text or a text file into a WAV audio file using the voice engines supplied by Yaps desktop.

[Download Yaps](https://yaps.ai/download), open the app, and sign in before installing the integration. Yaps no longer has a free tier: Text to Speech requires either an active free trial or Yaps Pro. Trial eligibility and the current offer are confirmed inside Yaps.

After account access is active, the plugin uses the CLI already packaged inside Yaps; no separate CLI install or Agent Access permission is required. The local voice engines are installed and managed from Yaps Features: Kokoro and Chatterbox read English, Supertonic reads 24 languages, and more than one can be installed at a time.

The plugin does not contain an independent speech service or upload text merely because it is installed. It invokes Yaps only for text the user explicitly asks to synthesize and reports the resulting local file.

See the [Yaps privacy policy](https://www.yaps.ai/privacy), [terms](https://www.yaps.ai/terms), or contact [support@yaps.ai](mailto:support@yaps.ai).
