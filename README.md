# Little Bird

Little Bird is a local-first companion app for small businesses. It combines connected store metrics, catalog context, content planning, experiments, and a private local AI assistant powered by Ollama.

## What Is Included

- `app/` contains the local web app and Node server.
- `installer/` contains the Windows setup scripts.
- `scripts/build-windows-installer.ps1` builds the portable zip and Windows setup EXE.
- `.github/workflows/release.yml` can build release artifacts and attach them to GitHub Releases.

## Run Locally

```powershell
cd app
.\start-little-bird.cmd --port=4192
```

Open:

```text
http://127.0.0.1:4192/?v=0.2.0
```

## Build Installer

On Windows with Node.js available:

```powershell
.\scripts\build-windows-installer.ps1 -Version 0.2.0
```

Outputs are written to `dist/`:

- `LittleBirdSetup.exe`
- `little-bird-local-app.zip`

## Release Updates

The app can check a release feed from Settings. For GitHub Releases, set this in the installed app environment:

```text
LITTLE_BIRD_UPDATE_MANIFEST_URL=https://api.github.com/repos/rookepoole/LittleBird/releases/latest
```

Tag a release such as `v0.2.0` and the GitHub Actions workflow can publish the installer asset. Little Bird never silently installs updates; it only checks the feed and opens the installer download when the user chooses it.

## Privacy

Little Bird stores integration tokens only on the user's local machine in ignored dotfiles. Do not commit `.env`, `.little-bird-tokens.json`, or `.little-bird-oauth-state.json`.
