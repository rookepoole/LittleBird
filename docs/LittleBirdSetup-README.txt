Little Bird Windows Setup

Run LittleBirdSetup.exe to install Little Bird for the current Windows user.

What the setup does:
- Installs Little Bird to %LOCALAPPDATA%\LittleBird.
- Bundles a Node.js runtime for the local server.
- Creates Desktop and Start Menu shortcuts.
- Attempts to install Ollama with winget if Ollama is missing.
- Pulls the default local model: qwen2.5:3b.
- Starts Little Bird and opens http://127.0.0.1:4173/?v=0.2.1.
- Supports connected-first store sync, catalog context for the local model, and manual metrics as an override.
- Can check a configured release feed from Settings when LITTLE_BIRD_UPDATE_MANIFEST_URL is set.

Notes:
- Internet access is needed for Ollama installation and model download.
- If winget or the internet is unavailable, Little Bird still installs and runs with fallback AI replies.
- Integration tokens stay local in .little-bird-tokens.json under the install folder.
- Updates are user-triggered. Little Bird checks the feed and opens the installer download; it does not silently install updates.
- This setup is unsigned, so Windows may show a SmartScreen warning until it is code-signed.
