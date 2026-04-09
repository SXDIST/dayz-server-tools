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
  type ServerConfigValues,
} from "@/components/dayz-server/constants";
import { mergeDayzInitGeneratorState } from "@/components/dayz-server/init-generator-defaults";
import type { DayzServerClientSettings } from "@/components/dayz-server/workspace-types";
import { sanitizePersistedServerConfigValues } from "@/components/dayz-server/utils";
import type { DayzServerModPreset } from "@/components/dayz-server/workspace-types";

export const WORKSPACE_CACHE_KEY = "dayz-tools:workspace-cache";

export function createEmptyPathValues() {
  return Object.fromEntries(serverPaths.map(([label]) => [label, ""])) as Record<string, string>;
}

export function createRestoredPathValues(
  statePaths: DayzWorkspaceState["paths"] | undefined,
  emptyPathValues: Record<string, string>,
) {
  return {
    ...emptyPathValues,
    ...(statePaths ?? {}),
  } as Record<string, string>;
}

export function createWorkspaceSnapshot({
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
}: {
  pathValues: Record<string, string>;
  clientPath: string;
  clientSettings: {
    displayMode: "windowed" | "fullscreen";
    resolution: string;
  };
  serverMods: DayzParsedMod[];
  modPresets: DayzServerModPreset[];
  selectedModPresetId: string;
  serverConfigValues: ServerConfigValues;
  initGeneratorState: DayzInitGeneratorState;
  selectedInitLoadoutPresetId: string;
  initPresetNameInput: string;
}): DayzWorkspaceState {
  return {
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
  };
}

export function normalizePersistedServerConfigValues(values: Record<string, unknown> | undefined | null) {
  if (!values || Object.keys(values).length === 0) {
    return null;
  }

  return {
    ...defaultServerConfigValues,
    ...(sanitizePersistedServerConfigValues(values) as typeof defaultServerConfigValues),
  };
}

export function normalizeClientSettings(
  settings: DayzWorkspaceState["clientSettings"] | undefined,
): DayzServerClientSettings {
  return {
    displayMode: settings?.displayMode === "fullscreen" ? "fullscreen" : "windowed",
    resolution:
      typeof settings?.resolution === "string" && settings.resolution
        ? settings.resolution
        : defaultClientSettings.resolution,
  };
}

export function resolveInitPresetRestore(state: Pick<DayzWorkspaceState, "selectedInitLoadoutPresetId" | "initPresetNameInput">, mergedState: DayzInitGeneratorState) {
  const restoredPresetId =
    typeof state.selectedInitLoadoutPresetId === "string" ? state.selectedInitLoadoutPresetId : "";
  const fallbackPresetId = mergedState.loadoutPresets[0]?.id ?? "";
  const selectedInitLoadoutPresetId =
    restoredPresetId && mergedState.loadoutPresets.some((preset) => preset.id === restoredPresetId)
      ? restoredPresetId
      : fallbackPresetId;
  const matchedPreset = mergedState.loadoutPresets.find(
    (preset) => preset.id === selectedInitLoadoutPresetId,
  );
  const initPresetNameInput =
    typeof state.initPresetNameInput === "string" && state.initPresetNameInput.trim()
      ? state.initPresetNameInput
      : matchedPreset?.name ?? "";

  return {
    selectedInitLoadoutPresetId,
    initPresetNameInput,
  };
}

export function prepareWorkspaceRestoreState(
  state: DayzWorkspaceState,
  emptyPathValues: Record<string, string>,
) {
  const restoredPaths = createRestoredPathValues(state.paths, emptyPathValues);
  const clientSettings = state.clientSettings ? normalizeClientSettings(state.clientSettings) : null;
  const persistedServerConfigValues = normalizePersistedServerConfigValues(state.serverConfigValues);
  const mergedInitGeneratorState = state.initGeneratorState
    ? mergeDayzInitGeneratorState(state.initGeneratorState)
    : null;
  const initPresetRestore = mergedInitGeneratorState
    ? resolveInitPresetRestore(state, mergedInitGeneratorState)
    : null;

  return {
    restoredPaths,
    clientPath: typeof state.clientPath === "string" ? state.clientPath : "",
    clientSettings,
    persistedServerConfigValues,
    enabledModPaths: state.enabledModPaths ?? [],
    modPresets: state.modPresets ?? [],
    selectedModPresetId: state.selectedModPresetId,
    importedLocalModPaths: Array.isArray(state.importedLocalModPaths) ? state.importedLocalModPaths : [],
    mergedInitGeneratorState,
    initPresetRestore,
  };
}

export function readCachedWorkspaceState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(WORKSPACE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as DayzWorkspaceState;
  } catch {
    return null;
  }
}

export function resolveServerModsPath(currentPaths: Record<string, string>, fallbackRoot = "") {
  return currentPaths[SERVER_MODS_LABEL] || currentPaths[DAYZ_SERVER_ROOT_LABEL] || fallbackRoot;
}

export function mergeDetectedPaths(
  currentPaths: Record<string, string>,
  detected: DayzDetectedPaths,
) {
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
}
