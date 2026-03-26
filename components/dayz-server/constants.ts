export type ServerTab = "overview" | "mods" | "config" | "admins" | "missions" | "paths";

export const serverTabs: { id: ServerTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mods", label: "Mods" },
  { id: "config", label: "Server.cfg" },
  { id: "admins", label: "Admin Tools" },
  { id: "missions", label: "Missions" },
  { id: "paths", label: "Paths" },
];

export const fallbackMods = [
  { name: "@CF", source: "Steam Workshop", state: "Installed", enabled: true },
  { name: "@VPPAdminTools", source: "Steam Workshop", state: "Queued", enabled: true },
  { name: "@BuilderItems", source: "Local Folder", state: "Installed", enabled: false },
];

export const adminTools = [
  ["VPPAdminTools", "Auto-setup for profiles, permissions and base files."],
  ["Community Online Tools", "Initialize roles and permissions config files."],
];

export const serverPaths = [
  ["DayZ Server Root", "D:\\Games\\DayZServer", "Required path"],
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
  template: "",
  maxPlayers: "60",
  verifySignatures: true,
  disableVoN: false,
  serverTime: "SystemTime",
  serverTimePersistent: "",
  serverTimeAcceleration: "8",
  serverNightTimeAcceleration: "4",
  instanceId: "1",
  storageAutoFix: true,
  loginQueueConcurrentPlayers: "5",
  adminLogPlayerHitsOnly: false,
  guaranteedUpdates: "1",
};

export type ServerConfigValues = typeof defaultServerConfigValues;
