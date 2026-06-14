const { app, BrowserWindow, dialog, session, shell } = require("electron");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const DEFAULT_PORT = Number(process.env.PORT || 4173);
const APP_VERSION = "0.3.10";
const APP_ID = "com.rookepoole.littlebird";

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-gpu-rasterization");
app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-accelerated-2d-canvas");
app.commandLine.appendSwitch("disable-accelerated-video-decode");
app.commandLine.appendSwitch(
  "disable-features",
  "Vulkan,WebGPU,DawnGraphite,CanvasOopRasterization,UseSkiaRenderer,CalculateNativeWinOcclusion"
);

let mainWindow;
let serverProcess;
let serverPort = DEFAULT_PORT;
let rendererReloads = 0;

app.setName("Little Bird");
if (process.platform === "win32") {
  app.setAppUserModelId(APP_ID);
}

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
}

app.on("second-instance", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow(serverPort);
    return;
  }
  showMainWindow();
});

app.whenReady().then(async () => {
  try {
    await resetRendererStorage();
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
  rendererReloads = 0;
  const windowOptions = {
    width: 520,
    height: 900,
    minWidth: 420,
    minHeight: 720,
    title: "Little Bird",
    backgroundColor: "#111111",
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };

  const iconPath = getIconPath();
  if (iconPath) {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.center();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.once("ready-to-show", showMainWindow);
  mainWindow.webContents.once("did-finish-load", showMainWindow);
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error(`Little Bird renderer stopped: ${details.reason || "unknown"} ${details.exitCode || ""}`.trim());
    recoverRenderer(port);
  });
  setTimeout(showMainWindow, 1200);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://github.com/rookepoole/LittleBird/releases/")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.loadURL(getAppUrl(port));
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
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

function getIconPath() {
  const iconFile = process.platform === "win32" ? "icon.ico" : "icon-256.png";
  return path.join(__dirname, "..", "resources", iconFile);
}

async function resetRendererStorage() {
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ["cachestorage", "serviceworkers"]
    });
  } catch (error) {
    console.error(`Little Bird cache reset skipped: ${error.message}`);
  }
}

function recoverRenderer(port) {
  if (!mainWindow || mainWindow.isDestroyed() || app.isQuitting) return;
  if (rendererReloads >= 2) {
    dialog.showErrorBox(
      "Little Bird window stopped",
      "The desktop window restarted more than once. Close Little Bird and open it again from the desktop shortcut."
    );
    return;
  }
  rendererReloads += 1;
  setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.loadURL(getAppUrl(port));
    showMainWindow();
  }, 500);
}

function getAppUrl(port) {
  return `http://127.0.0.1:${port}/?v=${APP_VERSION}&desktop=1`;
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
