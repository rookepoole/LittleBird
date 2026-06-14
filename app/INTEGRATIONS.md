# Little Bird Integrations

Run Little Bird through the desktop app or `server.js` when you want live API sync. The browser-only `index.html` still works for diagnostics, but Shopify, Meta, and TikTok logins need the local server so OAuth secrets and access tokens stay out of the browser.

## Environment Variables

Use `.env.example` as the checklist for required values. You can set values as environment variables or create a local `.env` file in this folder with the same keys.

`APP_SLUG` controls local storage filenames for tokens and OAuth state. The default is `little-bird`.

`LITTLE_BIRD_VERSION` labels the installed build. `LITTLE_BIRD_UPDATE_MANIFEST_URL` can point to a GitHub latest-release API URL or a small JSON manifest with `version`, `downloadUrl`, and `releaseNotes`.

## OAuth Redirect URLs

Add these redirect URLs to the matching developer app dashboards:

- Shopify: `http://127.0.0.1:4173/auth/shopify/callback`
- Meta: `http://127.0.0.1:4173/auth/meta/callback`
- TikTok Business: `http://127.0.0.1:4173/auth/tiktok/callback`

If you expose the app through a tunnel or hosted domain, set `PUBLIC_BASE_URL` to that public base URL and use that domain in the redirect URLs instead.

Shopify OAuth:
- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_STORE_DOMAIN`, such as `your-store.myshopify.com`, or enter it in Settings
- `SHOPIFY_SCOPES`, default `read_orders,read_products,read_analytics`
- `SHOPIFY_API_VERSION`, default `2026-01`

Meta Ads OAuth:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_AD_ACCOUNT_ID`, optional but recommended, with or without `act_`. Little Bird normalizes pasted values such as `(123456789012345)` to `123456789012345` and calls Meta as `act_123456789012345`.
- `META_SCOPES`, default `ads_read,business_management`
- `META_API_VERSION`, default `v23.0`

TikTok Business OAuth:
- `TIKTOK_APP_ID`
- `TIKTOK_APP_SECRET`
- `TIKTOK_ADVERTISER_ID`, optional if TikTok returns advertiser IDs for the connected account
- `TIKTOK_API_VERSION`, default `v1.3`

The older direct-token variables still work as a fallback: `SHOPIFY_ADMIN_ACCESS_TOKEN`, `META_ACCESS_TOKEN`, and `TIKTOK_ACCESS_TOKEN`.

## Little Bird Local LLM

Little Bird is wired for a free local open-source model through Ollama. The default model is `qwen2.5:3b`, which is small enough for many laptops but much smarter than a canned mock reply.

Install Ollama, then run:

```powershell
ollama pull qwen2.5:3b
ollama serve
```

Optional `.env` values:

```text
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
```

If Ollama is not installed, not running, or the model has not been pulled, the app uses a built-in fallback reply and shows that status in the Little Bird screen.

When Store Sync is available, Little Bird sends the local model a sanitized store snapshot: source status, store metadata, recent products, newly changed products, top products, order totals, and ad summaries. Access tokens, OAuth state, and raw customer records are not included in the model prompt.

## Start

From this folder:

```powershell
$env:SHOPIFY_CLIENT_ID="your_shopify_client_id"
$env:SHOPIFY_CLIENT_SECRET="your_shopify_client_secret"
$env:META_APP_ID="your_meta_app_id"
$env:META_APP_SECRET="your_meta_app_secret"
$env:TIKTOK_APP_ID="your_tiktok_app_id"
$env:TIKTOK_APP_SECRET="your_tiktok_app_secret"
node server.js
```

Then open:

```text
http://127.0.0.1:4173/
```

If port `4173` is already in use, start the server on another local port:

```powershell
node server.js --port=4192
```

## Endpoints

- `GET /api/health` reports configured integrations.
- `GET /api/integrations` reports connection status, OAuth setup readiness, missing app credentials, callback URLs, and locally selected account IDs.
- `GET /api/update` checks the configured release feed.
- `POST /api/sync` with `{ "source": "all" }` syncs every configured source.
- `POST /api/sync` with `{ "source": "shopify" }` syncs Shopify only.
- `POST /api/sync` with `{ "source": "meta" }` syncs Meta only.
- `POST /api/sync` with `{ "source": "tiktok" }` syncs TikTok only.
- `POST /api/disconnect` with `{ "provider": "shopify" }` disconnects a saved token.
- `GET /api/bird/status` reports the local Ollama model status.
- `POST /api/bird/chat` sends a Little Bird message to the local model.
- `GET /auth/shopify/start?shop=your-store.myshopify.com` starts Shopify login.
- `GET /auth/meta/start` starts Meta login.
- `GET /auth/tiktok/start` starts TikTok login.

After a successful login, the local server writes access tokens to `.little-bird-tokens.json` in this folder. Do not publish or share that file.

## Security Notes

- Open the desktop app for live integrations and Little Bird AI. The browser-only file URL remains useful for diagnostics, but local-token operations are protected by local-origin checks.
- `.env`, `.little-bird-tokens.json`, `.little-bird-oauth-state.json`, and other dotfiles are blocked from static serving.
- OAuth state expires after 10 minutes.
- Sync and disconnect are POST-only so other sites cannot trigger token-backed actions with simple GET requests.
