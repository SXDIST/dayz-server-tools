"use client";

import { useCallback } from "react";

import { DAYZ_SERVER_ROOT_LABEL, SERVER_MODS_LABEL, type ServerConfigValues } from "@/components/dayz-server/constants";
import { parseClientResolution, resolveMissionsFolderPath } from "@/components/dayz-server/page-helpers";

type RuntimeActions = {
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  setClientRuntime: React.Dispatch<React.SetStateAction<DayzClientRuntime>>;
  setIsClientPending: React.Dispatch<React.SetStateAction<boolean>>;
  setIsServerPending: React.Dispatch<React.SetStateAction<boolean>>;
  setServerRuntime: React.Dispatch<React.SetStateAction<DayzServerRuntime>>;
};

type WorkspaceServerActions = {
  buildLaunchOptions: () => DayzServerLaunchOptions;
  handleAutoScanServer: () => Promise<void>;
  pathValues: Record<string, string>;
  serverConfigPath: string;
  serverConfigValues: ServerConfigValues;
  setServerConfigValues: React.Dispatch<React.SetStateAction<ServerConfigValues>>;
};

type WorkspaceClientState = {
  clientPath: string;
  clientSettings: {
    displayMode: "windowed" | "fullscreen";
    resolution: string;
  };
  serverConfigValues: ServerConfigValues;
};

type WorkspaceMissionState = {
  missions: DayzMission[];
  pathValues: Record<string, string>;
  serverConfigValues: ServerConfigValues;
};

type ModsActions = {
  scanServerMods: (serverRoot: string) => Promise<void>;
  scanWorkshopMods: (serverRoot: string) => Promise<void>;
  serverMods: DayzParsedMod[];
};

type UseDayzPageActionsOptions = {
  dayzApi: DesktopBridge["dayz"] | undefined;
  modsActions: ModsActions;
  runtimeActions: RuntimeActions;
  workspaceClientState: WorkspaceClientState;
  workspaceMissionState: WorkspaceMissionState;
  workspaceServerActions: WorkspaceServerActions;
};

function mergeRuntimeLogs(nextRuntime: DayzServerRuntime, current: DayzServerRuntime) {
  return {
    ...nextRuntime,
    logs: nextRuntime.logs.length > 0 ? nextRuntime.logs : current.logs,
  };
}

