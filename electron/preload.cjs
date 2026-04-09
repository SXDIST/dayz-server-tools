"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const listenerRegistry = new Map();

function invoke(method, ...args) {
  return ipcRenderer.invoke("desktop:invoke", method, ...args);
}

function subscribe(eventName, callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  let entry = listenerRegistry.get(eventName);
  if (!entry) {
    const callbacks = new Set();
    const handler = (_event, message) => {
      if (!message || message.event !== eventName) {
        return;
      }

      for (const currentCallback of callbacks) {
        try {
          currentCallback(message.payload);
        } catch {}
      }
    };

    ipcRenderer.on("desktop:event", handler);
    entry = { callbacks, handler };
    listenerRegistry.set(eventName, entry);
  }

  entry.callbacks.add(callback);

  return () => {
    const current = listenerRegistry.get(eventName);
    if (!current) {
      return;
    }

    current.callbacks.delete(callback);
    if (current.callbacks.size === 0) {
      ipcRenderer.removeListener("desktop:event", current.handler);
      listenerRegistry.delete(eventName);
    }
  };
}

function subscribeAppEvent(eventName, callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  const handler = (_event, message) => {
    if (!message || message.event !== eventName) {
      return;
    }

    try {
      callback(message.payload);
    } catch {}
  };

  ipcRenderer.on("desktop:app-event", handler);
  return () => {
    ipcRenderer.removeListener("desktop:app-event", handler);
  };
}

contextBridge.exposeInMainWorld("desktopBridge", {
  platform: process.platform,
  isElectron: true,
  app: {
    minimizeWindow: () => invoke("app:minimize-window"),
    toggleMaximizeWindow: () => invoke("app:toggle-maximize-window"),
    closeWindow: () => invoke("app:close-window"),
    confirmClose: () => invoke("app:confirm-close"),
    onBeforeClose: (callback) => subscribeAppEvent("app:before-close", callback),
  },
  dayz: {
    pickFolder: (options) => invoke("dayz:pick-folder", options || {}),
    pickExecutable: (options) => invoke("dayz:pick-executable", options || {}),
    detectClientExecutable: () => invoke("dayz:detect-client-executable"),
    detectServerPaths: (serverRoot) => invoke("dayz:detect-server-paths", serverRoot),
    autoDetectServerPaths: () => invoke("dayz:auto-detect-server-paths"),
    getServerRuntime: () => invoke("dayz:get-runtime"),
    getClientRuntime: () => invoke("dayz:get-client-runtime"),
    startServer: (options) => invoke("dayz:start-server", options),
    stopServer: () => invoke("dayz:stop-server"),
    restartServer: (options) => invoke("dayz:restart-server", options),
    readServerConfig: (configPath) => invoke("dayz:read-server-config", configPath),
    writeServerConfig: (options) => invoke("dayz:write-server-config", options),
    scanMissions: (missionsRoot) => invoke("dayz:scan-missions", missionsRoot),
    readMissionSessionSettings: (missionPath) => invoke("dayz:read-mission-session-settings", missionPath),
    previewInitGenerator: (request) => invoke("dayz:preview-init-generator", request),
    backupInitGenerator: (request) => invoke("dayz:backup-init-generator", request),
    applyInitGenerator: (request) => invoke("dayz:apply-init-generator", request),
    scanMods: (serverRoot) => invoke("dayz:scan-mods", serverRoot),
    scanWorkshopMods: (serverRoot) => invoke("dayz:scan-workshop-mods", serverRoot),
    inspectModFolder: (modRoot) => invoke("dayz:inspect-mod-folder", modRoot),
    deleteMod: (request) => invoke("dayz:delete-mod", request),
    scanCrashTools: (request) => invoke("dayz:scan-crash-tools", request || {}),
    deleteCrashArtifacts: (request) => invoke("dayz:delete-crash-artifacts", request),
    openPath: (targetPath) => invoke("dayz:open-path", targetPath),
    launchClient: (options) => invoke("dayz:launch-client", options),
    stopClient: () => invoke("dayz:stop-client"),
    getWorkspaceState: () => invoke("dayz:get-workspace-state"),
    saveWorkspaceState: (state) => invoke("dayz:save-workspace-state", state),
    onServerLog: (callback) => subscribe("dayz:server-log", callback),
    onServerStatus: (callback) => subscribe("dayz:server-status", callback),
    onClientStatus: (callback) => subscribe("dayz:client-status", callback),
  },
});
