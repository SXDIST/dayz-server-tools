const { spawn } = require("child_process");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const readline = require("readline");

const MAX_LOG_LINES = 500;
const DAYZ_WORKSPACE_FILE = "dayz-workspace.json";
const DAYZ_INIT_START_MARKER = "// >>> DAYZ TOOLS INIT GENERATOR BEGIN";
const DAYZ_INIT_END_MARKER = "// <<< DAYZ TOOLS INIT GENERATOR END";
const DEFAULT_CHARACTER_CLASS = "SurvivorM_Boris";

let serverProcess = null;
let serverRuntime = createRuntimeSnapshot();
let clientProcess = null;
let clientRuntime = createClientRuntimeSnapshot();
let logSequence = 0;

function emitMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function emitEvent(event, payload) {
  emitMessage({ event, payload });
}

function getDocumentsPath() {
  return path.join(os.homedir(), "Documents");
}

function getUserDataPath() {
  return path.join(
    process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
    "dayz-tools",
  );
}

function createDefaultInitGeneratorState() {
  return {
    weather: {
      mode: "fixed",
      disableDynamicWeather: true,
      overcast: "0.1",
      overcastMin: "0.0",
      overcastMax: "0.35",
      rain: "0.0",
      rainMin: "0.0",
      rainMax: "0.2",
      fog: "0.02",
      fogMin: "0.0",
      fogMax: "0.1",
      wind: "8",
      windMin: "0",
      windMax: "18",
      storm: "0.0",
      stormMin: "0.0",
      stormMax: "0.2",
    },
    spawn: {
      mode: "random",
      fixedPosition: "7500 0 7500",
      presetPointName: "NWAF",
      presetPointsText: "NWAF|4700 0 10300\nTisy|1600 0 14100\nDev Coast|13100 0 8300",
      nearObjectClassname: "",
      nearObjectAnchor: "7500 0 7500",
      nearObjectRadius: "150",
      nearObjectOffset: "2 0 2",
    },
    loadout: {
      characterClass: DEFAULT_CHARACTER_CLASS,
      body: "TShirt_Black",
      legs: "CargoPants_Black",
      feet: "AthleticShoes_Black",
      backpack: "AliceBag_Black",
      vest: "",
      headgear: "",
      gloves: "",
      primaryWeapon: "",
      secondaryWeapon: "",
      meleeWeapon: "FirefighterAxe",
      weaponAttachments: "",
      inventoryItems: "BandageDressing\nCompass\nMap",
      magazines: "",
      foodWater: "Canteen\nTacticalBaconCan",
      medical: "BandageDressing\nTetracyclineAntibiotics",
      extraItems: "",
    },
    helpers: {
      fillStats: true,
      clearAgents: true,
      removeBleedingSources: true,
      cleanBloodyHands: true,
      fixedDateEnabled: false,
      fixedDate: "2026-03-26 12:00",
      grantInfluenzaResistance: true,
      autoEquipLoadout: true,
      giveTestTools: true,
      testTools: "HuntingKnife\nHatchet\nShovel\nCombinationLock4\nGPSReceiver",
    },
    session: {
      loginDelaySeconds: "15",
      logoutDelaySeconds: "15",
    },
    modHooks: {
      includeActiveModsComment: true,
      manualItems: "",
    },
    loadoutPresets: [
      {
        id: "preset-light-debug",
        name: "Light Debug",
        loadout: {
          characterClass: DEFAULT_CHARACTER_CLASS,
          body: "TShirt_Black",
          legs: "CargoPants_Black",
          feet: "AthleticShoes_Black",
          backpack: "",
          vest: "",
          headgear: "",
          gloves: "",
          primaryWeapon: "",
          secondaryWeapon: "",
          meleeWeapon: "FirefighterAxe",
          weaponAttachments: "",
          inventoryItems: "BandageDressing\nCompass",
          magazines: "",
          foodWater: "Canteen",
          medical: "BandageDressing",
          extraItems: "",
        },
      },
      {
        id: "preset-builder",
        name: "Builder",
        loadout: {
          characterClass: DEFAULT_CHARACTER_CLASS,
          body: "Hoodie_Black",
          legs: "CargoPants_Black",
          feet: "WorkingBoots_Black",
          backpack: "AliceBag_Black",
          vest: "",
          headgear: "BaseballCap_Black",
          gloves: "WorkingGloves_Black",
          primaryWeapon: "",
          secondaryWeapon: "",
          meleeWeapon: "Hatchet",
          weaponAttachments: "",
          inventoryItems: "BoxOfNails\nWoodenPlank\nMetalWire\nCombinationLock4",
          magazines: "",
          foodWater: "Canteen\nTacticalBaconCan",
          medical: "BandageDressing",
          extraItems: "Shovel\nPickaxe",
        },
      },
      {
        id: "preset-combat",
        name: "Combat Test",
        loadout: {
          characterClass: DEFAULT_CHARACTER_CLASS,
          body: "CombatJacket_Black",
          legs: "CombatPants_Black",
          feet: "MilitaryBoots_Black",
          backpack: "AssaultBag_Black",
          vest: "PlateCarrierVest",
          headgear: "Mich2001Helmet",
          gloves: "TacticalGloves_Black",
          primaryWeapon: "M4A1",
          secondaryWeapon: "FNX45",
          meleeWeapon: "CombatKnife",
          weaponAttachments: "M4_OEBttstck\nM4_PlasticHndgrd\nReflexOptic\nPistolSuppressor",
          inventoryItems: "Rangefinder\nMap\nCompass\nBandageDressing",
          magazines: "Mag_STANAG_30Rnd\nMag_STANAG_30Rnd\nMag_FNX45_15Rnd",
          foodWater: "Canteen",
          medical: "BandageDressing\nMorphine",
          extraItems: "",
        },
      },
    ],
  };
}

function createRuntimeSnapshot(overrides = {}) {
  return {
    status: "stopped",
    pid: null,
    startedAt: null,
    executablePath: null,
    launchArgs: [],
    logs: [],
    ...overrides,
  };
}

function normalizePath(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return path.normalize(value);
}

async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveServerExecutable(serverRoot) {
  const normalizedRoot = normalizePath(serverRoot);

  if (!normalizedRoot) {
    return null;
  }

  const candidates = [
    path.join(normalizedRoot, "DayZServer_x64.exe"),
    path.join(normalizedRoot, "DayZServer.exe"),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function resolveClientExecutable() {
  const candidates = [
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ\\DayZ_x64.exe",
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ\\DayZ.exe",
  ];

  for (let code = 68; code <= 90; code += 1) {
    const driveLetter = String.fromCharCode(code);
    candidates.push(`${driveLetter}:\\SteamLibrary\\steamapps\\common\\DayZ\\DayZ_x64.exe`);
    candidates.push(`${driveLetter}:\\SteamLibrary\\steamapps\\common\\DayZ\\DayZ.exe`);
  }

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return normalizePath(candidate);
    }
  }

  return null;
}

async function resolveSteamExecutable() {
  const candidates = [
    "C:\\Program Files (x86)\\Steam\\steam.exe",
    "C:\\Program Files\\Steam\\steam.exe",
  ];

  for (let code = 68; code <= 90; code += 1) {
    const driveLetter = String.fromCharCode(code);
    candidates.push(`${driveLetter}:\\Steam\\steam.exe`);
  }

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return normalizePath(candidate);
    }
  }

  return null;
}

async function runBattleyeInstaller(gameRoot) {
  const installerPath = path.join(normalizePath(gameRoot), "BattlEye", "Install_BattlEye.bat");

  if (!(await pathExists(installerPath))) {
    return false;
  }

  await new Promise((resolve, reject) => {
    const child = spawn("cmd.exe", ["/c", installerPath], {
      cwd: path.dirname(installerPath),
      windowsHide: true,
      stdio: "ignore",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`BattlEye installer exited with code ${code ?? "unknown"}.`));
    });
  });

  return true;
}

function getDayzClientConfigPath() {
  return path.join(getDocumentsPath(), "DayZ", "DayZ.cfg");
}

function getWorkspaceFilePath() {
  return path.join(getUserDataPath(), DAYZ_WORKSPACE_FILE);
}

async function readWorkspaceState() {
  try {
    const filePath = getWorkspaceFilePath();
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      paths: {},
      clientPath: "",
      clientSettings: {
        displayMode: "windowed",
        resolution: "1920x1080",
      },
      enabledModPaths: [],
      modPresets: [],
      selectedModPresetId: "",
    importedLocalModPaths: [],
    serverConfigValues: {},
    initGeneratorState: createDefaultInitGeneratorState(),
    selectedInitLoadoutPresetId: "",
    initPresetNameInput: "",
  };
}
}

async function saveWorkspaceState(state) {
  const filePath = getWorkspaceFilePath();
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
  return state;
}

