# Security Notes

Little Bird is a local-first desktop app. The app starts a local server bound to `127.0.0.1`, stores integration tokens in the user's local app data, and uses a local Ollama model when available.

## Windows Defender and SmartScreen

Windows may show a Defender or SmartScreen warning because the installer is unsigned and new. That warning is based on publisher identity and reputation, not only on whether the code is safe.

The durable fix is:

1. Buy an OV or EV code-signing certificate for the publisher.
2. Sign the Electron app executable and installer during the GitHub Actions release build.
3. Keep releases stable so Microsoft reputation can accumulate.
4. Optionally distribute through the Microsoft Store or MSIX packaging later.

Until signing is set up, users can verify the release came from this public repository and GitHub Actions build, but Windows can still warn.

## Current Hardening

- OAuth and sync endpoints require local trusted origins.
- Sync and disconnect are POST-only.
- Dotfiles such as `.env`, `.little-bird-tokens.json`, and `.little-bird-oauth-state.json` are blocked from static serving.
- OAuth state expires after 10 minutes.
- The renderer has no Node integration in the desktop shell.
- External links open outside the app only for approved release URLs.
- The updater checks GitHub Releases and opens a download; it does not silently install updates.

## Remaining Production Work

- Code-sign the installer and app executable.
- Add a dedicated in-app Ollama setup flow with explicit user confirmation.
- Add automated dependency scanning for npm packages.
- Consider MSIX packaging once the app identity and signing path are stable.
