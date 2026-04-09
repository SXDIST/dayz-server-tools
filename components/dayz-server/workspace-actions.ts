import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import {
  BATTLEYE_LABEL,
  DAYZ_SERVER_ROOT_LABEL,
  PROFILES_LABEL,
  SERVER_MODS_LABEL,
  MPMISSIONS_LABEL,
  type ServerConfigValues,
} from "@/components/dayz-server/constants";
import { resolveServerModsPath } from "@/components/dayz-server/workspace-helpers";

type BrowseWorkspacePathOptions = {
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  dayzApi: DesktopBridge["dayz"];
  detectAndApplyServerPaths: (serverRoot: string) => Promise<void>;
  pathValues: Record<string, string>;
  label: string;
  scanMissions: (missionsRoot: string) => Promise<void>;
  scanServerMods: (serverRoot: string) => Promise<void>;
  setPathValues: Dispatch<SetStateAction<Record<string, string>>>;
};

export async function browseWorkspacePath({
  appendPreviewLog,
  dayzApi,
  detectAndApplyServerPaths,
  pathValues,
  label,
  scanMissions,
  scanServerMods,
  setPathValues,
}: BrowseWorkspacePathOptions) {
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
}

type SaveWorkspacePathOverridesOptions = {
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  dayzApi: DesktopBridge["dayz"] | undefined;
  detectAndApplyServerPaths: (serverRoot: string) => Promise<void>;
  isDesktop: boolean;
  loadServerConfig: (configPath: string, options?: { preferCurrentValues?: boolean }) => Promise<void>;
  pathValuesRef: MutableRefObject<Record<string, string>>;
  scanServerMods: (serverRoot: string) => Promise<void>;
  scanWorkshopMods: (serverRoot: string) => Promise<void>;
  serverConfigPath: string;
};

export async function saveWorkspacePathOverrides({
  appendPreviewLog,
  dayzApi,
  detectAndApplyServerPaths,
  isDesktop,
  loadServerConfig,
  pathValuesRef,
  scanServerMods,
  scanWorkshopMods,
  serverConfigPath,
}: SaveWorkspacePathOverridesOptions) {
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
}

type ResetWorkspacePathsOptions = {
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  dayzApi: DesktopBridge["dayz"] | undefined;
  detectAndApplyServerPaths: (serverRoot: string) => Promise<void>;
  emptyPathValues: Record<string, string>;
  isDesktop: boolean;
  pathValues: Record<string, string>;
  setClientPath: Dispatch<SetStateAction<string>>;
  setMissions: Dispatch<SetStateAction<DayzMission[]>>;
  setPathValues: Dispatch<SetStateAction<Record<string, string>>>;
  setServerConfigPath: Dispatch<SetStateAction<string>>;
};

export async function resetWorkspacePaths({
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
}: ResetWorkspacePathsOptions) {
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
}

export function buildWorkspaceLaunchOptions({
  pathValues,
  serverConfigPath,
  serverConfigValues,
  serverMods,
}: {
  pathValues: Record<string, string>;
  serverConfigPath: string;
  serverConfigValues: ServerConfigValues;
  serverMods: DayzParsedMod[];
}): DayzServerLaunchOptions {
  return {
    serverRoot: pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "",
    profilesPath: pathValues[PROFILES_LABEL] ?? "",
    battleyePath: pathValues[BATTLEYE_LABEL] ?? "",
    enableBattleye: serverConfigValues.battlEye,
    configPath: serverConfigPath || undefined,
    mods: serverMods.filter((mod) => mod.enabled && mod.launchMode !== "serverMod").map((mod) => mod.path),
    serverModPaths: serverMods.filter((mod) => mod.enabled && mod.launchMode === "serverMod").map((mod) => mod.path),
  };
}