async function resolveConfigPath(serverRoot) {
  const normalizedRoot = normalizePath(serverRoot);

  if (!normalizedRoot) {
    return "";
  }

  const candidates = [
    path.join(normalizedRoot, "serverDZ.cfg"),
    path.join(normalizedRoot, "server.cfg"),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return "";
}

async function detectServerPaths(serverRoot) {
  const normalizedRoot = normalizePath(serverRoot);

  if (!normalizedRoot) {
    return {
      serverRoot: "",
      serverMods: "",
      profiles: "",
      keys: "",
      battleye: "",
      mpmissions: "",
      configPath: "",
      executablePath: null,
      hasServerRoot: false,
    };
  }

  const [executablePath, configPath] = await Promise.all([
    resolveServerExecutable(normalizedRoot),
    resolveConfigPath(normalizedRoot),
  ]);

  return {
    serverRoot: normalizedRoot,
    serverMods: normalizedRoot,
    profiles: path.join(normalizedRoot, "profiles"),
    keys: path.join(normalizedRoot, "keys"),
    battleye: path.join(normalizedRoot, "battleye"),
    mpmissions: path.join(normalizedRoot, "mpmissions"),
    configPath,
    executablePath,
    hasServerRoot: await pathExists(normalizedRoot),
  };
}

async function findAutoDetectedServerRoot() {
  const candidates = [
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZServer",
  ];

  for (let code = 68; code <= 90; code += 1) {
    const driveLetter = String.fromCharCode(code);
    candidates.push(`${driveLetter}:\\SteamLibrary\\steamapps\\common\\DayZServer`);
  }

  for (const candidate of candidates) {
    const executablePath = await resolveServerExecutable(candidate);

    if (executablePath) {
      return normalizePath(candidate);
    }
  }

  return "";
}

async function autoDetectServerPaths() {
  const serverRoot = await findAutoDetectedServerRoot();
  return detectServerPaths(serverRoot);
}

function stripInlineComment(input) {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < input.length - 1; index += 1) {
    const current = input[index];
    const next = input[index + 1];

    if (current === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (current === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && current === "/" && next === "/") {
      return input.slice(0, index).trimEnd();
    }
  }

  return input.trimEnd();
}

function normalizeCfgValue(value) {
  const withoutComment = stripInlineComment(String(value ?? ""))
    .replace(/;$/, "")
    .trim();

  if (
    (withoutComment.startsWith('"') && withoutComment.endsWith('"')) ||
    (withoutComment.startsWith("'") && withoutComment.endsWith("'"))
  ) {
    return withoutComment.slice(1, -1);
  }

  return withoutComment;
}

function parseSimpleCfg(text) {
  const parsed = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("//")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.+?);?$/);

    if (match) {
      parsed[match[1]] = normalizeCfgValue(match[2]);
    }
  }

  return parsed;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeInitGeneratorState(input = {}) {
  const base = createDefaultInitGeneratorState();
  const mergedLoadout = { ...base.loadout, ...(input.loadout ?? {}) };

  if (!String(mergedLoadout.characterClass ?? "").trim()) {
    mergedLoadout.characterClass = DEFAULT_CHARACTER_CLASS;
  }

  return {
    ...base,
    ...input,
    weather: { ...base.weather, ...(input.weather ?? {}) },
    spawn: { ...base.spawn, ...(input.spawn ?? {}) },
    loadout: mergedLoadout,
    helpers: { ...base.helpers, ...(input.helpers ?? {}) },
    session: { ...base.session, ...(input.session ?? {}) },
    modHooks: { ...base.modHooks, ...(input.modHooks ?? {}) },
    loadoutPresets:
      Array.isArray(input.loadoutPresets) && input.loadoutPresets.length > 0
        ? input.loadoutPresets.map((preset) => ({
            ...preset,
            loadout: {
              ...base.loadout,
              ...(preset.loadout ?? {}),
              characterClass:
                String(preset.loadout?.characterClass ?? "").trim() || DEFAULT_CHARACTER_CLASS,
            },
          }))
        : cloneJson(base.loadoutPresets),
  };
}

function getMissionGlobalsPath(missionPath) {
  return path.join(normalizePath(missionPath), "db", "globals.xml");
}

async function readMissionSessionSettings(missionPath) {
  const normalizedMissionPath = normalizePath(missionPath);
  const globalsPath = getMissionGlobalsPath(normalizedMissionPath);
  const raw = await readOptionalFile(globalsPath);
  const defaults = createDefaultInitGeneratorState().session;

  if (!raw) {
    return {
      missionPath: normalizedMissionPath,
      globalsPath,
      loginDelaySeconds: defaults.loginDelaySeconds,
      logoutDelaySeconds: defaults.logoutDelaySeconds,
    };
  }

  const readValue = (name, fallback) => {
    const match = raw.match(new RegExp(`<var\\s+name="${name}"\\s+type="[^"]+"\\s+value="([^"]+)"\\s*/>`, "i"));
    return match?.[1] ?? fallback;
  };

  return {
    missionPath: normalizedMissionPath,
    globalsPath,
    loginDelaySeconds: readValue("TimeLogin", defaults.loginDelaySeconds),
    logoutDelaySeconds: readValue("TimeLogout", defaults.logoutDelaySeconds),
  };
}

async function applyMissionSessionSettings(missionPath, sessionSettings = {}) {
  const normalizedMissionPath = normalizePath(missionPath);
  const globalsPath = getMissionGlobalsPath(normalizedMissionPath);
  const currentRaw = (await readOptionalFile(globalsPath)) || "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<variables>\n</variables>\n";
  const nextValues = {
    TimeLogin: String(sessionSettings.loginDelaySeconds ?? createDefaultInitGeneratorState().session.loginDelaySeconds),
    TimeLogout: String(sessionSettings.logoutDelaySeconds ?? createDefaultInitGeneratorState().session.logoutDelaySeconds),
  };

  let nextRaw = currentRaw;

  for (const [key, value] of Object.entries(nextValues)) {
    const pattern = new RegExp(`(<var\\s+name="${key}"\\s+type="[^"]+"\\s+value=")([^"]+)("\\s*/>)`, "i");

    if (pattern.test(nextRaw)) {
      nextRaw = nextRaw.replace(pattern, `$1${value}$3`);
      continue;
    }

    nextRaw = nextRaw.replace("</variables>", `    <var name="${key}" type="0" value="${value}"/>\n</variables>`);
  }

  await fsp.mkdir(path.dirname(globalsPath), { recursive: true });
  await fsp.writeFile(globalsPath, nextRaw, "utf8");

  return readMissionSessionSettings(normalizedMissionPath);
}

function formatTimestampFilePart() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function escapeEnforceString(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function splitClassnameList(value) {
  return [...new Set(
    String(value ?? "")
      .split(/[\r\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  )];
}

function parseNumberValue(value, fallback, min = null, max = null) {
  const parsed = Number.parseFloat(String(value ?? ""));
  let next = Number.isFinite(parsed) ? parsed : fallback;

  if (min !== null) {
    next = Math.max(min, next);
  }

  if (max !== null) {
    next = Math.min(max, next);
  }

  return next;
}

function formatNumberLiteral(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function formatVectorLiteral(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, "");
}

function sanitizeVectorString(value, fallback = "7500 0 7500") {
  const matches = String(value ?? "")
    .trim()
    .match(/-?\d+(?:\.\d+)?/g);

  if (!matches || matches.length < 3) {
    return fallback;
  }

  return matches
    .slice(0, 3)
    .map((part) => formatVectorLiteral(Number.parseFloat(part)))
    .join(" ");
}

function parsePresetPoints(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, positionPart] = line.includes("|") ? line.split("|") : line.split("=");
      return {
        name: String(namePart ?? "").trim(),
        position: sanitizeVectorString(positionPart ?? "", "7500 0 7500"),
      };
    })
    .filter((entry) => entry.name);
}

function parseFixedDate(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/);

  if (!match) {
    return null;
  }

  return {
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10),
    day: Number.parseInt(match[3], 10),
    hour: Number.parseInt(match[4] ?? "12", 10),
    minute: Number.parseInt(match[5] ?? "0", 10),
  };
}

async function readMissionInitState(missionPath) {
  const normalizedMissionPath = normalizePath(missionPath);

  if (!normalizedMissionPath) {
    throw new Error("Mission path is required for init.c generation.");
  }

  if (!(await pathExists(normalizedMissionPath))) {
    throw new Error(`Mission folder was not found: ${normalizedMissionPath}`);
  }

  const initPath = path.join(normalizedMissionPath, "init.c");
  const hasExistingInit = await pathExists(initPath);
  const raw = hasExistingInit ? await fsp.readFile(initPath, "utf8") : "";

  return {
    missionPath: normalizedMissionPath,
    initPath,
    hasExistingInit,
    raw,
  };
}

function replaceManagedInitBlock(raw, generatedBlock) {
  const startIndex = raw.indexOf(DAYZ_INIT_START_MARKER);
  const endIndex = raw.indexOf(DAYZ_INIT_END_MARKER);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return null;
  }

  const suffixIndex = endIndex + DAYZ_INIT_END_MARKER.length;
  return `${raw.slice(0, startIndex)}${generatedBlock}${raw.slice(suffixIndex)}`;
}

