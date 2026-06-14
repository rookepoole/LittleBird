# Little Bird

Little Bird is a local-first desktop companion app for small businesses. It combines connected store metrics, catalog context, content planning, experiments, and a private local AI assistant powered by Ollama.

## Download

The Windows desktop installer is published under GitHub Releases instead of committed to `main`.

[Download LittleBirdSetup.exe](https://github.com/rookepoole/LittleBird/releases/latest/download/LittleBirdSetup.exe)

Latest release page: [v0.3.11](https://github.com/rookepoole/LittleBird/releases/tag/v0.3.11)

## What Is Included

- `app/` contains the local app UI and Node server.
- `electron/` contains the desktop shell that opens Little Bird in its own app window.
- `scripts/build-windows-installer.ps1` builds the portable zip and Windows desktop installer.
- `.github/workflows/release.yml` can build release artifacts and attach them to GitHub Releases.

## Run Locally

```powershell
npm install
npm run desktop
```

The desktop shell starts the local server and opens a Little Bird window automatically.

## Build Installer

On Windows with Node.js available:

```powershell
.\scripts\build-windows-installer.ps1 -Version 0.3.11
```

Outputs are written to `dist/`:

- `LittleBirdSetup.exe`
- `little-bird-local-app.zip`

## Release Updates

The app can check a release feed from Settings. For GitHub Releases, set this in the installed app environment:

```text
LITTLE_BIRD_UPDATE_MANIFEST_URL=https://api.github.com/repos/rookepoole/LittleBird/releases/latest
```

Tag a release such as `v0.3.11` and the GitHub Actions workflow can publish the installer asset. Little Bird never silently installs updates; after the user chooses Install, it downloads the trusted GitHub installer, verifies the release digest when available, and opens the Windows installer.

## Privacy

Little Bird stores integration tokens only on the user's local machine in ignored dotfiles. Do not commit `.env`, `.little-bird-tokens.json`, or `.little-bird-oauth-state.json`.

Windows may warn about unsigned installers until Little Bird is code-signed and has download reputation. See [SECURITY.md](SECURITY.md).
