import { defaultServerConfigValues, fallbackTerminalLines, type ServerConfigValues } from "@/components/dayz-server/constants";

export function normalizeConfigScalar(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim().replace(/;$/, "");

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function parseConfigBoolean(value: string | undefined, fallback: boolean) {
  const normalized = normalizeConfigScalar(value).toLowerCase();

  if (["1", "2", "true", "yes"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function mapConfigSnapshotToForm(parsed: Record<string, string>): ServerConfigValues {
  return {
    hostname: normalizeConfigScalar(parsed.hostname) || defaultServerConfigValues.hostname,
    password: normalizeConfigScalar(parsed.password),
    passwordAdmin: normalizeConfigScalar(parsed.passwordAdmin),
    description: normalizeConfigScalar(parsed.description),
    template: normalizeConfigScalar(parsed.template) || defaultServerConfigValues.template,
    maxPlayers: normalizeConfigScalar(parsed.maxPlayers) || defaultServerConfigValues.maxPlayers,
    enableWhitelist: parseConfigBoolean(parsed.enableWhitelist, defaultServerConfigValues.enableWhitelist),
    verifySignatures: parseConfigBoolean(parsed.verifySignatures, defaultServerConfigValues.verifySignatures),
    forceSameBuild: parseConfigBoolean(parsed.forceSameBuild, defaultServerConfigValues.forceSameBuild),
    disableVoN: parseConfigBoolean(parsed.disableVoN, defaultServerConfigValues.disableVoN),
    vonCodecQuality: normalizeConfigScalar(parsed.vonCodecQuality) || defaultServerConfigValues.vonCodecQuality,
    battlEye: parseConfigBoolean(parsed.battlEye, defaultServerConfigValues.battlEye),
    shardId: normalizeConfigScalar(parsed.shardId) || defaultServerConfigValues.shardId,
    disable3rdPerson: parseConfigBoolean(parsed.disable3rdPerson, defaultServerConfigValues.disable3rdPerson),
    disableCrosshair: parseConfigBoolean(parsed.disableCrosshair, defaultServerConfigValues.disableCrosshair),
    disablePersonalLight: parseConfigBoolean(
      parsed.disablePersonalLight,
      defaultServerConfigValues.disablePersonalLight,
    ),
    lightingConfig: normalizeConfigScalar(parsed.lightingConfig) || defaultServerConfigValues.lightingConfig,
    serverTime: normalizeConfigScalar(parsed.serverTime) || defaultServerConfigValues.serverTime,
    serverTimePersistent:
      normalizeConfigScalar(parsed.serverTimePersistent) || defaultServerConfigValues.serverTimePersistent,
    serverTimeAcceleration:
      normalizeConfigScalar(parsed.serverTimeAcceleration) || defaultServerConfigValues.serverTimeAcceleration,
    serverNightTimeAcceleration:
      normalizeConfigScalar(parsed.serverNightTimeAcceleration) ||
      defaultServerConfigValues.serverNightTimeAcceleration,
    instanceId: normalizeConfigScalar(parsed.instanceId) || defaultServerConfigValues.instanceId,
    storageAutoFix: parseConfigBoolean(parsed.storageAutoFix, defaultServerConfigValues.storageAutoFix),
    loginQueueConcurrentPlayers:
      normalizeConfigScalar(parsed.loginQueueConcurrentPlayers) ||
      defaultServerConfigValues.loginQueueConcurrentPlayers,
    loginQueueMaxPlayers:
      normalizeConfigScalar(parsed.loginQueueMaxPlayers) || defaultServerConfigValues.loginQueueMaxPlayers,
    adminLogPlayerHitsOnly: parseConfigBoolean(
      parsed.adminLogPlayerHitsOnly,
      defaultServerConfigValues.adminLogPlayerHitsOnly,
    ),
    guaranteedUpdates:
      normalizeConfigScalar(parsed.guaranteedUpdates) || defaultServerConfigValues.guaranteedUpdates,
  };
}

export function sanitizePersistedServerConfigValues(values: Record<string, unknown>) {
  return {
    ...values,
    serverTimePersistent:
      values.serverTimePersistent === "2026-03-26 12:00" ? "" : values.serverTimePersistent,
  };
}

export function normalizeModToken(value: string) {
  const trimmed = value.trim().replace(/^"+|"+$/g, "");
  const normalized = trimmed.replace(/\//g, "\\");

  if (normalized.includes("\\")) {
    return normalized.split("\\").filter(Boolean).pop()?.toLowerCase() ?? normalized.toLowerCase();
  }

  return normalized.toLowerCase();
}

export function applyEnabledTokensToMods(mods: DayzParsedMod[], tokens: string[]) {
  const enabledSet = new Set(tokens.map(normalizeModToken));

  return mods.map((mod) => {
    const candidates = [
      normalizeModToken(mod.name),
      normalizeModToken(mod.displayName),
      normalizeModToken(mod.path),
    ];

    return {
      ...mod,
      enabled: candidates.some((candidate) => enabledSet.has(candidate)),
    };
  });
}

export function formatBytes(value: number) {
  if (!value) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatTimestamp(value: string) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function matchesModSearch(mod: DayzParsedMod, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return [
    mod.displayName,
    mod.name,
    mod.author,
    mod.version,
    mod.source,
    mod.path,
    mod.workshopId ?? "",
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function getModSourceLabel(mod: DayzParsedMod) {
  return mod.source === "Workshop" ? "Workshop" : "Local";
}

export function getModSignatureLabel(mod: DayzParsedMod) {
  if (mod.pboCount === 0) {
    return "No PBOs";
  }

  return mod.isFullySigned
    ? `Signed ${mod.signedPboCount}/${mod.pboCount}`
    : `Unsigned ${mod.signedPboCount}/${mod.pboCount}`;
}

export function createFallbackRuntime(): DayzServerRuntime {
  return {
    status: "stopped",
    pid: null,
    startedAt: null,
    executablePath: null,
    launchArgs: [],
    logs: fallbackTerminalLines.map((line, index) => ({
      id: `fallback-${index}`,
      level: "info",
      line,
      timestamp: "",
    })),
  };
}
