"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

import {
  BATTLEYE_LABEL,
  DAYZ_SERVER_ROOT_LABEL,
  KEYS_LABEL,
  MPMISSIONS_LABEL,
  PROFILES_LABEL,
  SERVER_MODS_LABEL,
  defaultClientSettings,
  defaultServerConfigValues,
  serverPaths,
} from "@/components/dayz-server/constants";
import {
  cloneDayzInitGeneratorState,
  mergeDayzInitGeneratorState,
} from "@/components/dayz-server/init-generator-defaults";
import {
  applyEnabledTokensToMods,
  mapConfigSnapshotToForm,
  sanitizePersistedServerConfigValues,
} from "@/components/dayz-server/utils";
import type { DayzServerModPreset } from "@/components/dayz-server/workspace-types";

type UseDayzWorkspaceOptions = {
  dayzApi: DesktopBridge["dayz"] | undefined;
  isDesktop: boolean;
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  scanServerMods: (serverRoot: string) => Promise<void>;
  scanWorkshopMods: (serverRoot: string) => Promise<void>;
  setDetectedModsFromScan: (mods: DayzParsedMod[]) => void;
  applyImportedLocalModPaths: (mods: DayzParsedMod[], enabledPaths: string[]) => void;
  hydrateModPresets: (presets: DayzServerModPreset[], selectedId?: string) => void;
  preferredModTokensRef: MutableRefObject<string[]>;
  serverMods: DayzParsedMod[];
  modPresets: DayzServerModPreset[];
  selectedModPresetId: string;
};

