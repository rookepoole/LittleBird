Little Bird Windows Setup

Run LittleBirdSetup.exe to install Little Bird for the current Windows user.

What the setup does:
- Installs Little Bird as a desktop app.
- Creates Desktop and Start Menu shortcuts.
- Opens Little Bird in its own app window.
- Starts a local-only server behind the app for integrations and Ollama.
- Supports connected-first store sync, catalog context for the local model, and manual metrics as an override.
- Checks GitHub Releases from Settings when the user chooses Check.

Notes:
- Internet access is needed for Ollama installation and model download.
- If winget or the internet is unavailable, Little Bird still installs and runs with fallback AI replies.
- Integration tokens stay local in the user's Little Bird app data folder.
- Updates are user-triggered. Little Bird checks the feed and opens the installer download; it does not silently install updates.
- This setup is unsigned, so Windows may show a SmartScreen or Defender warning until it is code-signed.
