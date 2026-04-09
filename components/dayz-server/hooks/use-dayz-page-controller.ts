"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type ServerTab } from "@/components/dayz-server/constants";
import { createPreferredModTokens } from "@/components/dayz-server/page-helpers";
import { useDayzPageActions } from "@/components/dayz-server/hooks/use-dayz-page-actions";
import { useDayzInitGenerator } from "@/components/dayz-server/hooks/use-dayz-init-generator";
import { useDayzMods } from "@/components/dayz-server/hooks/use-dayz-mods";
import { useDayzRuntime } from "@/components/dayz-server/hooks/use-dayz-runtime";
import { useDayzWorkspace } from "@/components/dayz-server/hooks/use-dayz-workspace";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { useDesktopBridge } from "@/components/use-desktop-bridge";

export function useDayzPageController(): DayzServerWorkspaceProps {
  const { dayzApi, isDesktop } = useDesktopBridge();
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
    return createPreferredModTokens({
      configModTokens: workspace.configModTokens,
      persistedEnabledModPaths: workspace.persistedEnabledModPaths,
      runtimeLaunchArgs: runtime.serverRuntime.launchArgs,
      serverMods: mods.serverMods,
    });
  }, [
    mods.serverMods,
    runtime.serverRuntime.launchArgs,
    workspace.configModTokens,
    workspace.persistedEnabledModPaths,
  ]);

  useEffect(() => {
    preferredModTokensRef.current = preferredModTokens;
  }, [preferredModTokens]);

  const pageActions = useDayzPageActions({
    dayzApi,
    modsActions: {
      scanServerMods: mods.scanServerMods,
      scanWorkshopMods: mods.scanWorkshopMods,
      serverMods: mods.serverMods,
    },
    runtimeActions: {
      appendPreviewLog: runtime.appendPreviewLog,
      setClientRuntime: runtime.setClientRuntime,
      setIsClientPending: runtime.setIsClientPending,
      setIsServerPending: runtime.setIsServerPending,
      setServerRuntime: runtime.setServerRuntime,
    },
    workspaceClientState: {
      clientPath: workspace.clientPath,
      clientSettings: workspace.clientSettings,
      serverConfigValues: workspace.serverConfigValues,
    },
    workspaceMissionState: {
      missions: workspace.missions,
      pathValues: workspace.pathValues,
      serverConfigValues: workspace.serverConfigValues,
    },
    workspaceServerActions: {
      buildLaunchOptions: workspace.buildLaunchOptions,
      handleAutoScanServer: workspace.handleAutoScanServer,
      pathValues: workspace.pathValues,
      serverConfigPath: workspace.serverConfigPath,
      serverConfigValues: workspace.serverConfigValues,
      setServerConfigValues: workspace.setServerConfigValues,
    },
  });

  const handleSetServerTab = useCallback((tab: ServerTab) => {
    startTransition(() => {
      setServerTab(tab);
    });
  }, []);

  const handlePathChange = useCallback((label: string, value: string) => {
    workspace.setPathValues((current) => ({
      ...current,
      [label]: value,
    }));
  }, [workspace]);

  const handleRefreshMissions = useCallback(() => {
    return workspace.scanMissions(workspace.pathValues.mpmissions ?? "");
  }, [workspace]);

  return {
    serverTab,
    setServerTab: handleSetServerTab,
    runtime: runtime.serverRuntime,
    clientRuntime: runtime.clientRuntime,
    isServerPending: runtime.isServerPending,
    isClientPending: runtime.isClientPending,
    onStart: pageActions.handleStartServer,
    onStop: pageActions.handleStopServer,
    onRestart: pageActions.handleRestartServer,
    onLaunchClient: pageActions.handleLaunchClient,
    onStopClient: pageActions.handleStopClient,
    modsSearch: mods.modsSearch,
    setModsSearch: mods.setModsSearch,
    pathValues: workspace.pathValues,
    enabledMods: mods.enabledMods,
    availableWorkshopMods: mods.availableWorkshopMods,
    availableLocalMods: mods.availableLocalMods,
    modPresets: mods.modPresets,
    modPresetNameInput: mods.modPresetNameInput,
    setModPresetNameInput: mods.setModPresetNameInput,
    selectedModPresetId: mods.selectedModPresetId,
    setSelectedModPresetId: mods.setSelectedModPresetId,
    onSaveModPreset: mods.saveCurrentModPreset,
    onLoadModPreset: mods.loadSelectedModPreset,
    onDeleteModPreset: mods.deleteSelectedModPreset,
    onToggleModEnabled: mods.toggleModEnabled,
    onRemoveModFromList: mods.removeModFromList,
    onDeleteModFiles: mods.deleteModFiles,
    onOpenModDirectory: pageActions.handleOpenModDirectory,
    onRefreshMods: pageActions.handleRefreshMods,
    onImportLocalMod: mods.importLocalMod,
    serverConfigValues: workspace.serverConfigValues,
    setServerConfigValues: workspace.setServerConfigValues,
    missions: workspace.missions,
    initGeneratorState: workspace.initGeneratorState,
    setInitGeneratorState: workspace.setInitGeneratorState,
    initSelectedMissionName: initGenerator.selectedMissionName,
    setInitSelectedMissionName: initGenerator.setSelectedMissionName,
    initPreviewResult: initGenerator.previewResult,
    isInitPreviewPending: initGenerator.isPreviewPending,
    isInitBackupPending: initGenerator.isBackupPending,
    isInitApplyPending: initGenerator.isApplyPending,
    initPresetNameInput: initGenerator.presetNameInput,
    setInitPresetNameInput: initGenerator.setPresetNameInput,
    initSelectedPresetId: initGenerator.selectedPresetId,
    setInitSelectedPresetId: initGenerator.setSelectedPresetId,
    onBackupGeneratedInit: initGenerator.backupCurrentInit,
    onApplyGeneratedInit: initGenerator.applyGeneratedInit,
    onSaveInitLoadoutPreset: initGenerator.saveCurrentLoadoutPreset,
    onLoadInitLoadoutPreset: initGenerator.loadSelectedPreset,
    onDeleteInitLoadoutPreset: initGenerator.deleteSelectedPreset,
    clientPath: workspace.clientPath,
    setClientPath: workspace.setClientPath,
    clientSettings: workspace.clientSettings,
    setClientSettings: workspace.setClientSettings,
    onPathChange: handlePathChange,
    onBrowseClientPath: workspace.handleBrowseClientPath,
    onBrowsePath: workspace.handleBrowsePath,
    onAutoScanServer: workspace.handleAutoScanServer,
    onSavePathOverrides: workspace.handleSavePathOverrides,
    onResetPaths: workspace.handleResetPaths,
    onRefreshMissions: handleRefreshMissions,
    onOpenMissionsFolder: pageActions.handleOpenMissionsFolder,
  };
}
