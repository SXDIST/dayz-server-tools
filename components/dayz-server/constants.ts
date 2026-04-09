export type ServerTab = "overview" | "mods" | "config" | "missions" | "settings";

export const serverTabs: { id: ServerTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mods", label: "Mods" },
  { id: "config", label: "Server.cfg" },
  { id: "missions", label: "Missions" },
  { id: "settings", label: "Settings" },
];

export const fallbackMods = [
  { name: "@CF", source: "Steam Workshop", state: "Installed", enabled: true },
  { name: "@VPPAdminTools", source: "Steam Workshop", state: "Queued", enabled: true },
  { name: "@BuilderItems", source: "Local Folder", state: "Installed", enabled: false },
];

export const serverPaths = [
  ["DayZ Server Root", "D:\\Games\\DayZServer", "Required path"],
  ["Server Mods", "D:\\Games\\DayZServer", "Folder that contains @mod directories"],
  ["Profiles", "D:\\Games\\DayZServer\\profiles", "Optional override"],
  ["Keys", "D:\\Games\\DayZServer\\keys", "Usually auto-detected"],
  ["BattlEye", "D:\\Games\\DayZServer\\battleye", "BattlEye working directory"],
  ["mpmissions", "D:\\Games\\DayZServer\\mpmissions", "Mission folder"],
] as const;

export const fallbackTerminalLines = [
  "[server] Resolving server workspace from D:\\Games\\DayZServer",
  "[mods] Active preset loaded: CF, VPPAdminTools, BuilderItems",
  "[cfg] serverDZ.cfg parsed successfully",
  "[mission] chernarusplus selected as active mission",
  "[start] Launch arguments prepared: -config=serverDZ.cfg -profiles=profiles -mod=@CF;@VPPAdminTools",
  "[stdout] Initializing SteamQuery on port 27016",
  "[stdout] BattlEye server updated and listening",
  "[stdout] Mission read from mpmissions\\chernarusplus",
  "[stdout] Economy initialized successfully",
  "[stdout] Server state changed: Online",
];

export const DAYZ_SERVER_ROOT_LABEL = "DayZ Server Root";
export const SERVER_MODS_LABEL = "Server Mods";
export const PROFILES_LABEL = "Profiles";
export const KEYS_LABEL = "Keys";
export const BATTLEYE_LABEL = "BattlEye";
export const MPMISSIONS_LABEL = "mpmissions";
export const DAYZ_CLIENT_PATH_LABEL = "DayZ Client";
export const clientResolutionOptions = [
  "1280x720",
  "1600x900",
  "1920x1080",
  "2560x1440",
  "3840x2160",
] as const;
export const defaultClientSettings = {
  displayMode: "windowed",
  resolution: "1920x1080",
} as const;

export const defaultServerConfigValues = {
  hostname: "DayZ Tools Dev Server",
  password: "",
  passwordAdmin: "",
  description: "",
  template: "",
  maxPlayers: "60",
  enableWhitelist: false,
  verifySignatures: true,
  forceSameBuild: true,
  disableVoN: false,
  vonCodecQuality: "20",
  battlEye: true,
  shardId: "",
  disable3rdPerson: false,
  disableCrosshair: false,
  disablePersonalLight: true,
  lightingConfig: "0",
  serverTime: "SystemTime",
  serverTimePersistent: "",
  serverTimeAcceleration: "8",
  serverNightTimeAcceleration: "4",
  loginQueueMaxPlayers: "500",
  instanceId: "1",
  storageAutoFix: true,
  loginQueueConcurrentPlayers: "5",
  adminLogPlayerHitsOnly: false,
  guaranteedUpdates: "1",
};

export type ServerConfigValues = typeof defaultServerConfigValues;