export function useDayzPageActions({
  dayzApi,
  modsActions,
  runtimeActions,
  workspaceClientState,
  workspaceMissionState,
  workspaceServerActions,
}: UseDayzPageActionsOptions) {
  const persistServerConfig = useCallback(async () => {
    if (!dayzApi) {
      return;
    }

    const snapshot = await dayzApi.writeServerConfig({
      serverRoot: workspaceServerActions.pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "",
      configPath: workspaceServerActions.serverConfigPath || undefined,
      values: workspaceServerActions.serverConfigValues,
    });

    if (snapshot.path) {
      workspaceServerActions.setServerConfigValues((current) => ({
        ...current,
        ...workspaceServerActions.serverConfigValues,
      }));
      runtimeActions.appendPreviewLog(`[cfg] Saved ${snapshot.path}`);
    }
  }, [dayzApi, runtimeActions, workspaceServerActions]);

  const handleStartServer = useCallback(async () => {
    const launchOptions = workspaceServerActions.buildLaunchOptions();

    if (!launchOptions.serverRoot) {
      runtimeActions.appendPreviewLog("[launcher] Select a DayZ Server root before launching.", "stderr");
      return;
    }

    if (!dayzApi) {
      runtimeActions.appendPreviewLog("[launcher] Live server launch works in the desktop build.");
      runtimeActions.setServerRuntime((current) => ({ ...current, status: "running" }));
      return;
    }

    runtimeActions.setIsServerPending(true);

    try {
      await persistServerConfig();
      const nextRuntime = await dayzApi.startServer(launchOptions);
      runtimeActions.setServerRuntime((current) => mergeRuntimeLogs(nextRuntime, current));
    } catch (error) {
      runtimeActions.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to launch DayZ Server."}`,
        "stderr",
      );
    } finally {
      runtimeActions.setIsServerPending(false);
    }
  }, [dayzApi, persistServerConfig, runtimeActions, workspaceServerActions]);

  const handleStopServer = useCallback(async () => {
    if (!dayzApi) {
      runtimeActions.appendPreviewLog("[launcher] Live server stop works in the desktop build.");
      runtimeActions.setServerRuntime((current) => ({ ...current, status: "stopped" }));
      return;
    }

    runtimeActions.setIsServerPending(true);

    try {
      const nextRuntime = await dayzApi.stopServer();
      runtimeActions.setServerRuntime((current) => mergeRuntimeLogs(nextRuntime, current));
    } catch (error) {
      runtimeActions.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to stop DayZ Server."}`,
        "stderr",
      );
    } finally {
      runtimeActions.setIsServerPending(false);
    }
  }, [dayzApi, runtimeActions]);

  const handleRestartServer = useCallback(async () => {
    const launchOptions = workspaceServerActions.buildLaunchOptions();

    if (!launchOptions.serverRoot) {
      runtimeActions.appendPreviewLog("[launcher] Select a DayZ Server root before restarting.", "stderr");
      return;
    }

    if (!dayzApi) {
      runtimeActions.appendPreviewLog("[launcher] Live server restart works in the desktop build.");
      runtimeActions.setServerRuntime((current) => ({ ...current, status: "starting" }));
      return;
    }

    runtimeActions.setIsServerPending(true);

    try {
      await persistServerConfig();
      const nextRuntime = await dayzApi.restartServer(launchOptions);
      runtimeActions.setServerRuntime((current) => mergeRuntimeLogs(nextRuntime, current));
    } catch (error) {
      runtimeActions.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to restart DayZ Server."}`,
        "stderr",
      );
    } finally {
      runtimeActions.setIsServerPending(false);
    }
  }, [dayzApi, persistServerConfig, runtimeActions, workspaceServerActions]);

  const handleLaunchClient = useCallback(async () => {
    if (!dayzApi) {
      runtimeActions.appendPreviewLog("[launcher] Client launch works in the desktop build.");
      return;
    }

    runtimeActions.setIsClientPending(true);

    try {
      runtimeActions.appendPreviewLog("[client] Preparing local DayZ client launch...");
      runtimeActions.appendPreviewLog(
        `[client] Display ${workspaceClientState.clientSettings.displayMode} at ${workspaceClientState.clientSettings.resolution}`,
      );
      runtimeActions.appendPreviewLog(
        `[client] Enabled mods: ${
          modsActions.serverMods.filter((mod) => mod.enabled).map((mod) => mod.displayName).join(", ") || "none"
        }`,
      );

      const { resolutionWidth, resolutionHeight } = parseClientResolution(workspaceClientState.clientSettings.resolution);

      const result = await dayzApi.launchClient({
        serverRoot: workspaceServerActions.pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "",
        serverAddress: "127.0.0.1",
        serverPort: 2302,
        mods: modsActions.serverMods
          .filter((mod) => mod.enabled && mod.launchMode !== "serverMod")
          .map((mod) => mod.path),
        executablePath: workspaceClientState.clientPath || undefined,
        enableBattleye: workspaceClientState.serverConfigValues.battlEye,
        displayMode: workspaceClientState.clientSettings.displayMode,
        resolutionWidth,
        resolutionHeight,
      });
      runtimeActions.appendPreviewLog(`[client] Launch accepted for ${result.executablePath}`);
    } catch (error) {
      runtimeActions.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to launch DayZ client."}`,
        "stderr",
      );
    } finally {
      runtimeActions.setIsClientPending(false);
    }
  }, [dayzApi, modsActions.serverMods, runtimeActions, workspaceClientState, workspaceServerActions.pathValues]);

  const handleStopClient = useCallback(async () => {
    if (!dayzApi) {
      runtimeActions.appendPreviewLog("[client] Client stop works in the desktop build.");
      runtimeActions.setClientRuntime({
        status: "stopped",
        pid: null,
        startedAt: null,
        executablePath: null,
        launchArgs: [],
      });
      return;
    }

    runtimeActions.setIsClientPending(true);

    try {
      await dayzApi.stopClient();
    } catch (error) {
      runtimeActions.appendPreviewLog(
        `[client] ${error instanceof Error ? error.message : "Failed to stop DayZ client."}`,
        "stderr",
      );
    } finally {
      runtimeActions.setIsClientPending(false);
    }
  }, [dayzApi, runtimeActions]);

  const handleOpenModDirectory = useCallback(
    async (modPath: string) => {
      if (!dayzApi) {
        return;
      }

      try {
        await dayzApi.openPath(modPath);
      } catch (error) {
        runtimeActions.appendPreviewLog(
          `[mods] ${error instanceof Error ? error.message : "Failed to open mod folder."}`,
          "stderr",
        );
      }
    },
    [dayzApi, runtimeActions],
  );

  const handleRefreshMods = useCallback(async () => {
    const serverRoot = workspaceServerActions.pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "";
    const serverModsRoot = workspaceServerActions.pathValues[SERVER_MODS_LABEL] || serverRoot;

    if (!serverRoot && !serverModsRoot) {
      await workspaceServerActions.handleAutoScanServer();
      return;
    }

    await Promise.all([
      modsActions.scanServerMods(serverModsRoot),
      serverRoot ? modsActions.scanWorkshopMods(serverRoot) : Promise.resolve(),
    ]);
  }, [modsActions, workspaceServerActions]);

  const handleOpenMissionsFolder = useCallback(async () => {
    const missionsPath = resolveMissionsFolderPath({
      configuredMissionsPath: (workspaceMissionState.pathValues.mpmissions ?? "").trim(),
      missions: workspaceMissionState.missions,
      template: workspaceMissionState.serverConfigValues.template,
    });

    if (!dayzApi || !missionsPath) {
      runtimeActions.appendPreviewLog("[missions] Missions folder path is not available yet.", "stderr");
      return;
    }

    try {
      runtimeActions.appendPreviewLog(`[missions] Opening ${missionsPath}`);
      await dayzApi.openPath(missionsPath);
      runtimeActions.appendPreviewLog("[missions] Missions folder opened.");
    } catch (error) {
      runtimeActions.appendPreviewLog(
        `[missions] ${error instanceof Error ? error.message : "Failed to open missions folder."}`,
        "stderr",
      );
    }
  }, [dayzApi, runtimeActions, workspaceMissionState]);

  return {
    persistServerConfig,
    handleStartServer,
    handleStopServer,
    handleRestartServer,
    handleLaunchClient,
    handleStopClient,
    handleOpenModDirectory,
    handleRefreshMods,
    handleOpenMissionsFolder,
  };
}
