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
    preferredModTokensRef,
    serverMods: mods.serverMods,
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
  });

  const preferredModTokens = useMemo(() => {
    const runtimeTokens = runtime.serverRuntime.launchArgs
      .filter((argument) => argument.startsWith("-mod="))
      .flatMap((argument) => argument.slice(5).split(";"))
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
      runtime.appendPreviewLog("[launcher] Live server launch works in the Electron desktop build.");
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
      runtime.appendPreviewLog("[launcher] Live server stop works in the Electron desktop build.");
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
      runtime.appendPreviewLog("[launcher] Live server restart works in the Electron desktop build.");
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
      runtime.appendPreviewLog("[launcher] Client launch works in the Electron desktop build.");
      return;
    }

    try {
      const [resolutionWidth, resolutionHeight] = workspace.clientSettings.resolution
        .toLowerCase()
        .split("x")
        .map((part) => Number.parseInt(part.trim(), 10));

      const result = await dayzApi.launchClient({
        serverAddress: "127.0.0.1",
        serverPort: 2302,
        mods: mods.serverMods.filter((mod) => mod.enabled).map((mod) => mod.path),
        executablePath: workspace.clientPath || undefined,
        enableBattleye: workspace.serverConfigValues.battlEye,
        displayMode: workspace.clientSettings.displayMode,
        resolutionWidth,
        resolutionHeight,
      });

      runtime.appendPreviewLog(`[launcher] Launched DayZ client with ${result.args.join(" ")}`);
    } catch (error) {
      runtime.appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to launch DayZ client."}`,
        "stderr",
      );
    }
  }, [dayzApi, mods.serverMods, runtime, workspace.clientPath, workspace.clientSettings, workspace.serverConfigValues.battlEye]);

  return (
    <DayzServerWorkspace
      serverTab={serverTab}
      setServerTab={(tab) => {
        startTransition(() => {
          setServerTab(tab);
        });
      }}
      runtime={runtime.serverRuntime}
      isServerPending={runtime.isServerPending}
      onStart={handleStartServer}
      onStop={handleStopServer}
      onRestart={handleRestartServer}
      onLaunchClient={handleLaunchClient}
      modsSearch={mods.modsSearch}
      setModsSearch={mods.setModsSearch}
      pathValues={workspace.pathValues}
      enabledMods={mods.enabledMods}
      availableWorkshopMods={mods.availableWorkshopMods}
      availableLocalMods={mods.availableLocalMods}
      onToggleModEnabled={mods.toggleModEnabled}
      onRefreshMods={() => mods.scanServerMods(mods.getRefreshTargetRoot(workspace.pathValues))}
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
    />
  );
}