function buildWeatherLines(state) {
  const weather = state.weather;
  const fixedMode = weather.mode !== "random";
  const overcastMin = parseNumberValue(weather.overcastMin, 0, 0, 1);
  const overcastMax = parseNumberValue(weather.overcastMax, 0.35, 0, 1);
  const rainMin = parseNumberValue(weather.rainMin, 0, 0, 1);
  const rainMax = parseNumberValue(weather.rainMax, 0.2, 0, 1);
  const fogMin = parseNumberValue(weather.fogMin, 0, 0, 1);
  const fogMax = parseNumberValue(weather.fogMax, 0.1, 0, 1);
  const windMin = parseNumberValue(weather.windMin, 0, 0, 100);
  const windMax = parseNumberValue(weather.windMax, 18, 0, 100);
  const stormMin = parseNumberValue(weather.stormMin, 0, 0, 1);
  const stormMax = parseNumberValue(weather.stormMax, 0.2, 0, 1);
  const fixedOvercast = parseNumberValue(weather.overcast, 0.1, 0, 1);
  const fixedRain = parseNumberValue(weather.rain, 0, 0, 1);
  const fixedFog = parseNumberValue(weather.fog, 0.02, 0, 1);
  const fixedWind = parseNumberValue(weather.wind, 8, 0, 100);
  const fixedStorm = parseNumberValue(weather.storm, 0, 0, 1);

  const lines = [
    "\tWeather weather = g_Game.GetWeather();",
    "\tweather.MissionWeather(true);",
    `\tweather.SetWeatherUpdateFreeze(${weather.disableDynamicWeather ? "true" : "false"});`,
  ];

  if (weather.disableDynamicWeather) {
    lines.push(
      "\tweather.GetOvercast().SetForecastChangeLimits(0.0, 0.0);",
      "\tweather.GetRain().SetForecastChangeLimits(0.0, 0.0);",
      "\tweather.GetFog().SetForecastChangeLimits(0.0, 0.0);",
      "\tweather.GetOvercast().SetForecastTimeLimits(1800, 1800);",
      "\tweather.GetRain().SetForecastTimeLimits(600, 600);",
      "\tweather.GetFog().SetForecastTimeLimits(600, 600);",
    );
  }

  if (fixedMode) {
    lines.push(
      `\tweather.GetOvercast().SetLimits(${formatNumberLiteral(fixedOvercast)}, ${formatNumberLiteral(fixedOvercast)});`,
      `\tweather.GetRain().SetLimits(${formatNumberLiteral(fixedRain)}, ${formatNumberLiteral(fixedRain)});`,
      `\tweather.GetFog().SetLimits(${formatNumberLiteral(fixedFog)}, ${formatNumberLiteral(fixedFog)});`,
      `\tweather.GetOvercast().Set(${formatNumberLiteral(fixedOvercast)}, 0, 0);`,
      `\tweather.GetRain().Set(${formatNumberLiteral(fixedRain)}, 0, 0);`,
      `\tweather.GetFog().Set(${formatNumberLiteral(fixedFog)}, 0, 0);`,
      `\tweather.SetWindMaximumSpeed(${formatNumberLiteral(fixedWind)});`,
      `\tweather.SetWindFunctionParams(0.0, 0.0, ${formatNumberLiteral(Math.max(0.1, fixedWind > 0 ? 0.25 : 0.1))});`,
      `\tweather.SetStorm(${formatNumberLiteral(fixedStorm)}, 0.85, 45);`,
    );
  } else {
    lines.push(
      `\tfloat dtOvercast = Math.RandomFloatInclusive(${formatNumberLiteral(overcastMin)}, ${formatNumberLiteral(overcastMax)});`,
      `\tfloat dtRain = Math.RandomFloatInclusive(${formatNumberLiteral(rainMin)}, ${formatNumberLiteral(rainMax)});`,
      `\tfloat dtFog = Math.RandomFloatInclusive(${formatNumberLiteral(fogMin)}, ${formatNumberLiteral(fogMax)});`,
      `\tfloat dtWindMax = Math.RandomFloatInclusive(${formatNumberLiteral(windMin)}, ${formatNumberLiteral(windMax)});`,
      `\tfloat dtStorm = Math.RandomFloatInclusive(${formatNumberLiteral(stormMin)}, ${formatNumberLiteral(stormMax)});`,
      `\tweather.GetOvercast().SetLimits(${formatNumberLiteral(overcastMin)}, ${formatNumberLiteral(overcastMax)});`,
      `\tweather.GetRain().SetLimits(${formatNumberLiteral(rainMin)}, ${formatNumberLiteral(rainMax)});`,
      `\tweather.GetFog().SetLimits(${formatNumberLiteral(fogMin)}, ${formatNumberLiteral(fogMax)});`,
      "\tweather.GetOvercast().Set(dtOvercast, 0, 0);",
      "\tweather.GetRain().Set(dtRain, 0, 0);",
      "\tweather.GetFog().Set(dtFog, 0, 0);",
      "\tweather.SetWindMaximumSpeed(dtWindMax);",
      "\tweather.SetWindFunctionParams(0.0, 1.0, 0.35);",
      "\tweather.SetStorm(dtStorm, 0.85, 45);",
    );
  }

  lines.push("\tweather.SetRainThresholds(0.6, 1.0, 30);");

  return lines;
}

function buildDateLines(state) {
  const parsedDate = state.helpers.fixedDateEnabled ? parseFixedDate(state.helpers.fixedDate) : null;

  if (!parsedDate) {
    return [];
  }

  return [
    "\tint year, month, day, hour, minute;",
    "\tGetGame().GetWorld().GetDate(year, month, day, hour, minute);",
    `\tGetGame().GetWorld().SetDate(${parsedDate.year}, ${parsedDate.month}, ${parsedDate.day}, ${parsedDate.hour}, ${parsedDate.minute});`,
  ];
}

function buildCreateCharacterLines(state) {
  const spawn = state.spawn;
  const forcedCharacterClass =
    String(state.loadout?.characterClass ?? "").trim() || DEFAULT_CHARACTER_CLASS;
  const fixedPosition = sanitizeVectorString(spawn.fixedPosition, "7500 0 7500");
  const nearObjectAnchor = sanitizeVectorString(spawn.nearObjectAnchor, fixedPosition);
  const nearObjectOffset = sanitizeVectorString(spawn.nearObjectOffset, "2 0 2");
  const nearObjectRadius = parseNumberValue(spawn.nearObjectRadius, 150, 1, 5000);
  const selectedPreset = parsePresetPoints(spawn.presetPointsText).find(
    (point) => point.name.toLowerCase() === String(spawn.presetPointName ?? "").trim().toLowerCase(),
  );

  const lines = [
    "\t\tvector spawnPosition = pos;",
  ];

  if (spawn.mode === "fixed") {
    lines.push(`\t\tspawnPosition = "${fixedPosition}";`);
  } else if (spawn.mode === "preset") {
    lines.push(`\t\tspawnPosition = "${selectedPreset?.position ?? fixedPosition}";`);
  } else if (spawn.mode === "near-object" && String(spawn.nearObjectClassname ?? "").trim()) {
    lines.push(
      "\t\tarray<Object> nearbyObjects = new array<Object>;",
      "\t\tarray<CargoBase> proxyCargos = new array<CargoBase>;",
      `\t\tGetGame().GetObjectsAtPosition3D("${nearObjectAnchor}", ${formatNumberLiteral(nearObjectRadius)}, nearbyObjects, proxyCargos);`,
      `\t\tvector desiredOffset = "${nearObjectOffset}";`,
      "\t\tforeach (Object nearbyObject : nearbyObjects)",
      "\t\t{",
      `\t\t\tif (nearbyObject && nearbyObject.GetType() == "${escapeEnforceString(spawn.nearObjectClassname.trim())}")`,
      "\t\t\t{",
      "\t\t\t\tspawnPosition = nearbyObject.GetPosition() + desiredOffset;",
      "\t\t\t\tbreak;",
      "\t\t\t}",
      "\t\t}",
    );
  }

  lines.push(
    `\t\tstring selectedCharacter = "${escapeEnforceString(forcedCharacterClass)}";`,
    "\t\tcharacterName = selectedCharacter;",
    "\t\tEntity playerEnt;",
    '\t\tplayerEnt = GetGame().CreatePlayer(identity, characterName, spawnPosition, 0, "NONE");',
    "\t\tClass.CastTo(m_player, playerEnt);",
    "\t\tGetGame().SelectPlayer(identity, m_player);",
    "\t\treturn m_player;",
  );

  return lines;
}

function buildItemCreationLines(targetExpression, items, indent) {
  const lines = [];

  for (const item of items) {
    lines.push(`${indent}DT_CreateInInventory(${targetExpression}, "${escapeEnforceString(item)}");`);
  }

  return lines;
}

function buildLoadoutLines(state, activeMods) {
  const loadout = state.loadout;
  const helpers = state.helpers;
  const modHooks = state.modHooks;
  const lines = [];

  if (!helpers.autoEquipLoadout) {
    return [];
  }

  const clothingAttachments = [
    loadout.body,
    loadout.legs,
    loadout.feet,
    loadout.backpack,
    loadout.vest,
    loadout.headgear,
    loadout.gloves,
  ].filter(Boolean);

  for (const item of clothingAttachments) {
    lines.push(`\t\tDT_CreateAttachment(player, "${escapeEnforceString(item)}");`);
  }

  if (loadout.primaryWeapon) {
    lines.push(
      `\t\tEntityAI primaryWeapon = DT_CreateInInventory(player, "${escapeEnforceString(loadout.primaryWeapon)}");`,
    );

    for (const attachment of splitClassnameList(loadout.weaponAttachments)) {
      lines.push(`\t\tDT_CreateAttachment(primaryWeapon, "${escapeEnforceString(attachment)}");`);
    }
  } else {
    lines.push("\t\tEntityAI primaryWeapon = null;");
  }

  if (loadout.secondaryWeapon) {
    lines.push(
      `\t\tEntityAI secondaryWeapon = DT_CreateInInventory(player, "${escapeEnforceString(loadout.secondaryWeapon)}");`,
    );
  } else {
    lines.push("\t\tEntityAI secondaryWeapon = null;");
  }

  if (loadout.meleeWeapon) {
    lines.push(`\t\tDT_CreateInInventory(player, "${escapeEnforceString(loadout.meleeWeapon)}");`);
  }

  lines.push(...buildItemCreationLines("player", splitClassnameList(loadout.inventoryItems), "\t\t"));
  lines.push(...buildItemCreationLines("player", splitClassnameList(loadout.magazines), "\t\t"));
  lines.push(...buildItemCreationLines("player", splitClassnameList(loadout.foodWater), "\t\t"));
  lines.push(...buildItemCreationLines("player", splitClassnameList(loadout.medical), "\t\t"));
  lines.push(...buildItemCreationLines("player", splitClassnameList(loadout.extraItems), "\t\t"));

  if (helpers.giveTestTools) {
    lines.push(...buildItemCreationLines("player", splitClassnameList(helpers.testTools), "\t\t"));
  }

  const manualModItems = splitClassnameList(modHooks.manualItems);
  if (manualModItems.length > 0) {
    lines.push(...buildItemCreationLines("player", manualModItems, "\t\t"));
  }

  return lines;
}

