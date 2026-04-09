"use strict";

const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { BackendHost } = require("./backend-host.cjs");

const backendHost = new BackendHost();
const isDev = !app.isPackaged;
const pendingCloseWindows = new WeakSet();
const closeTimeouts = new WeakMap();

function getRendererUrl() {
  return process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:3210";
}

function getIndexPath() {
  return path.join(app.getAppPath(), "out", "index.html");
}

function createWindow() {
  const browserWindow = new BrowserWindow({
    title: "DayZ Tools Launcher",
    width: 1600,
    height: 1020,
    minWidth: 1240,
    minHeight: 820,
    backgroundColor: "#07111f",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  browserWindow.on("close", (event) => {
    if (pendingCloseWindows.has(browserWindow) || browserWindow.webContents.isDestroyed()) {
      return;
    }

    event.preventDefault();
    browserWindow.webContents.send("desktop:app-event", {
      event: "app:before-close",
      payload: null,
    });

    const existingTimeout = closeTimeouts.get(browserWindow);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      pendingCloseWindows.add(browserWindow);
      closeTimeouts.delete(browserWindow);
      if (!browserWindow.isDestroyed()) {
        browserWindow.close();
      }
    }, 2000);

    closeTimeouts.set(browserWindow, timeoutId);
  });

  if (isDev) {
    void browserWindow.loadURL(getRendererUrl());
    browserWindow.webContents.openDevTools({ mode: "detach" });
    return browserWindow;
  }

  void browserWindow.loadFile(getIndexPath());
  return browserWindow;
}

async function pickPath(browserWindow, defaultPath, mode) {
  const result = await dialog.showOpenDialog(browserWindow, {
    defaultPath: String(defaultPath ?? "").trim() || undefined,
    properties: mode === "file" ? ["openFile"] : ["openDirectory"],
    filters:
      mode === "file"
        ? [{ name: "Executable", extensions: ["exe"] }]
        : undefined,
  });

  if (result.canceled || result.filePaths.length === 0) {
    return "";
  }

  return result.filePaths[0];
}

async function openPath(targetPath) {
  const normalizedPath = String(targetPath ?? "").trim();

  if (!normalizedPath) {
    throw new Error("Path is required.");
  }

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`Path was not found: ${normalizedPath}`);
  }

  if (fs.statSync(normalizedPath).isFile()) {
    shell.showItemInFolder(normalizedPath);
    return true;
  }

  const error = await shell.openPath(normalizedPath);
  if (error) {
    throw new Error(error);
  }

  return true;
}

function broadcastEvent(eventName, payload) {
  for (const browserWindow of BrowserWindow.getAllWindows()) {
    browserWindow.webContents.send("desktop:event", {
      event: eventName,
      payload,
    });
  }
}

ipcMain.handle("desktop:invoke", async (event, method, ...args) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  switch (method) {
    case "app:minimize-window":
      browserWindow?.minimize();
      return null;
    case "app:toggle-maximize-window":
      if (!browserWindow) {
        return false;
      }
      if (browserWindow.isMaximized()) {
        browserWindow.unmaximize();
        return false;
      }
      browserWindow.maximize();
      return true;
    case "app:close-window":
      browserWindow?.close();
      return null;
    case "app:confirm-close":
      if (!browserWindow) {
        return null;
      }
      {
        const timeoutId = closeTimeouts.get(browserWindow);
        if (timeoutId) {
          clearTimeout(timeoutId);
          closeTimeouts.delete(browserWindow);
        }
      }
      pendingCloseWindows.add(browserWindow);
      browserWindow.close();
      return null;
    case "dayz:pick-folder":
      return pickPath(browserWindow, args[0]?.defaultPath, "folder");
    case "dayz:pick-executable":
      return pickPath(browserWindow, args[0]?.defaultPath, "file");
    case "dayz:open-path":
      return openPath(args[0]);
    default:
      return backendHost.invoke(method, ...args);
  }
});

app.whenReady().then(async () => {
  backendHost.on("event", ({ event, payload }) => {
    broadcastEvent(event, payload);
  });

  backendHost.on("stderr", (line) => {
    console.error(line);
  });

  await backendHost.start();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await backendHost.stop();
});
