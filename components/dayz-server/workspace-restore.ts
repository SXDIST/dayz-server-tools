import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import { DAYZ_SERVER_ROOT_LABEL, type ServerConfigValues } from "@/components/dayz-server/constants";
import {
  prepareWorkspaceRestoreState,
  readCachedWorkspaceState,
  resolveServerModsPath,
} from "@/components/dayz-server/workspace-helpers";
import type { DayzServerClientSettings, DayzServerModPreset } from "@/components/dayz-server/workspace-types";

type RestoreWorkspaceOptions = {
  dayzApi: DesktopBridge["dayz"];
  emptyPathValues: Record<string, string>;
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  applyDetectedPaths: (detected: DayzDetectedPaths) => Promise<boolean>;
  applyImportedLocalModPaths: (mods: DayzParsedMod[], enabledPaths: string[]) => void;
  handleAutoScanServer: () => Promise<void>;
  hydrateModPresets: (presets: DayzServerModPreset[], selectedId?: string) => void;
  isMounted: () => boolean;
  loadServerConfig: (configPath: string, options?: { preferCurrentValues?: boolean }) => Promise<void>;
  pathValuesRef: MutableRefObject<Record<string, string>>;
  clientPathRef: MutableRefObject<string>;
  restoredServerConfigValuesRef: MutableRefObject<ServerConfigValues | null>;
  scanServerMods: (serverRoot: string) => Promise<void>;
  scanWorkshopMods: (serverRoot: string) => Promise<void>;
  setClientPath: Dispatch<SetStateAction<string>>;
  setClientSettings: Dispatch<SetStateAction<DayzServerClientSettings>>;
  setInitGeneratorState: Dispatch<SetStateAction<DayzInitGeneratorState>>;
  setInitPresetNameInput: Dispatch<SetStateAction<string>>;
  setPathValues: Dispatch<SetStateAction<Record<string, string>>>;
  setPersistedEnabledModPaths: Dispatch<SetStateAction<string[]>>;
  setSelectedInitLoadoutPresetId: Dispatch<SetStateAction<string>>;
  setServerConfigValues: Dispatch<SetStateAction<ServerConfigValues>>;
};

export async function restoreDayzWorkspace({
  dayzApi,
  emptyPathValues,
  appendPreviewLog,
  applyDetectedPaths,
  applyImportedLocalModPaths,
  handleAutoScanServer,
  hydrateModPresets,
  isMounted,
  loadServerConfig,
  pathValuesRef,
  clientPathRef,
  restoredServerConfigValuesRef,
  scanServerMods,
  scanWorkshopMods,
  setClientPath,
  setClientSettings,
  setInitGeneratorState,
  setInitPresetNameInput,
  setPathValues,
  setPersistedEnabledModPaths,
  setSelectedInitLoadoutPresetId,
  setServerConfigValues,
}: RestoreWorkspaceOptions) {
  const persistedState = await dayzApi.getWorkspaceState();
  const cachedState = readCachedWorkspaceState();
  const state = cachedState
    ? {
        ...persistedState,
        ...cachedState,
      }
    : persistedState;

  if (!isMounted()) {
    return;
  }

  const restoredState = prepareWorkspaceRestoreState(state, emptyPathValues);
  const {
    clientPath: restoredClientPath,
    clientSettings: restoredClientSettings,
    enabledModPaths,
    importedLocalModPaths,
    initPresetRestore,
    mergedInitGeneratorState,
    modPresets: restoredModPresets,
    persistedServerConfigValues,
    restoredPaths,
    selectedModPresetId: restoredSelectedModPresetId,
  } = restoredState;

  pathValuesRef.current = restoredPaths;
  setPathValues(restoredPaths);

  if (restoredClientPath) {
    clientPathRef.current = restoredClientPath;
    setClientPath(restoredClientPath);
  } else {
    const detectedClientPath = await dayzApi.detectClientExecutable().catch(() => null);
    if (isMounted() && detectedClientPath) {
      clientPathRef.current = detectedClientPath;
      setClientPath(detectedClientPath);
    }
  }

  if (restoredClientSettings) {
    setClientSettings(restoredClientSettings);
  }

  const hasPersistedServerConfigValues = !!persistedServerConfigValues;

  if (persistedServerConfigValues) {
    restoredServerConfigValuesRef.current = persistedServerConfigValues;
    setServerConfigValues((current) => ({
      ...current,
      ...persistedServerConfigValues,
    }));
  } else {
    restoredServerConfigValuesRef.current = null;
  }

  if (mergedInitGeneratorState && initPresetRestore) {
    setInitGeneratorState(mergedInitGeneratorState);
    setSelectedInitLoadoutPresetId(initPresetRestore.selectedInitLoadoutPresetId);
    setInitPresetNameInput(initPresetRestore.initPresetNameInput);
  }

  setPersistedEnabledModPaths(enabledModPaths);
  hydrateModPresets(restoredModPresets, restoredSelectedModPresetId);

  if (importedLocalModPaths.length > 0) {
    const uniqueImportedLocalModPaths = [...new Set(importedLocalModPaths.map((modPath) => modPath.trim()).filter(Boolean))];
    const importedResults = await Promise.allSettled(
      uniqueImportedLocalModPaths.map((modPath) => dayzApi.inspectModFolder(modPath)),
    );

    if (!isMounted()) {
      return;
    }

    const importedMods = importedResults.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    applyImportedLocalModPaths(importedMods, enabledModPaths);
  }

  const restoredServerRoot = restoredPaths[DAYZ_SERVER_ROOT_LABEL] ?? "";
  const restoredServerModsRoot = resolveServerModsPath(restoredPaths, restoredServerRoot);

  if (restoredServerRoot) {
    try {
      const detected = await dayzApi.detectServerPaths(restoredServerRoot);

      if (!isMounted()) {
        return;
      }

      const found = await applyDetectedPaths(detected);

      if (found) {
        if (hasPersistedServerConfigValues && detected.configPath) {
          await loadServerConfig(detected.configPath, { preferCurrentValues: true });
        }

        await Promise.all([
          scanServerMods(resolveServerModsPath(pathValuesRef.current, detected.serverMods || detected.serverRoot)),
          scanWorkshopMods(detected.serverRoot),
        ]);

        if (restoredServerConfigValuesRef.current) {
          setServerConfigValues(restoredServerConfigValuesRef.current);
        }

        return;
      }
    } catch (error) {
      appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Failed to restore DayZ Server paths."}`,
        "stderr",
      );
    }
  }

  if (restoredServerModsRoot) {
    await scanServerMods(restoredServerModsRoot);

    if (restoredServerConfigValuesRef.current) {
      setServerConfigValues(restoredServerConfigValuesRef.current);
    }

    return;
  }

  await handleAutoScanServer();

  if (restoredServerConfigValuesRef.current) {
    setServerConfigValues(restoredServerConfigValuesRef.current);
  }
}
