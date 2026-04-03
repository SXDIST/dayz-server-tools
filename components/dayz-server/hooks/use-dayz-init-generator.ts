"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { DEFAULT_CHARACTER_CLASS } from "@/components/dayz-server/init-generator-defaults";

type UseDayzInitGeneratorOptions = {
  dayzApi: DesktopBridge["dayz"] | undefined;
  isDesktop: boolean;
  appendPreviewLog: (line: string, level?: DayzServerLogEntry["level"]) => void;
  missions: DayzMission[];
  activeMissionName: string;
  activeMods: DayzInitActiveModRef[];
  initGeneratorState: DayzInitGeneratorState;
  setInitGeneratorState: Dispatch<SetStateAction<DayzInitGeneratorState>>;
  presetNameInput: string;
  setPresetNameInput: Dispatch<SetStateAction<string>>;
  selectedPresetId: string;
  setSelectedPresetId: Dispatch<SetStateAction<string>>;
};

function createPresetId(name: string) {
  return `loadout-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function useDayzInitGenerator({
  dayzApi,
  isDesktop,
  appendPreviewLog,
  missions,
  activeMissionName,
  activeMods,
  initGeneratorState,
  setInitGeneratorState,
  presetNameInput,
  setPresetNameInput,
  selectedPresetId,
  setSelectedPresetId,
}: UseDayzInitGeneratorOptions) {
  const [selectedMissionName, setSelectedMissionName] = useState("");
  const [previewResult, setPreviewResult] = useState<DayzInitPreviewResult | null>(null);
  const [isPreviewPending, setIsPreviewPending] = useState(false);
  const [isBackupPending, setIsBackupPending] = useState(false);
  const [isApplyPending, setIsApplyPending] = useState(false);
  const lastPreviewSignatureRef = useRef("");

  useEffect(() => {
    const fallbackMissionName = activeMissionName || missions[0]?.name || "";

    setSelectedMissionName((current) => {
      if (current && missions.some((mission) => mission.name === current)) {
        return current;
      }

      return fallbackMissionName;
    });
  }, [activeMissionName, missions]);

  useEffect(() => {
    const fallbackPresetId = initGeneratorState.loadoutPresets[0]?.id ?? "";

    if (!selectedPresetId && fallbackPresetId) {
      setSelectedPresetId(fallbackPresetId);
      return;
    }

    if (selectedPresetId && !initGeneratorState.loadoutPresets.some((preset) => preset.id === selectedPresetId)) {
      setSelectedPresetId(fallbackPresetId);
    }
  }, [initGeneratorState.loadoutPresets, selectedPresetId, setSelectedPresetId]);

  useEffect(() => {
    const preset = initGeneratorState.loadoutPresets.find((entry) => entry.id === selectedPresetId);
    if (preset) {
      setPresetNameInput(preset.name);
    }
  }, [initGeneratorState.loadoutPresets, selectedPresetId, setPresetNameInput]);

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.name === selectedMissionName) ?? null,
    [missions, selectedMissionName],
  );

  useEffect(() => {
    if (!dayzApi || !selectedMission) {
      return;
    }

    let active = true;

    void dayzApi
      .readMissionSessionSettings(selectedMission.path)
      .then((settings) => {
        if (!active) {
          return;
        }

        setInitGeneratorState((current) => ({
          ...current,
          session: {
            loginDelaySeconds: settings.loginDelaySeconds || current.session.loginDelaySeconds,
            logoutDelaySeconds: settings.logoutDelaySeconds || current.session.logoutDelaySeconds,
          },
        }));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [dayzApi, selectedMission, setInitGeneratorState]);

  const requestPayload = useMemo<DayzInitGeneratorRequest | null>(() => {
    if (!selectedMission) {
      return null;
    }

    return {
      missionPath: selectedMission.path,
      state: initGeneratorState,
      activeMods,
    };
  }, [activeMods, initGeneratorState, selectedMission]);

  const requestSignature = useMemo(() => {
    if (!requestPayload) {
      return "";
    }

    return JSON.stringify(requestPayload);
  }, [requestPayload]);

  const generatePreview = useCallback(async (force = false) => {
    if (!requestPayload || !requestSignature) {
      setPreviewResult(null);
      lastPreviewSignatureRef.current = "";
      return;
    }

    if (!dayzApi) {
      appendPreviewLog("[init] Live init.c preview works in the desktop build.");
      return;
    }

    if (!force && lastPreviewSignatureRef.current === requestSignature) {
      return;
    }

    setIsPreviewPending(true);

    try {
      const result = await dayzApi.previewInitGenerator(requestPayload);
      setPreviewResult(result);
      lastPreviewSignatureRef.current = requestSignature;
    } catch (error) {
      appendPreviewLog(
        `[init] ${error instanceof Error ? error.message : "Failed to generate init.c preview."}`,
        "stderr",
      );
    } finally {
      setIsPreviewPending(false);
    }
  }, [appendPreviewLog, dayzApi, requestPayload, requestSignature]);

  useEffect(() => {
    if (!isDesktop || !requestPayload || !requestSignature || !dayzApi) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (lastPreviewSignatureRef.current !== requestSignature) {
        void generatePreview(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [dayzApi, generatePreview, isDesktop, requestPayload, requestSignature]);

  const applyGeneratedInit = useCallback(async () => {
    if (!requestPayload) {
      appendPreviewLog("[init] Select a mission before applying init.c.", "stderr");
      return;
    }

    if (!dayzApi) {
      appendPreviewLog("[init] init.c apply works in the desktop build.");
      return;
    }

    setIsApplyPending(true);

    try {
      const result = await dayzApi.applyInitGenerator(requestPayload);
      setPreviewResult(result);
      const selectedCharacterClass = requestPayload.state?.loadout?.characterClass?.trim();
      appendPreviewLog(
        result.backupPath
          ? `[init] Backed up existing init.c to ${result.backupPath}`
          : `[init] Created ${result.initPath}`,
      );
      appendPreviewLog(`[init] Applied generated init.c to ${result.initPath}`);
      appendPreviewLog(
        `[init] Forced survivor class in generated init.c: ${selectedCharacterClass || DEFAULT_CHARACTER_CLASS}`,
      );
      appendPreviewLog("[init] Restart the DayZ server to load the updated init.c changes.", "stderr");
    } catch (error) {
      appendPreviewLog(
        `[init] ${error instanceof Error ? error.message : "Failed to write init.c."}`,
        "stderr",
      );
    } finally {
      setIsApplyPending(false);
    }
  }, [appendPreviewLog, dayzApi, requestPayload]);

  const backupCurrentInit = useCallback(async () => {
    if (!requestPayload) {
      appendPreviewLog("[init] Select a mission before creating a backup.", "stderr");
      return;
    }

    if (!dayzApi) {
      appendPreviewLog("[init] init.c backup works in the desktop build.");
      return;
    }

    setIsBackupPending(true);

    try {
      const result = await dayzApi.backupInitGenerator(requestPayload);
      appendPreviewLog(`[init] Backup created at ${result.backupPath}`);
    } catch (error) {
      appendPreviewLog(
        `[init] ${error instanceof Error ? error.message : "Failed to create init.c backup."}`,
        "stderr",
      );
    } finally {
      setIsBackupPending(false);
    }
  }, [appendPreviewLog, dayzApi, requestPayload]);

  const saveCurrentLoadoutPreset = useCallback(() => {
    const rawName = presetNameInput.trim();

    if (!rawName) {
      appendPreviewLog("[init] Enter a preset name before saving.", "stderr");
      return;
    }

    const existingPreset = initGeneratorState.loadoutPresets.find(
      (preset) => preset.name.toLowerCase() === rawName.toLowerCase(),
    );
    const presetId = existingPreset?.id ?? createPresetId(rawName);

    setInitGeneratorState((current) => {
      const nextPreset = {
        id: presetId,
        name: rawName,
        loadout: { ...current.loadout },
      };

      return {
        ...current,
        loadoutPresets: existingPreset
          ? current.loadoutPresets.map((preset) => (preset.id === presetId ? nextPreset : preset))
          : [...current.loadoutPresets, nextPreset],
      };
    });

    setSelectedPresetId(presetId);
    appendPreviewLog(`[init] Saved loadout preset ${rawName}.`);
  }, [appendPreviewLog, initGeneratorState.loadoutPresets, presetNameInput, setInitGeneratorState, setSelectedPresetId]);

  const loadSelectedPreset = useCallback(() => {
    const preset = initGeneratorState.loadoutPresets.find((entry) => entry.id === selectedPresetId);

    if (!preset) {
      appendPreviewLog("[init] Select a loadout preset first.", "stderr");
      return;
    }

    setInitGeneratorState((current) => ({
      ...current,
      loadout: {
        ...preset.loadout,
        characterClass:
          String(preset.loadout.characterClass ?? "").trim() ||
          String(current.loadout.characterClass ?? "").trim() ||
          DEFAULT_CHARACTER_CLASS,
      },
    }));

    setPresetNameInput(preset.name);
    appendPreviewLog(`[init] Loaded loadout preset ${preset.name}.`);
  }, [appendPreviewLog, initGeneratorState.loadoutPresets, selectedPresetId, setInitGeneratorState, setPresetNameInput]);

  const deleteSelectedPreset = useCallback(() => {
    const preset = initGeneratorState.loadoutPresets.find((entry) => entry.id === selectedPresetId);

    if (!preset) {
      appendPreviewLog("[init] Select a loadout preset to remove.", "stderr");
      return;
    }

    setInitGeneratorState((current) => ({
      ...current,
      loadoutPresets: current.loadoutPresets.filter((entry) => entry.id !== selectedPresetId),
    }));

    setSelectedPresetId("");
    appendPreviewLog(`[init] Removed loadout preset ${preset.name}.`);
  }, [appendPreviewLog, initGeneratorState.loadoutPresets, selectedPresetId, setInitGeneratorState, setSelectedPresetId]);

  return {
    selectedMissionName,
    setSelectedMissionName,
    previewResult,
    isPreviewPending,
    isBackupPending,
    isApplyPending,
    presetNameInput,
    setPresetNameInput,
    selectedPresetId,
    setSelectedPresetId,
    generatePreview: () => generatePreview(true),
    backupCurrentInit,
    applyGeneratedInit,
    saveCurrentLoadoutPreset,
    loadSelectedPreset,
    deleteSelectedPreset,
  };
}
