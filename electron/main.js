const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const DEFAULT_PORT = Number(process.env.PORT || 4173);
const APP_VERSION = "0.3.1";

let mainWindow;
let serverProcess;
let serverPort = DEFAULT_PORT;

app.setName("Little Bird");

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  try {
    serverPort = await startLocalServer();
    createWindow(serverPort);
  } catch (error) {
    dialog.showErrorBox("Little Bird could not start", error.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  stopLocalServer();
});

async function startLocalServer() {
  const appDir = getBundledAppDir();
  const port = await choosePort(DEFAULT_PORT);
  const serverPath = path.join(appDir, "server.js");
  const dataDir = path.join(app.getPath("userData"), "data");
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    HOST: "127.0.0.1",
    PORT: String(port),
    PUBLIC_BASE_URL: `http://127.0.0.1:${port}`,
    LITTLE_BIRD_VERSION: APP_VERSION,
    LITTLE_BIRD_DATA_DIR: dataDir
  };

  serverProcess = spawn(process.execPath, [serverPath, `--port=${port}`, "--host=127.0.0.1"], {
    cwd: appDir,
    env,
    windowsHide: true,
    stdio: "ignore"
  });

  serverProcess.once("exit", (code) => {
    if (!app.isQuitting && code !== 0) {
      dialog.showErrorBox("Little Bird server stopped", "The local Little Bird server stopped unexpectedly.");
    }
  });

  await waitForHealth(port);
  return port;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 900,
    minWidth: 420,
    minHeight: 720,
    title: "Little Bird",
    backgroundColor: "#111111",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://github.com/rookepoole/LittleBird/releases/")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}/?v=${APP_VERSION}`);
}

function stopLocalServer() {
  app.isQuitting = true;
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

function getBundledAppDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "little-bird-app");
  }
  return path.join(__dirname, "..", "app");
}

async function choosePort(preferredPort) {
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error("No local port was available for Little Bird.");
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, "127.0.0.1");
  });
}

async function waitForHealth(port) {
  const healthUrl = `http://127.0.0.1:${port}/api/health`;
  const started = Date.now();
  while (Date.now() - started < 8000) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) return;
    } catch {
      await delay(200);
    }
  }
  throw new Error("The local Little Bird server did not become ready in time.");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
