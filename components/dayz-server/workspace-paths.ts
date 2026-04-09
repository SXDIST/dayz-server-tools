import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import { DAYZ_SERVER_ROOT_LABEL, MPMISSIONS_LABEL } from "@/components/dayz-server/constants";
import { mergeDetectedPaths, resolveServerModsPath } from "@/components/dayz-server/workspace-helpers";
import { applyEnabledTokensToMods } from "@/components/dayz-server/utils";

type ApplyDetectedPathsOptions = {
  detected: DayzDetectedPaths;
  loadServerConfig: (configPath: string, options?: { preferCurrentValues?: boolean }) => Promise<void>;
  pathValuesRef: MutableRefObject<Record<string, string>>;
  scanMissions: (missionsRoot: string) => Promise<void>;
  scanServerMods: (serverRoot: string) => Promise<void>;
  setPathValues: Dispatch<SetStateAction<Record<string, string>>>;
  setServerConfigPath: Dispatch<SetStateAction<string>>;
};

export async function applyDetectedWorkspacePaths({
  detected,
  loadServerConfig,
  pathValuesRef,
  scanMissions,
  scanServerMods,
  setPathValues,
  setServerConfigPath,
}: ApplyDetectedPathsOptions) {
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
}

type AutoScanServerPathsOptions = {
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  applyDetectedPaths: (detected: DayzDetectedPaths) => Promise<boolean>;
  clientPathRef: MutableRefObject<string>;
  dayzApi: DesktopBridge["dayz"];
  preferredModTokensRef: MutableRefObject<string[]>;
  setClientPath: Dispatch<SetStateAction<string>>;
  setDetectedModsFromScan: (mods: DayzParsedMod[]) => void;
  pathValuesRef: MutableRefObject<Record<string, string>>;
};

export async function autoScanServerPaths({
  appendPreviewLog,
  applyDetectedPaths,
  clientPathRef,
  dayzApi,
  preferredModTokensRef,
  setClientPath,
  setDetectedModsFromScan,
  pathValuesRef,
}: AutoScanServerPathsOptions) {
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
}

type DetectAndApplyServerPathsOptions = {
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  applyDetectedPaths: (detected: DayzDetectedPaths) => Promise<boolean>;
  clientPathRef: MutableRefObject<string>;
  dayzApi: DesktopBridge["dayz"];
  pathValuesRef: MutableRefObject<Record<string, string>>;
  scanServerMods: (serverRoot: string) => Promise<void>;
  scanWorkshopMods: (serverRoot: string) => Promise<void>;
  serverRoot: string;
  setClientPath: Dispatch<SetStateAction<string>>;
  setPathValues: Dispatch<SetStateAction<Record<string, string>>>;
};

export async function detectAndApplyWorkspaceServerPaths({
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
}: DetectAndApplyServerPathsOptions) {
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
}
