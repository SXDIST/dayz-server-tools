"use client";

import { startTransition, useCallback, useMemo, useRef, useState } from "react";

import type { ServerTab } from "@/components/dayz-server/constants";
import { DayzServerWorkspace } from "@/components/dayz-server/workspace";
import { useDayzInitGenerator } from "@/components/dayz-server/hooks/use-dayz-init-generator";
import { useDayzMods } from "@/components/dayz-server/hooks/use-dayz-mods";
import { useDayzRuntime } from "@/components/dayz-server/hooks/use-dayz-runtime";
import { useDayzWorkspace } from "@/components/dayz-server/hooks/use-dayz-workspace";

export function DayzServerPage() {
  const desktopBridge = typeof window !== "undefined" ? window.desktopBridge : undefined;
  const dayzApi = desktopBridge?.dayz;
  const isDesktop = desktopBridge?.isElectron === true;
  const [serverTab, setServerTab] = useState<ServerTab>("overview");

  const runtime = useDayzRuntime(dayzApi, isDesktop);
  const preferredModTokensRef = useRef<string[]>([]);

  const mods = useDayzMods({
    dayzApi,
    appendPreviewLog: runtime.appendPreviewLog,
    preferredModTokensRef,
  });

  const workspace = useDayzWorkspace({
    dayzApi,
    isDesktop,
    appendPreviewLog: runtime.appendPreviewLog,
    scanServerMods: mods.scanServerMods,
    scanWorkshopMods: mods.scanWorkshopMods,
    setDetectedModsFromScan: mods.setDetectedMods,
    applyImportedLocalModPaths: mods.applyImportedLocalModPaths,
    hydrateModPresets: mods.hydrateModPresets,
    preferredModTokensRef,
    serverMods: mods.serverMods,
    modPresets: mods.modPresets,
    selectedModPresetId: mods.selectedModPresetId,
  });

  const workspaceState = workspace;
  const initActiveMods = useMemo(
    () =>
      mods.serverMods
        .filter((mod) => mod.enabled)
        .map((mod) => ({
          name: mod.displayName,
          path: mod.path,
          source: mod.source,
        })),
    [mods.serverMods],
  );

  const initGenerator = useDayzInitGenerator({
    dayzApi,
    isDesktop,
    appendPreviewLog: runtime.appendPreviewLog,
    missions: workspace.missions,
    activeMissionName: workspace.serverConfigValues.template,
    activeMods: initActiveMods,
    initGeneratorState: workspace.initGeneratorState,
    setInitGeneratorState: workspace.setInitGeneratorState,
    presetNameInput: workspace.initPresetNameInput,
    setPresetNameInput: workspace.setInitPresetNameInput,
    selectedPresetId: workspace.selectedInitLoadoutPresetId,
    setSelectedPresetId: workspace.setSelectedInitLoadoutPresetId,
  });

  const preferredModTokens = useMemo(() => {
    const runtimeTokens = runtime.serverRuntime.launchArgs
      .filter((argument) => argument.startsWith("-mod=") || argument.startsWith("-serverMod="))
      .flatMap((argument) => argument.slice(argument.indexOf("=") + 1).split(";"))
      .filter(Boolean);
    const selectedModPaths = mods.serverMods.filter((mod) => mod.enabled).map((mod) => mod.path);

    return [
      ...new Set([
        ...workspaceState.configModTokens,
        ...runtimeTokens,
        ...workspaceState.persistedEnabledModPaths,
        ...selectedModPaths,
      ]),
    ];
  }, [
    mods.serverMods,
    runtime.serverRuntime.launchArgs,
    workspaceState.configModTokens,
    workspaceState.persistedEnabledModPaths,
  ]);

  preferredModTokensRef.current = preferredModTokens;

  const persistServerConfig = useCallback(async () => {
    if (!dayzApi) {
      return;
    }

    const snapshot = await dayzApi.writeServerConfig({
      serverRoot: workspace.pathValues["DayZ Server Root"] ?? "",
      configPath: workspace.serverConfigPath || undefined,
      values: workspace.serverConfigValues,
    });

    if (snapshot.path) {
      workspace.setServerConfigValues((current) => ({
        ...current,
        ...workspace.serverConfigValues,
      }));
      runtime.appendPreviewLog(`[cfg] Saved ${snapshot.path}`);
    }
  }, [dayzApi, runtime, workspace]);

  const handleStartServer = useCallback(async () => {
    const launchOptions = workspace.buildLaunchOptions();

    if (!launchOptions.serverRoot) {
      runtime.appendPreviewLog("[launcher] Select a DayZ Server root before launching.", "stderr");
      return;
    }

    if (!dayzApi) {
      runtime.appendPreviewLog("[launcher] Live server launch works in the desktop build.");
      runtime.setServerRuntime((current) => ({ ...current, status: "running" }));
      return;
    }

    runtime.setIsServerPending(true);

    try {
      await persistServerConfig();
      const nextRuntime = await dayzApi.startServer(launchOptions);
      runtime.setServerRuntime((current) => ({
        ...nextRuntime,
        logs: nextRuntime.logs.length > 0 ? nextRuntime.logs : current.logs,
      }));
    } catch (error) {
      runtime.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to launch DayZ Server."}`,
        "stderr",
      );
    } finally {
      runtime.setIsServerPending(false);
    }
  }, [dayzApi, persistServerConfig, runtime, workspace]);

  const handleStopServer = useCallback(async () => {
    if (!dayzApi) {
      runtime.appendPreviewLog("[launcher] Live server stop works in the desktop build.");
      runtime.setServerRuntime((current) => ({ ...current, status: "stopped" }));
      return;
    }

    runtime.setIsServerPending(true);

    try {
      const nextRuntime = await dayzApi.stopServer();
      runtime.setServerRuntime((current) => ({
        ...nextRuntime,
        logs: nextRuntime.logs.length > 0 ? nextRuntime.logs : current.logs,
      }));
    } catch (error) {
      runtime.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to stop DayZ Server."}`,
        "stderr",
      );
    } finally {
      runtime.setIsServerPending(false);
    }
  }, [dayzApi, runtime]);

  const handleRestartServer = useCallback(async () => {
    const launchOptions = workspace.buildLaunchOptions();

    if (!launchOptions.serverRoot) {
      runtime.appendPreviewLog("[launcher] Select a DayZ Server root before restarting.", "stderr");
      return;
    }

    if (!dayzApi) {
      runtime.appendPreviewLog("[launcher] Live server restart works in the desktop build.");
      runtime.setServerRuntime((current) => ({ ...current, status: "starting" }));
      return;
    }

    runtime.setIsServerPending(true);

    try {
      await persistServerConfig();
      const nextRuntime = await dayzApi.restartServer(launchOptions);
      runtime.setServerRuntime((current) => ({
        ...nextRuntime,
        logs: nextRuntime.logs.length > 0 ? nextRuntime.logs : current.logs,
      }));
    } catch (error) {
      runtime.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to restart DayZ Server."}`,
        "stderr",
      );
    } finally {
      runtime.setIsServerPending(false);
    }
  }, [dayzApi, persistServerConfig, runtime, workspace]);

  const handleLaunchClient = useCallback(async () => {
    if (!dayzApi) {
      runtime.appendPreviewLog("[launcher] Client launch works in the desktop build.");
      return;
    }

    runtime.setIsClientPending(true);

    try {
      runtime.appendPreviewLog("[client] Preparing local DayZ client launch...");
      runtime.appendPreviewLog(
        `[client] Display ${workspace.clientSettings.displayMode} at ${workspace.clientSettings.resolution}`,
      );
      runtime.appendPreviewLog(
        `[client] Enabled mods: ${
          mods.serverMods.filter((mod) => mod.enabled).map((mod) => mod.displayName).join(", ") || "none"
        }`,
      );
      const [resolutionWidth, resolutionHeight] = workspace.clientSettings.resolution
        .toLowerCase()
        .split("x")
        .map((part) => Number.parseInt(part.trim(), 10));

      const result = await dayzApi.launchClient({
        serverAddress: "127.0.0.1",
        serverPort: 2302,
        mods: mods.serverMods
          .filter((mod) => mod.enabled && mod.launchMode !== "serverMod")
          .map((mod) => mod.path),
        executablePath: workspace.clientPath || undefined,
        enableBattleye: workspace.serverConfigValues.battlEye,
        displayMode: workspace.clientSettings.displayMode,
        resolutionWidth,
        resolutionHeight,
      });
      runtime.appendPreviewLog(`[client] Launch accepted for ${result.executablePath}`);
    } catch (error) {
      runtime.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to launch DayZ client."}`,
        "stderr",
      );
    } finally {
      runtime.setIsClientPending(false);
    }
  }, [dayzApi, mods.serverMods, runtime, workspace.clientPath, workspace.clientSettings, workspace.serverConfigValues.battlEye]);

  const handleStopClient = useCallback(async () => {
    if (!dayzApi) {
      runtime.appendPreviewLog("[client] Client stop works in the desktop build.");
      runtime.setClientRuntime({
        status: "stopped",
        pid: null,
        startedAt: null,
        executablePath: null,
        launchArgs: [],
      });
      return;
    }

    runtime.setIsClientPending(true);

    try {
      await dayzApi.stopClient();
    } catch (error) {
      runtime.appendPreviewLog(
        `[client] ${error instanceof Error ? error.message : "Failed to stop DayZ client."}`,
        "stderr",
      );
    } finally {
      runtime.setIsClientPending(false);
    }
  }, [dayzApi, runtime]);

  const handleOpenModDirectory = useCallback(
    async (modPath: string) => {
      if (!dayzApi) {
        return;
      }

      try {
        await dayzApi.openPath(modPath);
      } catch (error) {
        runtime.appendPreviewLog(
          `[mods] ${error instanceof Error ? error.message : "Failed to open mod folder."}`,
          "stderr",
        );
      }
    },
    [dayzApi, runtime],
  );

  const handleOpenMissionsFolder = useCallback(async () => {
    const configuredMissionsPath = (workspace.pathValues.mpmissions ?? "").trim();
    const activeMission =
      workspace.missions.find((mission) => mission.name === workspace.serverConfigValues.template) ??
      workspace.missions[0] ??
      null;
    const activeMissionPath = (activeMission?.path ?? "").trim();
    const derivedMissionsRoot = activeMissionPath.replace(/[\\/][^\\/]+$/, "");
    const missionsPath = configuredMissionsPath || derivedMissionsRoot || activeMissionPath;

    if (!dayzApi || !missionsPath) {
      runtime.appendPreviewLog("[missions] Missions folder path is not available yet.", "stderr");
      return;
    }

    try {
      runtime.appendPreviewLog(`[missions] Opening ${missionsPath}`);
      await dayzApi.openPath(missionsPath);
      runtime.appendPreviewLog("[missions] Missions folder opened.");
    } catch (error) {
      runtime.appendPreviewLog(
        `[missions] ${error instanceof Error ? error.message : "Failed to open missions folder."}`,
        "stderr",
      );
    }
  }, [dayzApi, runtime, workspace.missions, workspace.pathValues.mpmissions, workspace.serverConfigValues.template]);

  return (
    <DayzServerWorkspace
      serverTab={serverTab}
      setServerTab={(tab) => {
        startTransition(() => {
          setServerTab(tab);
        });
      }}
      runtime={runtime.serverRuntime}
      clientRuntime={runtime.clientRuntime}
      isServerPending={runtime.isServerPending}
      isClientPending={runtime.isClientPending}
      onStart={handleStartServer}
      onStop={handleStopServer}
      onRestart={handleRestartServer}
      onLaunchClient={handleLaunchClient}
      onStopClient={handleStopClient}
      modsSearch={mods.modsSearch}
      setModsSearch={mods.setModsSearch}
      pathValues={workspace.pathValues}
      enabledMods={mods.enabledMods}
      availableWorkshopMods={mods.availableWorkshopMods}
      availableLocalMods={mods.availableLocalMods}
      modPresets={mods.modPresets}
      modPresetNameInput={mods.modPresetNameInput}
      setModPresetNameInput={mods.setModPresetNameInput}
      selectedModPresetId={mods.selectedModPresetId}
      setSelectedModPresetId={mods.setSelectedModPresetId}
      onSaveModPreset={mods.saveCurrentModPreset}
      onLoadModPreset={mods.loadSelectedModPreset}
      onDeleteModPreset={mods.deleteSelectedModPreset}
      onToggleModEnabled={mods.toggleModEnabled}
      onRemoveModFromList={mods.removeModFromList}
      onDeleteModFiles={mods.deleteModFiles}
      onOpenModDirectory={handleOpenModDirectory}
      onRefreshMods={async () => {
        const targetRoot = mods.getRefreshTargetRoot(workspace.pathValues);
        await Promise.all([mods.scanServerMods(targetRoot), mods.scanWorkshopMods(targetRoot)]);
      }}
      onImportLocalMod={mods.importLocalMod}
      serverConfigValues={workspace.serverConfigValues}
      setServerConfigValues={workspace.setServerConfigValues}
      missions={workspace.missions}
      initGeneratorState={workspace.initGeneratorState}
      setInitGeneratorState={workspace.setInitGeneratorState}
      initSelectedMissionName={initGenerator.selectedMissionName}
      setInitSelectedMissionName={initGenerator.setSelectedMissionName}
      initPreviewResult={initGenerator.previewResult}
      isInitPreviewPending={initGenerator.isPreviewPending}
      isInitBackupPending={initGenerator.isBackupPending}
      isInitApplyPending={initGenerator.isApplyPending}
      initPresetNameInput={initGenerator.presetNameInput}
      setInitPresetNameInput={initGenerator.setPresetNameInput}
      initSelectedPresetId={initGenerator.selectedPresetId}
      setInitSelectedPresetId={initGenerator.setSelectedPresetId}
      onGenerateInitPreview={initGenerator.generatePreview}
      onBackupGeneratedInit={initGenerator.backupCurrentInit}
      onApplyGeneratedInit={initGenerator.applyGeneratedInit}
      onSaveInitLoadoutPreset={initGenerator.saveCurrentLoadoutPreset}
      onLoadInitLoadoutPreset={initGenerator.loadSelectedPreset}
      onDeleteInitLoadoutPreset={initGenerator.deleteSelectedPreset}
      clientPath={workspace.clientPath}
      setClientPath={workspace.setClientPath}
      clientSettings={workspace.clientSettings}
      setClientSettings={workspace.setClientSettings}
      onPathChange={(label, value) =>
        workspace.setPathValues((current) => ({
          ...current,
          [label]: value,
        }))
      }
      onBrowseClientPath={workspace.handleBrowseClientPath}
      onBrowsePath={workspace.handleBrowsePath}
      onAutoScanServer={workspace.handleAutoScanServer}
      onSavePathOverrides={workspace.handleSavePathOverrides}
      onResetPaths={workspace.handleResetPaths}
      onRefreshMissions={() => workspace.scanMissions(workspace.pathValues.mpmissions ?? "")}
      onOpenMissionsFolder={handleOpenMissionsFolder}
    />
  );
}