function buildHelperLines(state) {
  const helpers = state.helpers;
  const lines = ["\t\tif (!player) return;"];

  if (helpers.fillStats) {
    lines.push(
      '\t\tplayer.SetHealth("", "", player.GetMaxHealth("", ""));',
      '\t\tplayer.SetHealth("", "Blood", player.GetMaxHealth("", "Blood"));',
      '\t\tplayer.SetHealth("", "Shock", player.GetMaxHealth("", "Shock"));',
      "\t\tplayer.GetStatWater().Set(player.GetStatWater().GetMax());",
      "\t\tplayer.GetStatEnergy().Set(player.GetStatEnergy().GetMax());",
    );
  }

  if (helpers.clearAgents) {
    lines.push("\t\tplayer.RemoveAllAgents();");
  }

  if (helpers.removeBleedingSources) {
    lines.push(
      "\t\tif (player.GetBleedingManagerServer())",
      "\t\t\tplayer.GetBleedingManagerServer().RemoveAllSources();",
    );
  }

  if (helpers.cleanBloodyHands) {
    lines.push(
      "\t\tPluginLifespan moduleLifespan = PluginLifespan.Cast(GetPlugin(PluginLifespan));",
      "\t\tif (moduleLifespan)",
      "\t\t\tmoduleLifespan.UpdateBloodyHandsVisibilityEx(player, eBloodyHandsTypes.CLEAN);",
      "\t\tplayer.ClearBloodyHandsPenaltyChancePerAgent(eAgents.SALMONELLA);",
    );
  }

  if (helpers.grantInfluenzaResistance) {
    lines.push("\t\tplayer.SetTemporaryResistanceToAgent(eAgents.INFLUENZA, 1800);");
  }

  return lines;
}

function generateInitContent(request) {
  const state = normalizeInitGeneratorState(request.state);
  const activeMods = Array.isArray(request.activeMods) ? request.activeMods : [];
  const dateLines = buildDateLines(state);
  const weatherLines = buildWeatherLines(state);
  const createCharacterLines = buildCreateCharacterLines(state);
  const loadoutLines = buildLoadoutLines(state, activeMods);
  const helperLines = buildHelperLines(state);

  const lines = [
    "void main()",
    "{",
    "\tHive ce = CreateHive();",
    "\tif ( ce )",
    "\t\tce.InitOffline();",
    "",
    ...dateLines,
    ...(dateLines.length > 0 ? [""] : []),
    ...weatherLines,
    "}",
    "",
    "class DTToolsMission: MissionServer",
    "{",
    "\tprotected EntityAI DT_CreateAttachment(EntityAI parent, string classname)",
    "\t{",
    '\t\tif (!parent || classname == "")',
    "\t\t\treturn null;",
    "\t\treturn parent.GetInventory().CreateAttachment(classname);",
    "\t}",
    "",
    "\tprotected EntityAI DT_CreateInInventory(EntityAI parent, string classname)",
    "\t{",
    '\t\tif (!parent || classname == "")',
    "\t\t\treturn null;",
    "\t\treturn parent.GetInventory().CreateInInventory(classname);",
    "\t}",
    "",
    "\toverride PlayerBase CreateCharacter(PlayerIdentity identity, vector pos, ParamsReadContext ctx, string characterName)",
    "\t{",
    ...createCharacterLines,
    "\t}",
    "",
    "\tvoid DT_ApplyHelpers(PlayerBase player)",
    "\t{",
    ...helperLines,
    "\t}",
    "",
    "\toverride void StartingEquipSetup(PlayerBase player, bool clothesChosen)",
    "\t{",
    ...loadoutLines,
    "",
    "\t\tDT_ApplyHelpers(player);",
    "\t}",
    "};",
    "",
    "Mission CreateCustomMission(string path)",
    "{",
    "\treturn new DTToolsMission();",
    "}",
  ];

  return lines.join("\r\n");
}

async function previewInitGenerator(request) {
  const missionState = await readMissionInitState(request.missionPath);
  const generatedBlock = generateInitContent(request);

  return {
    missionPath: missionState.missionPath,
    initPath: missionState.initPath,
    preview: generatedBlock,
    hasExistingInit: missionState.hasExistingInit,
    usesManagedBlock: false,
    mode: missionState.hasExistingInit ? "full-write" : "create",
  };
}

async function backupInitGenerator(request) {
  const normalizedMissionPath = normalizePath(request?.missionPath);

  if (!normalizedMissionPath) {
    throw new Error("Mission path is required to create an init.c backup.");
  }

  const initPath = path.join(normalizedMissionPath, "init.c");

  if (!(await pathExists(initPath))) {
    throw new Error("No existing init.c file was found for the selected mission.");
  }

  const backupPath = `${initPath}.backup-${formatTimestampFilePart()}`;
  await fsp.copyFile(initPath, backupPath);

  return {
    missionPath: normalizedMissionPath,
    initPath,
    backupPath,
  };
}

async function applyInitGenerator(request) {
  const preview = await previewInitGenerator(request);
  let backupPath = null;

  if (preview.hasExistingInit) {
    backupPath = `${preview.initPath}.backup-${formatTimestampFilePart()}`;
    await fsp.copyFile(preview.initPath, backupPath);
  }

  await fsp.mkdir(path.dirname(preview.initPath), { recursive: true });
  await fsp.writeFile(preview.initPath, preview.preview, "utf8");
  await applyMissionSessionSettings(request.missionPath, request.state?.session ?? {});

  return {
    ...preview,
    backupPath,
  };
}

function parseModArgumentValue(value) {
  const normalizedValue = normalizeCfgValue(value);

  return normalizedValue
    .split(";")
    .map((token) => normalizePath(token.trim().replace(/^"+|"+$/g, "")))
    .filter(Boolean);
}

const MANAGED_SERVER_CONFIG_KEYS = [
  "hostname",
  "password",
  "passwordAdmin",
  "description",
  "template",
  "maxPlayers",
  "enableWhitelist",
  "verifySignatures",
  "forceSameBuild",
  "disableVoN",
  "vonCodecQuality",
  "battlEye",
  "shardId",
  "disable3rdPerson",
  "disableCrosshair",
  "disablePersonalLight",
  "lightingConfig",
  "serverTime",
  "serverTimePersistent",
  "serverTimeAcceleration",
  "serverNightTimeAcceleration",
  "loginQueueMaxPlayers",
  "instanceId",
  "storageAutoFix",
  "loginQueueConcurrentPlayers",
  "adminLogPlayerHitsOnly",
  "guaranteedUpdates",
];

function formatServerConfigValue(key, value) {
  const stringValue = String(value ?? "").trim();

  if (
    [
      "enableWhitelist",
      "verifySignatures",
      "forceSameBuild",
      "disableVoN",
      "battlEye",
      "disable3rdPerson",
      "disableCrosshair",
      "disablePersonalLight",
      "storageAutoFix",
      "adminLogPlayerHitsOnly",
    ].includes(key)
  ) {
    const normalized = stringValue.toLowerCase();
    if (key === "verifySignatures") {
      return ["1", "2", "true", "yes"].includes(normalized) ? "2" : "0";
    }

    return ["1", "true", "yes"].includes(normalized) ? "1" : "0";
  }

  if (["hostname", "password", "passwordAdmin", "description", "template", "serverTime", "shardId"].includes(key)) {
    return `"${stringValue.replaceAll('"', '\\"')}"`;
  }

  return stringValue;
}

function applyManagedServerConfig(raw, values) {
  const lines = raw ? raw.split(/\r?\n/) : [];
  const remainingKeys = new Set(MANAGED_SERVER_CONFIG_KEYS);
  const nextLines = lines.map((line) => {
    const commentIndex = (() => {
      let inSingleQuote = false;
      let inDoubleQuote = false;

      for (let index = 0; index < line.length - 1; index += 1) {
        const current = line[index];
        const next = line[index + 1];

        if (current === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
          continue;
        }

        if (current === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
          continue;
        }

        if (!inSingleQuote && !inDoubleQuote && current === "/" && next === "/") {
          return index;
        }
      }

      return -1;
    })();
    const comment = commentIndex >= 0 ? line.slice(commentIndex).trimEnd() : "";
    const body = commentIndex >= 0 ? line.slice(0, commentIndex).trimEnd() : line;
    const match = body.match(/^(\s*)([A-Za-z0-9_]+)(\s*=\s*)(.+?)(\s*;?\s*)$/);

    if (!match) {
      return line;
    }

    const [, indent, key, separator] = match;

    if (!remainingKeys.has(key)) {
      return line;
    }

    remainingKeys.delete(key);
    const nextLine = `${indent}${key}${separator}${formatServerConfigValue(key, values[key])};`;
    return comment ? `${nextLine} ${comment}` : nextLine;
  });

  for (const key of remainingKeys) {
    nextLines.push(`${key} = ${formatServerConfigValue(key, values[key])};`);
  }

  return nextLines.join("\n").trimEnd() + "\n";
}

