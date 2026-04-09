export {};

declare global {
  type DayzServerStatus = "stopped" | "starting" | "running";
  type DayzClientStatus = "stopped" | "launching" | "running";

  interface DayzServerLogEntry {
    id: string;
    level: "info" | "stdout" | "stderr";
    line: string;
    timestamp: string;
  }

  interface DayzDetectedPaths {
    serverRoot: string;
    serverMods: string;
    profiles: string;
    keys: string;
    battleye: string;
    mpmissions: string;
    configPath: string;
    executablePath: string | null;
    hasServerRoot: boolean;
  }

  interface DayzServerRuntime {
    status: DayzServerStatus;
    pid: number | null;
    startedAt: string | null;
    executablePath: string | null;
    launchArgs: string[];
    logs: DayzServerLogEntry[];
  }

  interface DayzClientRuntime {
    status: DayzClientStatus;
    pid: number | null;
    startedAt: string | null;
    executablePath: string | null;
    launchArgs: string[];
  }

  interface DayzServerLaunchOptions {
    serverRoot: string;
    profilesPath?: string;
    battleyePath?: string;
    enableBattleye?: boolean;
    configPath?: string;
    mods?: string[];
    serverModPaths?: string[];
  }

  interface DayzClientLaunchOptions {
    serverRoot?: string;
    serverAddress?: string;
    serverPort?: number;
    mods?: string[];
    executablePath?: string;
    enableBattleye?: boolean;
    displayMode?: "windowed" | "fullscreen";
    resolutionWidth?: number;
    resolutionHeight?: number;
  }

  interface DayzClientLaunchResult {
    executablePath: string;
    args: string[];
  }

  interface DayzServerConfigSnapshot {
    path: string;
    raw: string;
    parsed: Record<string, string>;
    modTokens: string[];
  }

  interface DayzServerConfigWriteOptions {
    configPath?: string;
    serverRoot?: string;
    values: Record<string, unknown>;
  }

  interface DayzMission {
    id: string;
    name: string;
    path: string;
    mapName: string;
    hasInitFile: boolean;
    hasDbFolder: boolean;
    hasCfgEconomyCore: boolean;
    fileCount: number;
  }

  interface DayzInitWeatherSettings {
    mode: "fixed" | "random";
    disableDynamicWeather: boolean;
    overcast: string;
    overcastMin: string;
    overcastMax: string;
    rain: string;
    rainMin: string;
    rainMax: string;
    fog: string;
    fogMin: string;
    fogMax: string;
    wind: string;
    windMin: string;
    windMax: string;
    storm: string;
    stormMin: string;
    stormMax: string;
  }

  interface DayzInitSpawnSettings {
    mode: "random" | "fixed" | "preset" | "near-object";
    fixedPosition: string;
    presetPointName: string;
    presetPointsText: string;
    nearObjectClassname: string;
    nearObjectAnchor: string;
    nearObjectRadius: string;
    nearObjectOffset: string;
  }

  interface DayzInitLoadoutSettings {
    characterClass: string;
    body: string;
    legs: string;
    feet: string;
    backpack: string;
    vest: string;
    headgear: string;
    gloves: string;
    primaryWeapon: string;
    secondaryWeapon: string;
    meleeWeapon: string;
    weaponAttachments: string;
    inventoryItems: string;
    magazines: string;
    foodWater: string;
    medical: string;
    extraItems: string;
  }

  interface DayzInitHelperSettings {
    fillStats: boolean;
    clearAgents: boolean;
    removeBleedingSources: boolean;
    cleanBloodyHands: boolean;
    fixedDateEnabled: boolean;
    fixedDate: string;
    grantInfluenzaResistance: boolean;
    autoEquipLoadout: boolean;
    giveTestTools: boolean;
    testTools: string;
  }

  interface DayzInitSessionSettings {
    loginDelaySeconds: string;
    logoutDelaySeconds: string;
  }

  interface DayzInitModHooksSettings {
    includeActiveModsComment: boolean;
    manualItems: string;
  }

  interface DayzInitLoadoutPreset {
    id: string;
    name: string;
    loadout: DayzInitLoadoutSettings;
  }

  interface DayzInitActiveModRef {
    name: string;
    path: string;
    source: string;
  }

  interface DayzInitGeneratorState {
    weather: DayzInitWeatherSettings;
    spawn: DayzInitSpawnSettings;
    loadout: DayzInitLoadoutSettings;
    helpers: DayzInitHelperSettings;
    session: DayzInitSessionSettings;
    modHooks: DayzInitModHooksSettings;
    loadoutPresets: DayzInitLoadoutPreset[];
  }

  interface DayzMissionSessionSettings {
    missionPath: string;
    globalsPath: string;
    loginDelaySeconds: string;
    logoutDelaySeconds: string;
  }

  interface DayzInitGeneratorRequest {
    missionPath: string;
    state: DayzInitGeneratorState;
    activeMods?: DayzInitActiveModRef[];
  }

  interface DayzInitPreviewResult {
    missionPath: string;
    initPath: string;
    preview: string;
    hasExistingInit: boolean;
    usesManagedBlock: boolean;
    mode: "create" | "full-write" | "managed-update";
    isMissionWritable: boolean;
    missionWriteError: string | null;
  }

  interface DayzInitApplyResult extends DayzInitPreviewResult {
    backupPath: string | null;
  }

  interface DayzInitBackupResult {
    missionPath: string;
    initPath: string;
    backupPath: string;
  }

  interface DayzParsedMod {
    id: string;
    name: string;
    displayName: string;
    source: string;
    state: string;
    enabled: boolean;
    launchMode: "mod" | "serverMod";
    path: string;
    hasAddonsDir: boolean;
    hasKeysDir: boolean;
    version: string;
    author: string;
    workshopId?: string;
    workshopRoot?: string;
    createdAt: string;
    updatedAt: string;
    sizeBytes: number;
    pboCount: number;
    signedPboCount: number;
    isFullySigned: boolean;
  }

  interface DayzCrashArtifact {
    id: string;
    source: "server" | "client";
    kind: "rpt" | "script" | "crash" | "mdmp";
    name: string;
    path: string;
    sizeBytes: number;
    modifiedAt: string;
  }

  interface DayzCrashSourceSnapshot {
    source: "server" | "client";
    label: string;
    path: string;
    artifacts: DayzCrashArtifact[];
    latest: {
      rpt: DayzCrashArtifact | null;
      script: DayzCrashArtifact | null;
      crash: DayzCrashArtifact | null;
      mdmp: DayzCrashArtifact | null;
    };
    excerpts: {
      rpt: string[];
      script: string[];
      crash: string[];
    };
    analysis: DayzCrashAnalysis;
  }

  interface DayzCrashAnalysis {
    severity: "info" | "warning" | "error";
    summary: string;
    probableCause: string;
    exceptionCode: string;
    signals: string[];
    recommendations: string[];
  }

  interface DayzCrashSnapshot {
    profilesPath: string;
    clientLogsPath: string;
    artifacts: DayzCrashArtifact[];
    latest: {
      rpt: DayzCrashArtifact | null;
      script: DayzCrashArtifact | null;
      crash: DayzCrashArtifact | null;
      mdmp: DayzCrashArtifact | null;
    };
    excerpts: {
      rpt: string[];
      script: string[];
      crash: string[];
    };
    analysis: DayzCrashAnalysis;
    sources: {
      server: DayzCrashSourceSnapshot;
      client: DayzCrashSourceSnapshot;
    };
  }

  interface DayzCrashScanRequest {
    profilesPath?: string;
    clientLogsPath?: string;
  }

  interface DayzDeleteCrashArtifactsRequest {
    profilesPath?: string;
    clientLogsPath?: string;
    target: "server" | "client" | "all";
  }

  interface DayzDeleteCrashArtifactsResult {
    target: "server" | "client" | "all";
    deletedCount: number;
    deletedPaths: string[];
    serverDeletedCount: number;
    clientDeletedCount: number;
    skippedCount: number;
    skippedPaths: string[];
  }

  interface DayzModPreset {
    id: string;
    name: string;
    enabledModPaths: string[];
  }

  interface DayzDeleteModRequest {
    path: string;
    source: string;
    workshopId?: string;
    workshopRoot?: string;
    mode: "remove-from-list" | "delete-files";
  }

  interface DayzDeleteModResult {
    source: string;
    path: string;
    deleteTarget: string | null;
    removedFiles: boolean;
    removedFromList: boolean;
    workshopUnsubscribeOpened: boolean;
    workshopUnsubscribeTarget: string | null;
  }

  interface DayzWorkspaceState {
    paths: Record<string, string>;
    clientPath: string;
    clientSettings?: {
      displayMode: "windowed" | "fullscreen";
      resolution: string;
    };
    enabledModPaths: string[];
    modPresets?: DayzModPreset[];
    selectedModPresetId?: string;
    importedLocalModPaths: string[];
    serverConfigValues: Record<string, unknown>;
    initGeneratorState?: DayzInitGeneratorState;
    selectedInitLoadoutPresetId?: string;
    initPresetNameInput?: string;
  }

  interface DesktopBridge {
    platform: string;
    isElectron: boolean;
    app: {
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      confirmClose: () => Promise<void>;
      onBeforeClose: (callback: () => void | Promise<void>) => () => void;
    };
    dayz: {
      pickFolder: (options?: { defaultPath?: string }) => Promise<string | null>;
      pickExecutable: (options?: { defaultPath?: string }) => Promise<string | null>;
      detectClientExecutable: () => Promise<string | null>;
      detectServerPaths: (serverRoot: string) => Promise<DayzDetectedPaths>;
      autoDetectServerPaths: () => Promise<DayzDetectedPaths>;
      getServerRuntime: () => Promise<DayzServerRuntime>;
      getClientRuntime: () => Promise<DayzClientRuntime>;
      startServer: (options: DayzServerLaunchOptions) => Promise<DayzServerRuntime>;
      stopServer: () => Promise<DayzServerRuntime>;
      restartServer: (options: DayzServerLaunchOptions) => Promise<DayzServerRuntime>;
      readServerConfig: (configPath: string) => Promise<DayzServerConfigSnapshot>;
      writeServerConfig: (options: DayzServerConfigWriteOptions) => Promise<DayzServerConfigSnapshot>;
      scanMissions: (missionsRoot: string) => Promise<DayzMission[]>;
      readMissionSessionSettings: (missionPath: string) => Promise<DayzMissionSessionSettings>;
      previewInitGenerator: (request: DayzInitGeneratorRequest) => Promise<DayzInitPreviewResult>;
      backupInitGenerator: (request: DayzInitGeneratorRequest) => Promise<DayzInitBackupResult>;
      applyInitGenerator: (request: DayzInitGeneratorRequest) => Promise<DayzInitApplyResult>;
      scanMods: (serverRoot: string) => Promise<DayzParsedMod[]>;
      scanWorkshopMods: (serverRoot: string) => Promise<DayzParsedMod[]>;
      inspectModFolder: (modRoot: string) => Promise<DayzParsedMod>;
      deleteMod: (request: DayzDeleteModRequest) => Promise<DayzDeleteModResult>;
      scanCrashTools: (request: DayzCrashScanRequest) => Promise<DayzCrashSnapshot>;
      deleteCrashArtifacts: (request: DayzDeleteCrashArtifactsRequest) => Promise<DayzDeleteCrashArtifactsResult>;
      openPath: (targetPath: string) => Promise<void>;
      launchClient: (options: DayzClientLaunchOptions) => Promise<DayzClientLaunchResult>;
      stopClient: () => Promise<DayzClientRuntime>;
      getWorkspaceState: () => Promise<DayzWorkspaceState>;
      saveWorkspaceState: (state: DayzWorkspaceState) => Promise<DayzWorkspaceState>;
      onServerLog: (callback: (entry: DayzServerLogEntry) => void) => () => void;
      onServerStatus: (callback: (runtime: DayzServerRuntime) => void) => () => void;
      onClientStatus: (callback: (runtime: DayzClientRuntime) => void) => () => void;
    };
  }

    interface Window {
      desktopBridge?: DesktopBridge;
      go?: {
        main?: {
          App?: Record<string, (...args: unknown[]) => Promise<unknown>>;
        };
      };
      runtime?: {
        EventsOn?: (eventName: string, callback: (...args: unknown[]) => void) => void;
        EventsOff?: (eventName: string) => void;
      };
      __DAYZ_LAUNCHER_BOOTSTRAP__?: {
        preferences?: {
          themeMode?: "system" | "light" | "dark";
          interfaceMode?: "sans" | "mono";
          interfaceSansFont?: "inter" | "geist" | "noto-sans" | "roboto";
          interfaceMonoFont?: "jetbrains-mono" | "geist-mono";
          headingMode?: "sans" | "mono";
          headingSansFont?: "inter" | "geist" | "noto-sans" | "roboto";
          headingMonoFont?: "jetbrains-mono" | "geist-mono";
        };
      };
    }
  }
