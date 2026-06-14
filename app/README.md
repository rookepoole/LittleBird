# Little Bird

Little Bird is a private local app for small-business goals, connected store metrics, content planning, experiments, integrations, and local AI help. End users should install the desktop build from GitHub Releases; this folder remains useful for development and portable diagnostics.

## Run Locally

For end users, prefer `LittleBirdSetup.exe`. It installs Little Bird as a desktop app, creates shortcuts, and starts the local server behind the app window.

Windows:

```text
start-little-bird.cmd
```

Then open:

```text
http://127.0.0.1:4173/?v=0.3.8
```

If that port is busy:

```text
start-little-bird.cmd --port=4192
```

and open:

```text
http://127.0.0.1:4192/?v=0.3.8
```

## Requirements

- Node.js 20 or newer for the local server.
- Ollama is optional. Without it, Little Bird uses a built-in fallback response.
- For local AI, install Ollama and run `ollama pull qwen2.5:3b`.

## First Setup

1. Open Settings.
2. Set the app name, business name, business type, and primary product or offer.
3. Connect Shopify, Meta Ads, or TikTok Shop, then use Store Sync. Manual metrics are only an override for demos, offline work, or a broken source.
4. Add OAuth app credentials in `.env` when real customer logins are needed.
5. For distribution, use the desktop installer instead of asking users to open the browser manually.

## Store Intelligence

Store Sync pulls a safe local summary of orders, ad performance, store profile, recent products, newly changed products, and top products. That context is sent to the local Ollama model when the user asks Little Bird for content or launch ideas, so recommendations can reference the actual catalog instead of generic sample metrics.

## Updates

Little Bird supports a simple open-source release flow:

1. Build a new `LittleBirdSetup.exe`.
2. Publish it as a GitHub Release asset or put it behind a JSON manifest.
3. Set `LITTLE_BIRD_UPDATE_MANIFEST_URL` to either the GitHub latest-release API URL or a manifest with `version`, `downloadUrl`, and `releaseNotes`.

The Settings screen can check that feed and open the installer download. Updates are never downloaded or run silently.

## Privacy

Little Bird stores app state in the browser and stores integration tokens only in local dotfiles such as `.little-bird-tokens.json`. Do not publish `.env` or token files.
