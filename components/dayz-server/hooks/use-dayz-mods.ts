"use client";

import { startTransition, useCallback, useDeferredValue, useMemo, useState, type MutableRefObject } from "react";

import { DAYZ_SERVER_ROOT_LABEL, fallbackMods } from "@/components/dayz-server/constants";
import { applyEnabledTokensToMods, matchesModSearch } from "@/components/dayz-server/utils";

function createFallbackMods(): DayzParsedMod[] {
  return fallbackMods.map((mod, index) => ({
    id: `fallback-mod-${index}`,
    name: mod.name,
    displayName: mod.name,
    source: mod.source,
    state: mod.state,
    enabled: mod.enabled,
    path: mod.name,
    hasAddonsDir: true,
    hasKeysDir: false,
    version: "",
    author: "",
    createdAt: "",
    updatedAt: "",
    sizeBytes: 0,
    pboCount: 0,
    signedPboCount: 0,
    isFullySigned: false,
  }));
}

type UseDayzModsOptions = {
  dayzApi: DesktopBridge["dayz"] | undefined;
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  preferredModTokensRef: MutableRefObject<string[]>;
};

export function useDayzMods({ dayzApi, appendPreviewLog, preferredModTokensRef }: UseDayzModsOptions) {
  const [serverMods, setServerMods] = useState<DayzParsedMod[]>(createFallbackMods);
  const [modsSearch, setModsSearch] = useState("");

  const toggleModEnabled = useCallback((modId: string) => {
    startTransition(() => {
      setServerMods((current) =>
        current.map((item) => (item.id === modId ? { ...item, enabled: !item.enabled } : item)),
      );
    });
  }, []);

  const scanServerMods = useCallback(
    async (serverRoot: string) => {
      if (!serverRoot) {
        setServerMods([]);
        return;
      }

      if (!dayzApi) {
        appendPreviewLog("[mods] Live mod scanning works in the Electron desktop build.");
        return;
      }

      try {
        const scannedMods = await dayzApi.scanMods(serverRoot);

        setServerMods((current) => {
          const localImports = current.filter((mod) => mod.source === "Local Import");
          const workshopMods = current.filter((mod) => mod.source === "Workshop");

          return applyEnabledTokensToMods(
            [...scannedMods, ...workshopMods, ...localImports],
            preferredModTokensRef.current,
          );
        });

        appendPreviewLog(
          `[mods] Found ${scannedMods.length} mod folder${scannedMods.length === 1 ? "" : "s"} in server root.`,
        );
      } catch (error) {
        appendPreviewLog(
          `[mods] ${error instanceof Error ? error.message : "Failed to scan server mods."}`,
          "stderr",
        );
      }
    },
    [appendPreviewLog, dayzApi, preferredModTokensRef],
  );

  const scanWorkshopMods = useCallback(
    async (serverRoot: string) => {
      if (!serverRoot) {
        return;
      }

      if (!dayzApi) {
        appendPreviewLog("[mods] Workshop scanning works in the Electron desktop build.");
        return;
      }

      try {
        const workshopMods = await dayzApi.scanWorkshopMods(serverRoot);

        setServerMods((current) => {
          const serverRootMods = current.filter(
            (mod) => mod.source !== "Workshop" && mod.source !== "Local Import",
          );
          const localImports = current.filter((mod) => mod.source === "Local Import");

          return applyEnabledTokensToMods(
            [...serverRootMods, ...workshopMods, ...localImports],
            preferredModTokensRef.current,
          );
        });

        appendPreviewLog(
          `[mods] Found ${workshopMods.length} Workshop mod folder${workshopMods.length === 1 ? "" : "s"}.`,
        );
      } catch (error) {
        appendPreviewLog(
          `[mods] ${error instanceof Error ? error.message : "Failed to scan Workshop mods."}`,
          "stderr",
        );
      }
    },
    [appendPreviewLog, dayzApi, preferredModTokensRef],
  );

  const importLocalMod = useCallback(async () => {
    if (!dayzApi) {
      appendPreviewLog("[mods] Local mod import works in the Electron desktop build.");
      return;
    }

    try {
      const pickedPath = await dayzApi.pickFolder({});

      if (!pickedPath) {
        return;
      }

      const importedMod = await dayzApi.inspectModFolder(pickedPath);

      setServerMods((current) => {
        const withoutDuplicate = current.filter(
          (mod) => mod.path.toLowerCase() !== importedMod.path.toLowerCase(),
        );

        return applyEnabledTokensToMods([...withoutDuplicate, importedMod], preferredModTokensRef.current);
      });

      appendPreviewLog(`[mods] Imported local mod ${importedMod.name}.`);
    } catch (error) {
      appendPreviewLog(
        `[mods] ${error instanceof Error ? error.message : "Failed to import local mod."}`,
        "stderr",
      );
    }
  }, [appendPreviewLog, dayzApi, preferredModTokensRef]);

  const applyImportedLocalModPaths = useCallback(
    (mods: DayzParsedMod[], enabledPaths: string[]) => {
      if (mods.length === 0) {
        return;
      }

      setServerMods((current) => {
        const withoutImported = current.filter((mod) => mod.source !== "Local Import");
        return applyEnabledTokensToMods([...withoutImported, ...mods], enabledPaths);
      });
    },
    [],
  );

  const setDetectedMods = useCallback((mods: DayzParsedMod[]) => {
    setServerMods(mods);
  }, []);

  const deferredServerMods = useDeferredValue(serverMods);
  const deferredModsSearch = useDeferredValue(modsSearch);

  const visibleMods = useMemo(
    () => deferredServerMods.filter((mod) => matchesModSearch(mod, deferredModsSearch)),
    [deferredModsSearch, deferredServerMods],
  );

  const enabledMods = useMemo(() => visibleMods.filter((mod) => mod.enabled), [visibleMods]);
  const availableWorkshopMods = useMemo(
    () => visibleMods.filter((mod) => !mod.enabled && mod.source === "Workshop"),
    [visibleMods],
  );
  const availableLocalMods = useMemo(
    () => visibleMods.filter((mod) => !mod.enabled && mod.source !== "Workshop"),
    [visibleMods],
  );

  return {
    serverMods,
    setServerMods,
    setDetectedMods,
    modsSearch,
    setModsSearch,
    toggleModEnabled,
    scanServerMods,
    scanWorkshopMods,
    importLocalMod,
    applyImportedLocalModPaths,
    enabledMods,
    availableWorkshopMods,
    availableLocalMods,
    getRefreshTargetRoot: (pathValues: Record<string, string>) => pathValues[DAYZ_SERVER_ROOT_LABEL] ?? "",
  };
}