function applyClientDisplayConfig(raw, options = {}) {
  const lines = raw ? raw.split(/\r?\n/) : [];
  const width = Number.parseInt(String(options.resolutionWidth || 0), 10);
  const height = Number.parseInt(String(options.resolutionHeight || 0), 10);
  const windowed = options.displayMode === "fullscreen" ? "0" : "1";
  const replacements = new Map([
    ["Windowed", windowed],
    ["WindowWidth", Number.isFinite(width) && width > 0 ? String(width) : ""],
    ["WindowHeight", Number.isFinite(height) && height > 0 ? String(height) : ""],
  ]);
  const seenKeys = new Set();

  const nextLines = lines.map((line) => {
    const match = line.match(/^(\s*)(Windowed|WindowWidth|WindowHeight)(\s*=\s*)(.+?)(;?\s*)$/);

    if (!match) {
      return line;
    }

    const [, indent, key, separator, , suffix] = match;
    const nextValue = replacements.get(key);

    if (!nextValue) {
      return line;
    }

    seenKeys.add(key);
    return `${indent}${key}${separator}${nextValue};`;
  });

  for (const [key, value] of replacements.entries()) {
    if (!value || seenKeys.has(key)) {
      continue;
    }

    nextLines.push(`${key}=${value};`);
  }

  return nextLines.join("\n").trimEnd() + "\n";
}

async function writeDayzClientDisplayConfig(options = {}) {
  const configPath = getDayzClientConfigPath();
  const currentRaw = await readOptionalFile(configPath);
  const nextRaw = applyClientDisplayConfig(currentRaw || "", options);

  await fsp.mkdir(path.dirname(configPath), { recursive: true });
  await fsp.writeFile(configPath, nextRaw, "utf8");
}

function extractModTokensFromText(text) {
  const modTokens = [];
  const regex = /-mod=("[^"]+"|'[^']+'|[^\s]+)/gi;

  for (const match of text.matchAll(regex)) {
    modTokens.push(...parseModArgumentValue(match[1]));
  }

  return [...new Set(modTokens)];
}

async function readOptionalFile(filePath) {
  try {
    return await fsp.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function classifyCrashArtifact(name) {
  if (/\.rpt$/i.test(name)) {
    return "rpt";
  }

  if (/^script_.*\.log$/i.test(name)) {
    return "script";
  }

  if (/^crash_.*\.log$/i.test(name)) {
    return "crash";
  }

  if (/\.mdmp$/i.test(name)) {
    return "mdmp";
  }

  return null;
}

function buildCrashSnapshotSkeleton(profilesPath) {
  return {
    profilesPath: normalizePath(profilesPath),
    artifacts: [],
    latest: {
      rpt: null,
      script: null,
      crash: null,
      mdmp: null,
    },
    excerpts: {
      rpt: [],
      script: [],
      crash: [],
    },
    analysis: {
      severity: "info",
      summary: "No crash artifacts found in the selected profiles folder.",
      probableCause: "No crash data available yet.",
      exceptionCode: "",
      signals: [],
      recommendations: [
        "Launch the server once and reopen Crash Tools after a crash or script error occurs.",
      ],
    },
  };
}

function buildCrashExcerpt(rawText, maxLines = 18) {
  return String(rawText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-maxLines);
}

function analyzeCrashArtifacts({ rptText, scriptText, crashText, hasDump }) {
  const combined = [rptText, scriptText, crashText].filter(Boolean).join("\n");
  const signals = [];
  const recommendations = [];
  let severity = "info";
  let probableCause = "No crash signature matched yet.";

  const exceptionCodeMatch = combined.match(/Exception code:\s*(0x[0-9a-f]+)/i);
  const exceptionCode = exceptionCodeMatch?.[1]?.toLowerCase() ?? "";

  if (/NULL pointer to instance/i.test(combined)) {
    severity = "error";
    probableCause = "Enforce Script null pointer during mission or mod execution.";
    signals.push("Detected 'NULL pointer to instance' in script/crash logs.");
    recommendations.push("Inspect the script stack around the first null pointer and identify the mod/class involved.");
  }

  if (/Can't compile|Compile error|SCRIPT ERROR/i.test(combined)) {
    severity = "error";
    probableCause = "Script compile or mission initialization error.";
    signals.push("Detected script compile/runtime error markers.");
    recommendations.push("Open the latest script log and fix the first compile/runtime error before relaunching.");
  }

  if (/Unhandled exception/i.test(combined)) {
    severity = "error";
    probableCause =
      probableCause === "No crash signature matched yet."
        ? "Unhandled native or script-linked server exception."
        : probableCause;
    signals.push("Detected 'Unhandled exception' in crash output.");
  }

  if (/0xc0000374/i.test(exceptionCode) || /heap corruption/i.test(combined)) {
    severity = "error";
    probableCause = "Heap corruption, usually caused by a mod/native interaction after a script failure.";
    signals.push("Exception code 0xc0000374 / heap corruption signature detected.");
    recommendations.push("Disable the most recently added mods and test again to isolate the crashing combination.");
  }

  if (/GetUpstreamIdentity/i.test(combined)) {
    severity = "error";
    probableCause = "A mod expects a real player identity on an entity that does not have one.";
    signals.push("Identity-related call detected in the stack trace.");
    recommendations.push("Check NPC/player spawning logic and mods that hook player identity or statistics.");
  }

  if (/stack trace/i.test(combined)) {
    signals.push("Stack trace data is present in the logs.");
  }

  if (hasDump) {
    signals.push("A memory dump (.mdmp) exists for this crash.");
    if (severity === "info") {
      severity = "warning";
      probableCause = "A crash dump exists, but no strong text signature was detected in the text logs.";
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Open the latest RPT and script log to inspect the first error that appears before the crash.");
    recommendations.push("Compare the crash time with the active mission, init.c changes and recently enabled mods.");
  }

  return {
    severity,
    summary:
      severity === "info"
        ? "No obvious crash signature was detected."
        : `Detected ${signals.length} crash signal${signals.length === 1 ? "" : "s"} in the latest artifacts.`,
    probableCause,
    exceptionCode,
    signals: [...new Set(signals)],
    recommendations: [...new Set(recommendations)],
  };
}

async function scanCrashTools(profilesPath) {
  const normalizedProfilesPath = normalizePath(profilesPath);
  const emptySnapshot = buildCrashSnapshotSkeleton(normalizedProfilesPath);

  if (!normalizedProfilesPath || !(await pathExists(normalizedProfilesPath))) {
    return {
      ...emptySnapshot,
      analysis: {
        ...emptySnapshot.analysis,
        severity: "warning",
        summary: "Profiles folder is missing or was not selected.",
        probableCause: "Crash Tools needs a valid DayZ Server profiles path.",
        recommendations: [
          "Set the correct Profiles path in DayZ Server Settings and refresh Crash Tools.",
        ],
      },
    };
  }

  let entries = [];

  try {
    entries = await fsp.readdir(normalizedProfilesPath, { withFileTypes: true });
  } catch {
    return emptySnapshot;
  }

  const artifactEntries = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const kind = classifyCrashArtifact(entry.name);

        if (!kind) {
          return null;
        }

        const filePath = path.join(normalizedProfilesPath, entry.name);
        const stats = await fsp.stat(filePath);

        return {
          id: `${kind}-${entry.name.toLowerCase()}`,
          kind,
          name: entry.name,
          path: filePath,
          sizeBytes: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        };
      }),
  );

  const artifacts = artifactEntries
    .filter(Boolean)
    .sort((left, right) => new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime());

  const latest = {
    rpt: artifacts.find((artifact) => artifact.kind === "rpt") ?? null,
    script: artifacts.find((artifact) => artifact.kind === "script") ?? null,
    crash: artifacts.find((artifact) => artifact.kind === "crash") ?? null,
    mdmp: artifacts.find((artifact) => artifact.kind === "mdmp") ?? null,
  };

  const [latestRptRaw, latestScriptRaw, latestCrashRaw] = await Promise.all([
    latest.rpt ? readOptionalFile(latest.rpt.path) : Promise.resolve(null),
    latest.script ? readOptionalFile(latest.script.path) : Promise.resolve(null),
    latest.crash ? readOptionalFile(latest.crash.path) : Promise.resolve(null),
  ]);

  return {
    profilesPath: normalizedProfilesPath,
    artifacts,
    latest,
    excerpts: {
      rpt: buildCrashExcerpt(latestRptRaw),
      script: buildCrashExcerpt(latestScriptRaw),
      crash: buildCrashExcerpt(latestCrashRaw),
    },
    analysis: analyzeCrashArtifacts({
      rptText: latestRptRaw,
      scriptText: latestScriptRaw,
      crashText: latestCrashRaw,
      hasDump: Boolean(latest.mdmp),
    }),
  };
}

