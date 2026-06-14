const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "app");
const port = "4191";
const tokenPath = path.join(root, ".little-bird-redteam-tokens.json");
const statePath = path.join(root, ".little-bird-redteam-oauth-state.json");
const server = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: port,
    PUBLIC_BASE_URL: `http://127.0.0.1:${port}`,
    APP_SLUG: "little-bird-redteam",
    LITTLE_BIRD_UPDATE_MANIFEST_URL: `http://127.0.0.1:${port}/missing-update.json`
  },
  stdio: ["ignore", "pipe", "pipe"]
});

const base = `http://127.0.0.1:${port}`;
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 5000) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error("Server did not start in time");
}

async function json(pathname, options) {
  const response = await fetch(`${base}${pathname}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function run() {
  try {
    await waitForServer();

    const health = await json("/api/health");
    record("health endpoint", health.response.status === 200 && health.body.ok === true, String(health.response.status));
    record("health reports app version", Boolean(health.body.app?.version), health.body.app?.version || "");

    const update = await json("/api/update");
    record("update endpoint is local and safe", update.response.status === 200 && update.body.currentVersion, update.body.message || "");

    const status = await json("/api/bird/status");
    record("bird status endpoint", status.response.status === 200 && status.body.provider === "ollama", status.body.message);

    const chat = await json("/api/bird/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        message: "Give me three content ideas",
        metrics: { revenueToday: 286, roas: 3.4 },
        goals: [{ title: "TikTok Shop", status: "In Review" }],
        store: {
          catalog: {
            newProducts: [{ title: "Test Product", productType: "Accessory", tags: ["launch"] }],
            topProducts: [{ title: "Top Product", quantitySold: 3 }]
          }
        }
      })
    });
    record("bird chat returns safe text", Boolean(chat.body.text) && ["ollama", "fallback"].includes(chat.body.provider), chat.body.error || chat.body.provider);

    const syncGet = await fetch(`${base}/api/sync?source=all`);
    record("sync rejects GET", syncGet.status === 405, String(syncGet.status));

    const syncBadOrigin = await json("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      body: JSON.stringify({ source: "all" })
    });
    record("sync rejects foreign origin", syncBadOrigin.response.status === 403, String(syncBadOrigin.response.status));

    const syncLocal = await json("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ source: "all" })
    });
    record("sync returns store context shape", Boolean(syncLocal.body.store?.catalog && syncLocal.body.store?.sources), String(syncLocal.response.status));

    const disconnectGet = await fetch(`${base}/api/disconnect?provider=shopify`);
    record("disconnect rejects GET", disconnectGet.status === 405, String(disconnectGet.status));

    const disconnectPost = await json("/api/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ provider: "shopify" })
    });
    record("disconnect accepts local POST", disconnectPost.response.status === 200 && disconnectPost.body.ok === true, String(disconnectPost.response.status));

    const dotfile = await fetch(`${base}/.env.example`);
    record("dotfiles blocked", dotfile.status === 403, String(dotfile.status));

    const badJson = await json("/api/bird/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: "{not-json"
    });
    record("invalid json returns 400", badJson.response.status === 400, String(badJson.response.status));
  } finally {
    server.kill();
    for (const filePath of [tokenPath, statePath]) {
      try {
        fs.rmSync(filePath, { force: true });
      } catch {
        // Best effort cleanup for local test artifacts.
      }
    }
  }

  const failed = results.filter((item) => !item.pass);
  for (const item of results) {
    console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
  }
  if (failed.length) process.exitCode = 1;
}

run().catch((error) => {
  server.kill();
  console.error(error);
  process.exit(1);
});
