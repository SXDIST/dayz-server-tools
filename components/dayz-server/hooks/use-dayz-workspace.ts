"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

import {
  defaultClientSettings,
  defaultServerConfigValues,
  type ServerConfigValues,
} from "@/components/dayz-server/constants";
import {
  cloneDayzInitGeneratorState,
} from "@/components/dayz-server/init-generator-defaults";
import {
  createEmptyPathValues,
  createWorkspaceSnapshot,
} from "@/components/dayz-server/workspace-helpers";
import {
  browseWorkspacePath,
  buildWorkspaceLaunchOptions,
  resetWorkspacePaths,
  saveWorkspacePathOverrides,
} from "@/components/dayz-server/workspace-actions";
import { useWorkspacePersistence } from "@/components/dayz-server/hooks/use-workspace-persistence";
import {
  applyDetectedWorkspacePaths,
  autoScanServerPaths,
  detectAndApplyWorkspaceServerPaths,
} from "@/components/dayz-server/workspace-paths";
import { restoreDayzWorkspace } from "@/components/dayz-server/workspace-restore";
import {
  mapConfigSnapshotToForm,
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
  const emptyPathValues = useMemo(() => createEmptyPathValues(), []);

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
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const pathValuesRef = useRef(pathValues);
  const clientPathRef = useRef(clientPath);
  const workspaceSnapshotRef = useRef<DayzWorkspaceState | null>(null);
  const savePromiseRef = useRef<Promise<unknown> | null>(null);
  const restoredServerConfigValuesRef = useRef<ServerConfigValues | null>(null);
  const workspaceSnapshot = useMemo(
    () =>
      createWorkspaceSnapshot({
        pathValues,
        clientPath,
        clientSettings,
        serverMods,
        modPresets,
        selectedModPresetId,
        serverConfigValues,
        initGeneratorState,
        selectedInitLoadoutPresetId,
        initPresetNameInput,
      }),
    [
      clientPath,
      clientSettings,
      initGeneratorState,
      initPresetNameInput,
      modPresets,
      pathValues,
      selectedInitLoadoutPresetId,
      selectedModPresetId,
      serverConfigValues,
      serverMods,
    ],
  );

  useEffect(() => {
    pathValuesRef.current = pathValues;
  }, [pathValues]);

  useEffect(() => {
    clientPathRef.current = clientPath;
  }, [clientPath]);

  useEffect(() => {
    workspaceSnapshotRef.current = workspaceSnapshot;
  }, [workspaceSnapshot]);

  useWorkspacePersistence({
    dayzApi,
    isDesktop,
    workspaceSnapshot,
    workspaceLoaded,
    workspaceSnapshotRef,
    savePromiseRef,
  });

  const loadServerConfig = useCallback(
    async (configPath: string, options?: { preferCurrentValues?: boolean }) => {
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
        setServerConfigValues((current) =>
          options?.preferCurrentValues
            ? { ...mapConfigSnapshotToForm(snapshot.parsed), ...current }
            : { ...current, ...mapConfigSnapshotToForm(snapshot.parsed) },
        );
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
      return applyDetectedWorkspacePaths({
        detected,
        loadServerConfig,
        pathValuesRef,
        scanMissions,
        scanServerMods,
        setPathValues,
        setServerConfigPath,
      });
    },
    [loadServerConfig, scanMissions, scanServerMods],
  );

  const handleAutoScanServer = useCallback(async () => {
    if (!dayzApi) {
      appendPreviewLog("[launcher] Auto scan is available in the desktop build.");
      return;
    }

    try {
      await autoScanServerPaths({
        appendPreviewLog,
        applyDetectedPaths,
        clientPathRef,
        dayzApi,
        pathValuesRef,
        preferredModTokensRef,
        setClientPath,
        setDetectedModsFromScan,
      });
    } catch (error) {
      appendPreviewLog(
        `[launcher] ${error instanceof Error ? error.message : "Auto scan failed."}`,
        "stderr",
      );
    }
  }, [
    appendPreviewLog,
    applyDetectedPaths,
    dayzApi,
    preferredModTokensRef,
    setDetectedModsFromScan,
  ]);

  useEffect(() => {
    if (!isDesktop || !dayzApi) {
      return;
    }

    let mounted = true;

    void restoreDayzWorkspace({
      dayzApi,
      emptyPathValues,
      appendPreviewLog,
      applyDetectedPaths,
      applyImportedLocalModPaths,
      handleAutoScanServer,
      hydrateModPresets,
      isMounted: () => mounted,
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
    })
      .finally(() => {
        if (mounted) {
          setWorkspaceLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [
    appendPreviewLog,
    applyDetectedPaths,
    applyImportedLocalModPaths,
    dayzApi,
    emptyPathValues,
    handleAutoScanServer,
    hydrateModPresets,
    isDesktop,
    loadServerConfig,
    scanServerMods,
    scanWorkshopMods,
  ]);

  const detectAndApplyServerPaths = useCallback(
    async (serverRoot: string) => {
      if (!dayzApi) {
        return;
      }

      await detectAndApplyWorkspaceServerPaths({
        appendPreviewLog,
        applyDetectedPaths,
        clientPathRef,
        dayzApi,
        pathValuesRef,
        scanServerMods,
        scanWorkshopMods,
        serverRoot,
        setClientPath,
        setPathValues,
      });
    },
    [appendPreviewLog, applyDetectedPaths, dayzApi, scanServerMods, scanWorkshopMods],
  );

  const handleBrowsePath = useCallback(
    async (label: string) => {
      if (!dayzApi) {
        appendPreviewLog("[launcher] Folder picker is available in the desktop build only.");
        return;
      }

      await browseWorkspacePath({
        appendPreviewLog,
        dayzApi,
        detectAndApplyServerPaths,
        label,
        pathValues,
        scanMissions,
        scanServerMods,
        setPathValues,
      });
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
    await saveWorkspacePathOverrides({
      appendPreviewLog,
      dayzApi,
      detectAndApplyServerPaths,
      isDesktop,
      loadServerConfig,
      pathValuesRef,
      scanServerMods,
      scanWorkshopMods,
      serverConfigPath,
    });
  }, [
    appendPreviewLog,
    dayzApi,
    detectAndApplyServerPaths,
    isDesktop,
    loadServerConfig,
    scanServerMods,
    scanWorkshopMods,
    serverConfigPath,
  ]);

  const handleResetPaths = useCallback(async () => {
    await resetWorkspacePaths({
      appendPreviewLog,
      dayzApi,
      detectAndApplyServerPaths,
      emptyPathValues,
      isDesktop,
      pathValues,
      setClientPath,
      setMissions,
      setPathValues,
      setServerConfigPath,
    });
  }, [appendPreviewLog, dayzApi, detectAndApplyServerPaths, emptyPathValues, isDesktop, pathValues]);

  const buildLaunchOptions = useCallback((): DayzServerLaunchOptions => {
    return buildWorkspaceLaunchOptions({
      pathValues,
      serverConfigPath,
      serverConfigValues,
      serverMods,
    });
  }, [pathValues, serverConfigPath, serverConfigValues, serverMods]);

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