export function useDayzWorkspace({
  dayzApi,
  isDesktop,
  appendPreviewLog,
  scanServerMods,
  scanWorkshopMods,
  setDetectedModsFromScan,
  applyImportedLocalModPaths,
  hydrateModPresets,
  preferredModTokensRef,
  serverMods,
  modPresets,
  selectedModPresetId,
}: UseDayzWorkspaceOptions) {
  const emptyPathValues = useMemo(
    () => Object.fromEntries(serverPaths.map(([label]) => [label, ""])) as Record<string, string>,
    [],
  );

  const [pathValues, setPathValues] = useState<Record<string, string>>(emptyPathValues);
  const [serverConfigPath, setServerConfigPath] = useState("");
  const [serverConfigValues, setServerConfigValues] = useState(defaultServerConfigValues);
  const [initGeneratorState, setInitGeneratorState] = useState<DayzInitGeneratorState>(
    cloneDayzInitGeneratorState,
  );
  const [selectedInitLoadoutPresetId, setSelectedInitLoadoutPresetId] = useState("");
  const [initPresetNameInput, setInitPresetNameInput] = useState("");
  const [missions, setMissions] = useState<DayzMission[]>([]);
  const [configModTokens, setConfigModTokens] = useState<string[]>([]);
  const [persistedEnabledModPaths, setPersistedEnabledModPaths] = useState<string[]>([]);
  const [clientPath, setClientPath] = useState("");
  const [clientSettings, setClientSettings] = useState<{
    displayMode: "windowed" | "fullscreen";
    resolution: string;
  }>(defaultClientSettings);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(!isDesktop || !dayzApi);
  const didBootstrapDayzRef = useRef(false);
  const pathValuesRef = useRef(pathValues);
  const clientPathRef = useRef(clientPath);

  useEffect(() => {
    pathValuesRef.current = pathValues;
  }, [pathValues]);

  useEffect(() => {
    clientPathRef.current = clientPath;
  }, [clientPath]);

  const resolveServerModsPath = useCallback(
    (currentPaths: Record<string, string>, fallbackRoot = "") =>
      currentPaths[SERVER_MODS_LABEL] || currentPaths[DAYZ_SERVER_ROOT_LABEL] || fallbackRoot,
    [],
  );

  const mergeDetectedPaths = useCallback(
    (currentPaths: Record<string, string>, detected: DayzDetectedPaths) => {
      const rootChanged = (currentPaths[DAYZ_SERVER_ROOT_LABEL] ?? "") !== detected.serverRoot;

      return {
        ...currentPaths,
        [DAYZ_SERVER_ROOT_LABEL]: detected.serverRoot,
        [SERVER_MODS_LABEL]:
          !rootChanged && currentPaths[SERVER_MODS_LABEL] ? currentPaths[SERVER_MODS_LABEL] : detected.serverMods,
        [PROFILES_LABEL]:
          !rootChanged && currentPaths[PROFILES_LABEL] ? currentPaths[PROFILES_LABEL] : detected.profiles,
        [KEYS_LABEL]: !rootChanged && currentPaths[KEYS_LABEL] ? currentPaths[KEYS_LABEL] : detected.keys,
        [BATTLEYE_LABEL]:
          !rootChanged && currentPaths[BATTLEYE_LABEL] ? currentPaths[BATTLEYE_LABEL] : detected.battleye,
        [MPMISSIONS_LABEL]:
          !rootChanged && currentPaths[MPMISSIONS_LABEL] ? currentPaths[MPMISSIONS_LABEL] : detected.mpmissions,
      };
    },
    [],
  );

  const loadServerConfig = useCallback(
    async (configPath: string) => {
      if (!configPath) {
        return;
      }

      if (!dayzApi) {
        appendPreviewLog("[launcher] Live config loading works in the desktop build.");
        return;
      }

      try {
        const snapshot = await dayzApi.readServerConfig(configPath);
        setServerConfigPath(snapshot.path);
        setConfigModTokens(snapshot.modTokens);
        setServerConfigValues((current) => ({ ...current, ...mapConfigSnapshotToForm(snapshot.parsed) }));
        appendPreviewLog(
          snapshot.path ? `[cfg] Loaded ${snapshot.path}` : "[cfg] No server config file detected yet.",
        );
      } catch (error) {
        appendPreviewLog(
          `[cfg] ${error instanceof Error ? error.message : "Failed to read server config."}`,
          "stderr",
        );
      }
    },
    [appendPreviewLog, dayzApi],
  );

  const scanMissions = useCallback(
    async (missionsRoot: string) => {
      if (!missionsRoot) {
        setMissions([]);
        return;
      }

      if (!dayzApi) {
        appendPreviewLog("[missions] Live mission scanning works in the desktop build.");
        return;
      }

      try {
        const nextMissions = await dayzApi.scanMissions(missionsRoot);
        setMissions(nextMissions);
        appendPreviewLog(
          `[missions] Found ${nextMissions.length} mission folder${nextMissions.length === 1 ? "" : "s"} in mpmissions.`,
        );
      } catch (error) {
        appendPreviewLog(
          `[missions] ${error instanceof Error ? error.message : "Failed to scan missions."}`,
          "stderr",
        );
      }
    },
    [appendPreviewLog, dayzApi],
  );

  const applyDetectedPaths = useCallback(
    async (detected: DayzDetectedPaths) => {
      if (!detected.serverRoot) {
        return false;
      }

      const nextValues = mergeDetectedPaths(pathValuesRef.current, detected);
      pathValuesRef.current = nextValues;
      setPathValues(nextValues);
      setServerConfigPath(detected.configPath);

      if (detected.configPath) {
        await loadServerConfig(detected.configPath);
      }

      await scanMissions(nextValues[MPMISSIONS_LABEL]);
      await scanServerMods(resolveServerModsPath(nextValues, detected.serverMods || detected.serverRoot));

      return true;
    },
    [loadServerConfig, mergeDetectedPaths, resolveServerModsPath, scanMissions, scanServerMods],
  );

  const handleAutoScanServer = useCallback(async () => {
    if (!dayzApi) {
      appendPreviewLog("[launcher] Auto scan is available in the desktop build.");
      return;
    }

    try {
      appendPreviewLog("[launcher] Scanning common Steam locations for DayZ Server...");
      const detected = await dayzApi.autoDetectServerPaths();
      const found = await applyDetectedPaths(detected);

      if (!found) {
        appendPreviewLog("[launcher] DayZ Server was not found in the standard Steam locations.", "stderr");
        return;
      }

      const serverModsRoot = resolveServerModsPath(pathValuesRef.current, detected.serverMods || detected.serverRoot);
      const [scannedMods, workshopMods] = await Promise.all([
        dayzApi.scanMods(serverModsRoot),
        dayzApi.scanWorkshopMods(detected.serverRoot),
      ]);

      setDetectedModsFromScan(
        applyEnabledTokensToMods([...scannedMods, ...workshopMods], preferredModTokensRef.current),
      );

      if (!clientPathRef.current) {
        const detectedClientPath = await dayzApi.detectClientExecutable().catch(() => null);
        if (detectedClientPath) {
          setClientPath(detectedClientPath);
        }
      }

      appendPreviewLog(`[launcher] DayZ Server found at ${detected.serverRoot}`);
    } catch (error) {
      appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Auto scan failed."}`,
        "stderr",
      );
    }
  }, [
    appendPreviewLog,
    applyDetectedPaths,
    clientPath,
    dayzApi,
    preferredModTokensRef,
    resolveServerModsPath,
    setDetectedModsFromScan,
  ]);

  useEffect(() => {
    if (!isDesktop || !dayzApi) {
      return;
    }

    let mounted = true;

    void dayzApi
      .getWorkspaceState()
      .then(async (state) => {
        if (!mounted) {
          return;
        }

        if (state.paths && Object.keys(state.paths).length > 0) {
          setPathValues((current) => ({ ...current, ...state.paths }));
        }

        if (state.clientPath) {
          setClientPath(state.clientPath);
        } else {
          const detectedClientPath = await dayzApi.detectClientExecutable().catch(() => null);
          if (mounted && detectedClientPath) {
            setClientPath(detectedClientPath);
          }
        }

        if (state.clientSettings) {
          setClientSettings({
            displayMode: state.clientSettings.displayMode === "fullscreen" ? "fullscreen" : "windowed",
            resolution:
              typeof state.clientSettings.resolution === "string" && state.clientSettings.resolution
                ? state.clientSettings.resolution
                : defaultClientSettings.resolution,
          });
        }

        if (state.serverConfigValues && Object.keys(state.serverConfigValues).length > 0) {
          const sanitizedValues = sanitizePersistedServerConfigValues(state.serverConfigValues);
          setServerConfigValues((current) => ({
            ...current,
            ...(sanitizedValues as typeof defaultServerConfigValues),
          }));
        }

        if (state.initGeneratorState) {
          const mergedState = mergeDayzInitGeneratorState(state.initGeneratorState);
          setInitGeneratorState(mergedState);
          const restoredPresetId =
            typeof state.selectedInitLoadoutPresetId === "string" ? state.selectedInitLoadoutPresetId : "";
          const fallbackPresetId = mergedState.loadoutPresets[0]?.id ?? "";
          const resolvedPresetId =
            restoredPresetId && mergedState.loadoutPresets.some((preset) => preset.id === restoredPresetId)
              ? restoredPresetId
              : fallbackPresetId;

          setSelectedInitLoadoutPresetId(resolvedPresetId);

          if (typeof state.initPresetNameInput === "string" && state.initPresetNameInput.trim()) {
            setInitPresetNameInput(state.initPresetNameInput);
          } else {
            const matchedPreset = mergedState.loadoutPresets.find((preset) => preset.id === resolvedPresetId);
            setInitPresetNameInput(matchedPreset?.name ?? "");
          }
        }

        setPersistedEnabledModPaths(state.enabledModPaths ?? []);
        hydrateModPresets(state.modPresets ?? [], state.selectedModPresetId);

        if (Array.isArray(state.importedLocalModPaths) && state.importedLocalModPaths.length > 0) {
          const importedResults = await Promise.allSettled(
            state.importedLocalModPaths.map((modPath) => dayzApi.inspectModFolder(modPath)),
          );

          if (!mounted) {
            return;
          }

          const importedMods = importedResults.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : [],
          );

          applyImportedLocalModPaths(importedMods, state.enabledModPaths ?? []);
        }
      })
      .finally(() => {
        if (mounted) {
          setWorkspaceLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [applyImportedLocalModPaths, dayzApi, hydrateModPresets, isDesktop]);

  useEffect(() => {
    if (!isDesktop || !dayzApi || !workspaceLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      void dayzApi.saveWorkspaceState({
        paths: pathValues,
        clientPath,
        clientSettings,
        enabledModPaths: serverMods.filter((mod) => mod.enabled).map((mod) => mod.path),
        modPresets,
        selectedModPresetId,
        importedLocalModPaths: serverMods
          .filter((mod) => mod.source === "Local Import")
          .map((mod) => mod.path),
        serverConfigValues,
        initGeneratorState,
        selectedInitLoadoutPresetId,
        initPresetNameInput,
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    clientPath,
    clientSettings,
    dayzApi,
    modPresets,
    initGeneratorState,
    isDesktop,
    pathValues,
    initPresetNameInput,
    selectedModPresetId,
    selectedInitLoadoutPresetId,
    serverConfigValues,
    serverMods,
    workspaceLoaded,
  ]);

  useEffect(() => {
    if (!isDesktop || !dayzApi || !workspaceLoaded || didBootstrapDayzRef.current) {
      return;
    }

    didBootstrapDayzRef.current = true;

    if (pathValues[DAYZ_SERVER_ROOT_LABEL]) {
      void dayzApi
        .detectServerPaths(pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "")
        .then(async (detected) => {
          const found = await applyDetectedPaths(detected);
          if (found) {
            await Promise.all([
              scanServerMods(resolveServerModsPath(pathValuesRef.current, detected.serverMods || detected.serverRoot)),
              scanWorkshopMods(detected.serverRoot),
            ]);
          }
        })
        .catch(() => undefined);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleAutoScanServer();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    applyDetectedPaths,
    dayzApi,
    handleAutoScanServer,
    isDesktop,
    resolveServerModsPath,
    scanServerMods,
    scanWorkshopMods,
    workspaceLoaded,
  ]);

  const detectAndApplyServerPaths = useCallback(
    async (serverRoot: string) => {
      if (!dayzApi) {
        return;
      }

      try {
        const detected = await dayzApi.detectServerPaths(serverRoot);
        const found = await applyDetectedPaths(detected);

        if (!found) {
          setPathValues((current) => ({
            ...current,
            [DAYZ_SERVER_ROOT_LABEL]: serverRoot || current[DAYZ_SERVER_ROOT_LABEL],
          }));
          return;
        }

        await Promise.all([
          scanServerMods(resolveServerModsPath(pathValuesRef.current, detected.serverMods || detected.serverRoot)),
          scanWorkshopMods(detected.serverRoot),
        ]);

        if (!clientPathRef.current) {
          const detectedClientPath = await dayzApi.detectClientExecutable().catch(() => null);
          if (detectedClientPath) {
            setClientPath(detectedClientPath);
          }
        }
      } catch (error) {
        appendPreviewLog(
          `[launcher] ${error instanceof Error ? error.message : "Failed to detect DayZ Server paths."}`,
          "stderr",
        );
      }
    },
    [appendPreviewLog, applyDetectedPaths, dayzApi, resolveServerModsPath, scanServerMods, scanWorkshopMods],
  );

  const handleBrowsePath = useCallback(
    async (label: string) => {
      if (!dayzApi) {
        appendPreviewLog("[launcher] Folder picker is available in the desktop build only.");
        return;
      }

      try {
        const pickedPath = await dayzApi.pickFolder({ defaultPath: pathValues[label] ?? "" });

        if (!pickedPath) {
          return;
        }

        if (label === DAYZ_SERVER_ROOT_LABEL) {
          await detectAndApplyServerPaths(pickedPath);
          return;
        }

        setPathValues((current) => ({ ...current, [label]: pickedPath }));

        if (label === SERVER_MODS_LABEL) {
          await scanServerMods(pickedPath);
        }

        if (label === MPMISSIONS_LABEL) {
          await scanMissions(pickedPath);
        }
      } catch (error) {
        appendPreviewLog(
          `[launcher] ${error instanceof Error ? error.message : "Folder picker is unavailable."}`,
          "stderr",
        );
      }
    },
    [appendPreviewLog, dayzApi, detectAndApplyServerPaths, pathValues, scanMissions, scanServerMods],
  );

  const handleBrowseClientPath = useCallback(async () => {
    if (!dayzApi) {
      appendPreviewLog("[launcher] Executable picker is available in the desktop build only.");
      return;
    }

    try {
      const pickedPath = await dayzApi.pickExecutable({ defaultPath: clientPath });
      if (pickedPath) {
        setClientPath(pickedPath);
      }
    } catch (error) {
      appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Executable picker is unavailable."}`,
        "stderr",
      );
    }
  }, [appendPreviewLog, clientPath, dayzApi]);

  const handleSavePathOverrides = useCallback(async () => {
    if (dayzApi) {
      const currentPaths = pathValuesRef.current;

      if (currentPaths[DAYZ_SERVER_ROOT_LABEL]) {
        await detectAndApplyServerPaths(currentPaths[DAYZ_SERVER_ROOT_LABEL]);
        await scanServerMods(resolveServerModsPath(pathValuesRef.current, currentPaths[DAYZ_SERVER_ROOT_LABEL]));
        await scanWorkshopMods(pathValuesRef.current[DAYZ_SERVER_ROOT_LABEL]);
      } else if (currentPaths[SERVER_MODS_LABEL]) {
        await scanServerMods(currentPaths[SERVER_MODS_LABEL]);
      } else if (serverConfigPath) {
        await loadServerConfig(serverConfigPath);
      }
    }

    appendPreviewLog(
      isDesktop
        ? "[launcher] Path overrides updated for the current workspace."
        : "[launcher] Path overrides updated locally.",
    );
  }, [
    appendPreviewLog,
    dayzApi,
    detectAndApplyServerPaths,
    isDesktop,
    loadServerConfig,
    resolveServerModsPath,
    scanServerMods,
    scanWorkshopMods,
    serverConfigPath,
  ]);

  const handleResetPaths = useCallback(async () => {
    const root = pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "";

    if (isDesktop && root) {
      await detectAndApplyServerPaths(root);
      const detectedClientPath = await dayzApi?.detectClientExecutable().catch(() => null);
      if (detectedClientPath) {
        setClientPath(detectedClientPath);
      }
      appendPreviewLog("[launcher] Restored auto-detected DayZ Server paths.");
      return;
    }

    setPathValues(emptyPathValues);
    setServerConfigPath("");
    setClientPath("");
    setMissions([]);
  }, [appendPreviewLog, dayzApi, detectAndApplyServerPaths, emptyPathValues, isDesktop, pathValues]);

  const buildLaunchOptions = useCallback((): DayzServerLaunchOptions => {
    return {
      serverRoot: pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "",
      profilesPath: pathValues[PROFILES_LABEL] ?? "",
      battleyePath: pathValues[BATTLEYE_LABEL] ?? "",
      enableBattleye: serverConfigValues.battlEye,
      configPath: serverConfigPath || undefined,
      mods: serverMods.filter((mod) => mod.enabled && mod.launchMode !== "serverMod").map((mod) => mod.path),
      serverModPaths: serverMods.filter((mod) => mod.enabled && mod.launchMode === "serverMod").map((mod) => mod.path),
    };
  }, [pathValues, serverConfigPath, serverConfigValues.battlEye, serverMods]);

  return {
    pathValues,
    setPathValues,
    missions,
    serverConfigPath,
    serverConfigValues,
    setServerConfigValues,
    initGeneratorState,
    setInitGeneratorState,
    selectedInitLoadoutPresetId,
    setSelectedInitLoadoutPresetId,
    initPresetNameInput,
    setInitPresetNameInput,
    configModTokens,
    persistedEnabledModPaths,
    clientPath,
    setClientPath,
    clientSettings,
    setClientSettings,
    workspaceLoaded,
    loadServerConfig,
    handleAutoScanServer,
    detectAndApplyServerPaths,
    handleBrowsePath,
    handleBrowseClientPath,
    handleSavePathOverrides,
    handleResetPaths,
    buildLaunchOptions,
    scanMissions,
    setDetectedPaths: applyDetectedPaths,
  };
}
