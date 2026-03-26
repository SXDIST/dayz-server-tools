const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  platform: process.platform,
  isElectron: true,
  dayz: {
    pickFolder: (options) => ipcRenderer.invoke("dayz:pick-folder", options),
    pickExecutable: (options) => ipcRenderer.invoke("dayz:pick-executable", options),
    detectClientExecutable: () => ipcRenderer.invoke("dayz:detect-client-executable"),
    detectServerPaths: (serverRoot) => ipcRenderer.invoke("dayz:detect-server-paths", serverRoot),
    autoDetectServerPaths: () => ipcRenderer.invoke("dayz:auto-detect-server-paths"),
    getServerRuntime: () => ipcRenderer.invoke("dayz:get-runtime"),
    startServer: (options) => ipcRenderer.invoke("dayz:start-server", options),
    stopServer: () => ipcRenderer.invoke("dayz:stop-server"),
    restartServer: (options) => ipcRenderer.invoke("dayz:restart-server", options),
    readServerConfig: (configPath) => ipcRenderer.invoke("dayz:read-server-config", configPath),
    writeServerConfig: (options) => ipcRenderer.invoke("dayz:write-server-config", options),
    scanMissions: (missionsRoot) => ipcRenderer.invoke("dayz:scan-missions", missionsRoot),
    readMissionSessionSettings: (missionPath) => ipcRenderer.invoke("dayz:read-mission-session-settings", missionPath),
    previewInitGenerator: (request) => ipcRenderer.invoke("dayz:preview-init-generator", request),
    backupInitGenerator: (request) => ipcRenderer.invoke("dayz:backup-init-generator", request),
    applyInitGenerator: (request) => ipcRenderer.invoke("dayz:apply-init-generator", request),
    scanMods: (serverRoot) => ipcRenderer.invoke("dayz:scan-mods", serverRoot),
    scanWorkshopMods: (serverRoot) => ipcRenderer.invoke("dayz:scan-workshop-mods", serverRoot),
    inspectModFolder: (modRoot) => ipcRenderer.invoke("dayz:inspect-mod-folder", modRoot),
    launchClient: (options) => ipcRenderer.invoke("dayz:launch-client", options),
    getWorkspaceState: () => ipcRenderer.invoke("dayz:get-workspace-state"),
    saveWorkspaceState: (state) => ipcRenderer.invoke("dayz:save-workspace-state", state),
    onServerLog: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on("dayz:server-log", listener);
      return () => ipcRenderer.removeListener("dayz:server-log", listener);
    },
    onServerStatus: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on("dayz:server-status", listener);
      return () => ipcRenderer.removeListener("dayz:server-status", listener);
    },
  },
});