function parseWorkshopManifestItems(text) {
  const items = new Map();
  const lines = text.split(/\r?\n/);
  let inInstalledBlock = false;
  let installedDepth = 0;
  let pendingWorkshopId = "";
  let currentWorkshopId = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (!inInstalledBlock) {
      if (trimmed === '"WorkshopItemsInstalled"') {
        inInstalledBlock = true;
      }
      continue;
    }

    if (trimmed === "{") {
      installedDepth += 1;

      if (installedDepth === 2 && pendingWorkshopId) {
        currentWorkshopId = pendingWorkshopId;
        items.set(currentWorkshopId, {});
        pendingWorkshopId = "";
      }

      continue;
    }

    if (trimmed === "}") {
      if (installedDepth === 2) {
        currentWorkshopId = "";
      }

      installedDepth -= 1;

      if (installedDepth <= 0) {
        break;
      }

      continue;
    }

    const pairMatch = trimmed.match(/^"([^"]+)"\s*"([^"]*)"$/);
    const singleValueMatch = trimmed.match(/^"(\d+)"$/);

    if (installedDepth === 1 && singleValueMatch) {
      pendingWorkshopId = singleValueMatch[1];
      continue;
    }

    if (installedDepth === 2 && pairMatch && currentWorkshopId) {
      const currentItem = items.get(currentWorkshopId);
      currentItem[pairMatch[1].toLowerCase()] = pairMatch[2];
    }
  }

  return items;
}

async function readWorkshopManifest(workshopRoot) {
  const manifestPath = path.join(workshopRoot, "..", "..", "appworkshop_221100.acf");
  const rawManifest = await readOptionalFile(manifestPath);

  if (!rawManifest) {
    return new Map();
  }

  return parseWorkshopManifestItems(rawManifest);
}

function normalizeWorkshopTimestamp(value) {
  if (!value) {
    return "";
  }

  const unixSeconds = Number.parseInt(String(value), 10);

  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return "";
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function collectDirectoryStats(rootPath) {
  let totalSize = 0;
  let createdAt = null;
  let updatedAt = null;
  let pboCount = 0;
  let signedPboCount = 0;

  async function walk(currentPath) {
    let entries = [];

    try {
      entries = await fsp.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    const names = entries.map((entry) => entry.name);

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const stats = await fsp.stat(fullPath);

      if (!createdAt || stats.birthtime < createdAt) {
        createdAt = stats.birthtime;
      }

      if (!updatedAt || stats.mtime > updatedAt) {
        updatedAt = stats.mtime;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      totalSize += stats.size;

      if (entry.name.toLowerCase().endsWith(".pbo")) {
        pboCount += 1;
        const fileStem = entry.name.slice(0, -4).toLowerCase();
        const hasBisign = names.some(
          (name) =>
            name.toLowerCase().startsWith(`${fileStem}.`) &&
            name.toLowerCase().endsWith(".bisign"),
        );

        if (hasBisign) {
          signedPboCount += 1;
        }
      }
    }
  }

  await walk(rootPath);

  return {
    sizeBytes: totalSize,
    createdAt: createdAt ? createdAt.toISOString() : "",
    updatedAt: updatedAt ? updatedAt.toISOString() : "",
    pboCount,
    signedPboCount,
    isFullySigned: pboCount > 0 && pboCount === signedPboCount,
  };
}

async function parseDayzMod(modRoot, source, extras = {}) {
  const { workshopItem, ...restExtras } = extras;
  const folderName = path.basename(modRoot);
  const [modCpp, metaCpp, hasAddonsDir, hasKeysDir, stats] = await Promise.all([
    readOptionalFile(path.join(modRoot, "mod.cpp")),
    readOptionalFile(path.join(modRoot, "meta.cpp")),
    pathExists(path.join(modRoot, "addons")),
    pathExists(path.join(modRoot, "keys")),
    collectDirectoryStats(modRoot),
  ]);

  const modData = modCpp ? parseSimpleCfg(modCpp) : {};
  const metaData = metaCpp ? parseSimpleCfg(metaCpp) : {};
  const workshopUpdatedAt = normalizeWorkshopTimestamp(workshopItem?.latest_timeupdated || workshopItem?.timeupdated);
  const author = pickFirstNonEmpty(
    modData.author,
    metaData.author,
    modData.authors,
    metaData.authors,
    modData.creator,
    metaData.creator,
  );

  return {
    id: `${source.toLowerCase()}-${folderName.toLowerCase()}`,
    name: folderName,
    displayName: modData.name || metaData.name || folderName,
    source,
    state: hasAddonsDir ? "Detected" : "Incomplete",
    enabled: false,
    launchMode: source === "Server Root" ? "serverMod" : "mod",
    path: modRoot,
    hasAddonsDir,
    hasKeysDir,
    version: modData.version || metaData.version || "",
    author,
    createdAt: source === "Workshop" ? "" : stats.createdAt,
    updatedAt: source === "Workshop" ? workshopUpdatedAt || stats.updatedAt : stats.updatedAt,
    sizeBytes: Number.parseInt(workshopItem?.size || "", 10) || stats.sizeBytes,
    pboCount: stats.pboCount,
    signedPboCount: stats.signedPboCount,
    isFullySigned: stats.isFullySigned,
    ...restExtras,
  };
}

async function isLikelyModRoot(candidateRoot) {
  const [hasModCpp, hasMetaCpp, hasAddonsDir] = await Promise.all([
    pathExists(path.join(candidateRoot, "mod.cpp")),
    pathExists(path.join(candidateRoot, "meta.cpp")),
    pathExists(path.join(candidateRoot, "addons")),
  ]);

  return hasModCpp || hasMetaCpp || hasAddonsDir;
}

async function resolveWorkshopItemModRoots(workshopItemRoot) {
  if (await isLikelyModRoot(workshopItemRoot)) {
    return [workshopItemRoot];
  }

  let entries = [];

  try {
    entries = await fsp.readdir(workshopItemRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const childDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(workshopItemRoot, entry.name));

  const resolvedRoots = [];

  for (const childDir of childDirs) {
    if (await isLikelyModRoot(childDir)) {
      resolvedRoots.push(childDir);
    }
  }

  return resolvedRoots;
}

async function scanDayzServerMods(serverRoot) {
  const normalizedRoot = normalizePath(serverRoot);

  if (!normalizedRoot) {
    return [];
  }

  if (await isLikelyModRoot(normalizedRoot)) {
    return [await parseDayzMod(normalizedRoot, "Server Root")];
  }

  let entries = [];

  try {
    entries = await fsp.readdir(normalizedRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const modFolders = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const modRoot = path.join(normalizedRoot, entry.name);

    if (entry.name.startsWith("@") || (await isLikelyModRoot(modRoot))) {
      modFolders.push(modRoot);
    }
  }

  const mods = await Promise.all(modFolders.map((modRoot) => parseDayzMod(modRoot, "Server Root")));
  return mods.sort((left, right) => left.name.localeCompare(right.name, "en"));
}

async function resolveWorkshopRoots(serverRoot) {
  const candidates = new Set([
    "C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\221100",
  ]);

  for (let code = 67; code <= 90; code += 1) {
    const driveLetter = String.fromCharCode(code);
    candidates.add(`${driveLetter}:\\SteamLibrary\\steamapps\\workshop\\content\\221100`);
  }

  const normalizedRoot = normalizePath(serverRoot);

  if (normalizedRoot) {
    const parts = normalizedRoot.split(path.sep);

    if (parts.length >= 4) {
      const steamappsIndex = parts.findIndex((part) => part.toLowerCase() === "steamapps");

      if (steamappsIndex >= 0) {
        const base = parts.slice(0, steamappsIndex + 1).join(path.sep);
        candidates.add(path.join(base, "workshop", "content", "221100"));
      }
    }
  }

  const roots = [];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      roots.push(normalizePath(candidate));
    }
  }

  return roots;
}

async function scanMissions(missionsRoot) {
  const normalizedRoot = normalizePath(missionsRoot);

  if (!normalizedRoot) {
    return [];
  }

  let entries = [];

  try {
    entries = await fsp.readdir(normalizedRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const missionDirs = entries.filter((entry) => entry.isDirectory());
  const missions = await Promise.all(
    missionDirs.map(async (entry) => {
      const missionPath = path.join(normalizedRoot, entry.name);
      const [hasInitFile, hasDbFolder, hasCfgEconomyCore, childEntries] = await Promise.all([
        pathExists(path.join(missionPath, "init.c")),
        pathExists(path.join(missionPath, "db")),
        pathExists(path.join(missionPath, "cfgeconomycore.xml")),
        fsp.readdir(missionPath, { withFileTypes: true }).catch(() => []),
      ]);
      const nameParts = entry.name.split(".");

      return {
        id: `mission-${entry.name.toLowerCase()}`,
        name: entry.name,
        path: missionPath,
        mapName: nameParts[nameParts.length - 1] || entry.name,
        hasInitFile,
        hasDbFolder,
        hasCfgEconomyCore,
        fileCount: childEntries.length,
      };
    }),
  );

  return missions.sort((left, right) => left.name.localeCompare(right.name, "en"));
}

async function scanWorkshopMods(serverRoot) {
  const workshopRoots = await resolveWorkshopRoots(serverRoot);
  const mods = [];

  for (const workshopRoot of workshopRoots) {
    const workshopManifest = await readWorkshopManifest(workshopRoot);
    let entries = [];

    try {
      entries = await fsp.readdir(workshopRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    const workshopFolders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        root: path.join(workshopRoot, entry.name),
        workshopId: entry.name,
      }));

    for (const folder of workshopFolders) {
      const modRoots = await resolveWorkshopItemModRoots(folder.root);
      const workshopItem = workshopManifest.get(folder.workshopId) || null;

      for (const modRoot of modRoots) {
        const parsed = await parseDayzMod(modRoot, "Workshop", {
          workshopId: folder.workshopId,
          id: `workshop-${folder.workshopId}-${path.basename(modRoot).toLowerCase()}`,
          workshopItem,
        });
        mods.push(parsed);
      }
    }
  }

  const uniqueByPath = new Map(mods.map((mod) => [mod.path.toLowerCase(), mod]));
  return [...uniqueByPath.values()].sort((left, right) => left.name.localeCompare(right.name, "en"));
}

async function inspectModFolder(modRoot) {
  const normalizedRoot = normalizePath(modRoot);

  if (!normalizedRoot) {
    throw new Error("Local mod path is required.");
  }

  if (!(await pathExists(normalizedRoot))) {
    throw new Error("Selected mod folder does not exist.");
  }

  return parseDayzMod(normalizedRoot, "Local Import");
}

function broadcast(channel, payload) {
  emitEvent(channel, payload);
}

function createClientRuntimeSnapshot() {
  return {
    status: "stopped",
    pid: null,
    startedAt: null,
    executablePath: null,
    launchArgs: [],
  };
}

function createLogEntry(line, level = "info") {
  logSequence += 1;

  return {
    id: `${Date.now()}-${logSequence}`,
    level,
    line,
    timestamp: new Date().toISOString(),
  };
}

function pushServerLog(line, level = "info") {
  const text = String(line ?? "");
  const splitLines = text
    .split(/\r?\n/)
    .map((item) => item.trimEnd())
    .filter(Boolean);

  if (splitLines.length === 0) {
    return;
  }

  for (const entryLine of splitLines) {
    const entry = createLogEntry(entryLine, level);

    serverRuntime.logs = [...serverRuntime.logs, entry].slice(-MAX_LOG_LINES);
    broadcast("dayz:server-log", entry);
  }
}

function setServerRuntime(patch) {
  serverRuntime = {
    ...serverRuntime,
    ...patch,
  };

  broadcast("dayz:server-status", serverRuntime);
  return serverRuntime;
}

function setClientRuntime(patch) {
  clientRuntime = {
    ...clientRuntime,
    ...patch,
  };

  broadcast("dayz:client-status", clientRuntime);
  return clientRuntime;
}

function attachServerProcess(processHandle) {
  processHandle.stdout?.on("data", (chunk) => {
    pushServerLog(chunk, "stdout");
  });

  processHandle.stderr?.on("data", (chunk) => {
    pushServerLog(chunk, "stderr");
  });

  processHandle.on("error", (error) => {
    pushServerLog(`[launcher] Failed to start server: ${error.message}`, "stderr");
    serverProcess = null;
    setServerRuntime({
      status: "stopped",
      pid: null,
      startedAt: null,
      executablePath: null,
    });
  });

  processHandle.on("exit", (code, signal) => {
    pushServerLog(
      `[launcher] Server process stopped${code !== null ? ` with code ${code}` : ""}${signal ? ` (${signal})` : ""}.`,
      "info",
    );

    serverProcess = null;
    setServerRuntime({
      status: "stopped",
      pid: null,
    });
  });
}

async function killServerProcess() {
  if (!serverProcess || serverProcess.killed || serverProcess.exitCode !== null) {
    serverProcess = null;
    return setServerRuntime({
      status: "stopped",
      pid: null,
      startedAt: null,
      executablePath: null,
    });
  }

  const currentProcess = serverProcess;
  pushServerLog("[launcher] Stopping DayZ Server process...", "info");

  await new Promise((resolve, reject) => {
    const killer = spawn("taskkill", ["/pid", String(currentProcess.pid), "/t", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    });

    killer.on("error", reject);
    killer.on("exit", () => resolve());
  });

  return serverRuntime;
}

function attachClientProcess(processHandle, trackedExecutablePath, trackedArgs) {
  processHandle.on("error", (error) => {
    pushServerLog(`[client] Failed to start client: ${error.message}`, "stderr");
    clientProcess = null;
    setClientRuntime({
      status: "stopped",
      pid: null,
      startedAt: null,
      executablePath: trackedExecutablePath ?? null,
      launchArgs: trackedArgs ?? [],
    });
  });

  processHandle.on("exit", (code, signal) => {
    pushServerLog(
      `[client] DayZ client stopped${code !== null ? ` with code ${code}` : ""}${signal ? ` (${signal})` : ""}.`,
      "info",
    );

    clientProcess = null;
    setClientRuntime({
      status: "stopped",
      pid: null,
      startedAt: null,
    });
  });
}

async function killClientProcess() {
  const trackedProcess = clientProcess;
  const trackedExecutableName = path.basename(clientRuntime.executablePath || "").trim();
  const imageNames = Array.from(
    new Set(
      [trackedExecutableName, "DayZ_x64.exe", "DayZ.exe", "DayZ_BE.exe"].filter(Boolean),
    ),
  );

  pushServerLog("[client] Stopping DayZ client process...", "info");

  if (trackedProcess && !trackedProcess.killed && trackedProcess.exitCode === null) {
    await new Promise((resolve, reject) => {
      const killer = spawn("taskkill", ["/pid", String(trackedProcess.pid), "/t", "/f"], {
        windowsHide: true,
        stdio: "ignore",
      });

      killer.on("error", reject);
      killer.on("exit", () => resolve());
    });
  }

  await killProcessesByImageNames(imageNames);

  clientProcess = null;
  return setClientRuntime({
    status: "stopped",
    pid: null,
    startedAt: null,
    executablePath: null,
    launchArgs: [],
  });
}

async function killProcessesByImageNames(imageNames = []) {
  for (const imageName of imageNames.filter(Boolean)) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/im", imageName, "/t", "/f"], {
        windowsHide: true,
        stdio: "ignore",
      });

      killer.once("error", () => resolve());
      killer.once("exit", () => resolve());
    });
  }
}

async function startServer(options = {}) {
  const serverRoot = normalizePath(options.serverRoot);

  if (!serverRoot) {
    throw new Error("DayZ Server root path is required.");
  }

  if (serverProcess && serverProcess.exitCode === null) {
    return serverRuntime;
  }

  const detected = await detectServerPaths(serverRoot);
  const executablePath = detected.executablePath;

  if (!executablePath) {
    throw new Error("Could not find DayZServer_x64.exe or DayZServer.exe in the selected server root.");
  }

  const profilesPath = normalizePath(options.profilesPath) || detected.profiles;
  const battleyePath = normalizePath(options.battleyePath) || detected.battleye;
  const enableBattleye = options.enableBattleye !== false;
  const configPath = normalizePath(options.configPath) || detected.configPath;
  const mods = Array.isArray(options.mods) ? options.mods.filter(Boolean) : [];
  const serverModPaths = Array.isArray(options.serverModPaths) ? options.serverModPaths.filter(Boolean) : [];
  const executableName = path.basename(executablePath);

  await killProcessesByImageNames([executableName]);

  const args = [];

  if (configPath) {
    args.push(`-config=${configPath}`);
  }

  if (profilesPath) {
    args.push(`-profiles=${profilesPath}`);
  }

  if (mods.length > 0) {
    args.push(`-mod=${mods.join(";")}`);
  }

  if (serverModPaths.length > 0) {
    args.push(`-serverMod=${serverModPaths.join(";")}`);
  }

  if (enableBattleye && battleyePath) {
    args.push(`-BEpath=${battleyePath}`);
  }

  pushServerLog(`[launcher] Launching ${path.basename(executablePath)} from ${serverRoot}`, "info");
  pushServerLog(`[launcher] Launch arguments: ${args.join(" ")}`, "info");
  pushServerLog(`[launcher] Working directory: ${serverRoot}`, "info");
  pushServerLog(`[launcher] Config path: ${configPath || "not provided"}`, "info");
  pushServerLog(`[launcher] Profiles path: ${profilesPath || "default"}`, "info");
  pushServerLog(
    `[launcher] BattlEye: ${enableBattleye ? `enabled (${battleyePath || "default"})` : "disabled"}`,
    "info",
  );
  pushServerLog(
    `[launcher] Mods (${mods.length}): ${mods.length > 0 ? mods.join(";") : "none"}`,
    "info",
  );
  pushServerLog(
    `[launcher] Server Mods (${serverModPaths.length}): ${serverModPaths.length > 0 ? serverModPaths.join(";") : "none"}`,
    "info",
  );

  setServerRuntime({
    status: "starting",
    startedAt: new Date().toISOString(),
    executablePath,
    launchArgs: args,
  });

  serverProcess = spawn(executablePath, args, {
    cwd: serverRoot,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  attachServerProcess(serverProcess);

  setServerRuntime({
    status: "running",
    pid: serverProcess.pid ?? null,
    startedAt: new Date().toISOString(),
    executablePath,
    launchArgs: args,
  });

  return serverRuntime;
}

async function restartServer(options = {}) {
  await killServerProcess();
  return startServer(options);
}

async function launchDayzClient(options = {}) {
  if (clientProcess && clientProcess.exitCode === null) {
    return {
      executablePath: clientRuntime.executablePath || "",
      args: clientRuntime.launchArgs,
    };
  }

  const executablePath = normalizePath(options.executablePath) || (await resolveClientExecutable());

  if (!executablePath) {
    throw new Error("Could not find DayZ client executable in the standard Steam locations.");
  }

  const serverAddress = options.serverAddress || "127.0.0.1";
  const serverPort = String(options.serverPort || 2302);
  const mods = Array.isArray(options.mods) ? options.mods.filter(Boolean).map(normalizePath) : [];
  const enableBattleye = options.enableBattleye !== false;
  const displayMode = options.displayMode === "fullscreen" ? "fullscreen" : "windowed";
  const resolutionWidth = Number.parseInt(String(options.resolutionWidth || 0), 10);
  const resolutionHeight = Number.parseInt(String(options.resolutionHeight || 0), 10);
  const dayzArgs = [`-connect=${serverAddress}`, `-port=${serverPort}`];
  const executableDir = path.dirname(executablePath);
  const executableName = path.basename(executablePath);
  const battleyeExecutablePath = path.join(executableDir, "DayZ_BE.exe");
  const useBattleyeBootstrap = await pathExists(battleyeExecutablePath);

  await killProcessesByImageNames([executableName, "DayZ_x64.exe", "DayZ.exe", "DayZ_BE.exe"]);

  if (mods.length > 0) {
    dayzArgs.push(`-mod=${mods.join(";")}`);
  }

  if (Number.isFinite(resolutionWidth) && resolutionWidth > 0) {
    dayzArgs.push(`-width=${resolutionWidth}`);
  }

  if (Number.isFinite(resolutionHeight) && resolutionHeight > 0) {
    dayzArgs.push(`-height=${resolutionHeight}`);
  }

  dayzArgs.push(displayMode === "fullscreen" ? "-fullscreen" : "-window");

  if (enableBattleye) {
    dayzArgs.push("-useBE");
  }

  pushServerLog(`[client] Preparing DayZ client launch to ${serverAddress}:${serverPort}`, "info");
  pushServerLog(`[client] Display mode: ${displayMode}`, "info");
  pushServerLog(
    `[client] Resolution: ${resolutionWidth > 0 && resolutionHeight > 0 ? `${resolutionWidth}x${resolutionHeight}` : "default"}`,
    "info",
  );
  pushServerLog(
    `[client] Mods (${mods.length}): ${mods.length > 0 ? mods.join(";") : "none"}`,
    "info",
  );
  pushServerLog(`[client] BattlEye: ${enableBattleye ? "enabled" : "disabled"}`, "info");

  setClientRuntime({
    status: "launching",
    pid: null,
    startedAt: new Date().toISOString(),
    executablePath: useBattleyeBootstrap ? battleyeExecutablePath : executablePath,
    launchArgs: useBattleyeBootstrap ? ["-exe", path.basename(executablePath), ...dayzArgs] : dayzArgs,
  });

  await writeDayzClientDisplayConfig({
    displayMode,
    resolutionWidth,
    resolutionHeight,
  });

  if (enableBattleye) {
    try {
      await runBattleyeInstaller(executableDir);
    } catch {
      // Do not block launch if the installer returns a non-zero code.
    }
  }

  if (useBattleyeBootstrap) {
    const bootstrapArgs = ["-exe", path.basename(executablePath), ...dayzArgs];
    pushServerLog(`[client] Bootstrap executable: ${battleyeExecutablePath}`, "info");
    pushServerLog(`[client] Bootstrap arguments: ${bootstrapArgs.join(" ")}`, "info");

    clientProcess = spawn(battleyeExecutablePath, bootstrapArgs, {
      cwd: executableDir,
      windowsHide: false,
      stdio: "ignore",
      env: {
        ...process.env,
        SteamAppId: "221100",
        SteamGameId: "221100",
      },
    });

    attachClientProcess(clientProcess, battleyeExecutablePath, bootstrapArgs);
    setClientRuntime({
      status: "running",
      pid: clientProcess.pid ?? null,
      startedAt: new Date().toISOString(),
      executablePath: battleyeExecutablePath,
      launchArgs: bootstrapArgs,
    });

    return {
      executablePath: battleyeExecutablePath,
      args: bootstrapArgs,
    };
  }

  clientProcess = spawn(executablePath, dayzArgs, {
    cwd: executableDir,
    windowsHide: false,
    stdio: "ignore",
    env: {
      ...process.env,
      SteamAppId: "221100",
      SteamGameId: "221100",
    },
  });

  pushServerLog(`[client] Direct executable: ${executablePath}`, "info");
  pushServerLog(`[client] Direct arguments: ${dayzArgs.join(" ")}`, "info");

  attachClientProcess(clientProcess, executablePath, dayzArgs);
  setClientRuntime({
    status: "running",
    pid: clientProcess.pid ?? null,
    startedAt: new Date().toISOString(),
    executablePath,
    launchArgs: dayzArgs,
  });

  return {
    executablePath,
    args: dayzArgs,
  };
}

async function readServerConfig(configPath) {
  const normalizedPath = normalizePath(configPath);

  if (!normalizedPath) {
    return {
      path: "",
      raw: "",
      parsed: {},
      modTokens: [],
    };
  }

  if (!(await pathExists(normalizedPath))) {
    return {
      path: normalizedPath,
      raw: "",
      parsed: {},
      modTokens: [],
    };
  }

  const raw = await fsp.readFile(normalizedPath, "utf8");
  const parsed = parseSimpleCfg(raw);

  return {
    path: normalizedPath,
    raw,
    parsed,
    modTokens: extractModTokensFromText(raw),
  };
}

async function writeServerConfig(options = {}) {
  const serverRoot = normalizePath(options.serverRoot);
  const explicitConfigPath = normalizePath(options.configPath);
  const detectedConfigPath = explicitConfigPath || (serverRoot ? await resolveConfigPath(serverRoot) : "");
  const targetPath = detectedConfigPath || (serverRoot ? path.join(serverRoot, "serverDZ.cfg") : "");

  if (!targetPath) {
    throw new Error("Could not resolve a target server config path.");
  }

  const currentSnapshot = await readServerConfig(targetPath);
  const nextRaw = applyManagedServerConfig(currentSnapshot.raw, options.values ?? {});

  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  await fsp.writeFile(targetPath, nextRaw, "utf8");

  return readServerConfig(targetPath);
}

const handlers = {
  "dayz:detect-client-executable": () => resolveClientExecutable(),
  "dayz:detect-server-paths": (serverRoot) => detectServerPaths(serverRoot),
  "dayz:auto-detect-server-paths": () => autoDetectServerPaths(),
  "dayz:get-runtime": () => serverRuntime,
  "dayz:get-client-runtime": () => clientRuntime,
  "dayz:start-server": (options) => startServer(options),
  "dayz:stop-server": () => killServerProcess(),
  "dayz:restart-server": (options) => restartServer(options),
  "dayz:read-server-config": (configPath) => readServerConfig(configPath),
  "dayz:write-server-config": (options) => writeServerConfig(options),
  "dayz:scan-missions": (missionsRoot) => scanMissions(missionsRoot),
  "dayz:read-mission-session-settings": (missionPath) => readMissionSessionSettings(missionPath),
  "dayz:preview-init-generator": (request) => previewInitGenerator(request),
  "dayz:backup-init-generator": (request) => backupInitGenerator(request),
  "dayz:apply-init-generator": (request) => applyInitGenerator(request),
  "dayz:scan-mods": (serverRoot) => scanDayzServerMods(serverRoot),
  "dayz:scan-workshop-mods": (serverRoot) => scanWorkshopMods(serverRoot),
  "dayz:inspect-mod-folder": (modRoot) => inspectModFolder(modRoot),
  "dayz:scan-crash-tools": (profilesPath) => scanCrashTools(profilesPath),
  "dayz:launch-client": (options) => launchDayzClient(options),
  "dayz:stop-client": () => killClientProcess(),
  "dayz:get-workspace-state": () => readWorkspaceState(),
  "dayz:save-workspace-state": (state) => saveWorkspaceState(state),
};

async function dispatchMessage(message) {
  const { id, method, args = [] } = message ?? {};

  if (!id || !method) {
    emitMessage({
      id: id ?? null,
      error: "Invalid RPC payload. Expected { id, method, args }.",
    });
    return;
  }

  const handler = handlers[method];

  if (!handler) {
    emitMessage({ id, error: `Unknown method: ${method}` });
    return;
  }

  try {
    const result = await handler(...args);
    emitMessage({ id, result });
  } catch (error) {
    emitMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function setupRpcTransport() {
  process.stdin.setEncoding("utf8");

  const input = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  input.on("line", (line) => {
    if (!line.trim()) {
      return;
    }

    let message = null;

    try {
      message = JSON.parse(line);
    } catch {
      emitMessage({
        id: null,
        error: "Failed to parse backend RPC payload as JSON.",
      });
      return;
    }

    void dispatchMessage(message);
  });
}

async function shutdown() {
  try {
    await killClientProcess().catch(() => undefined);
    await killServerProcess().catch(() => undefined);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

setupRpcTransport();

if (!process.stdin.readable && fs.existsSync(__filename)) {
  emitMessage({ event: "backend:ready", payload: true });
}
