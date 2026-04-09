export function createPreferredModTokens({
  configModTokens,
  persistedEnabledModPaths,
  runtimeLaunchArgs,
  serverMods,
}: {
  configModTokens: string[];
  persistedEnabledModPaths: string[];
  runtimeLaunchArgs: string[];
  serverMods: DayzParsedMod[];
}) {
  const runtimeTokens = runtimeLaunchArgs
    .filter((argument) => argument.startsWith("-mod=") || argument.startsWith("-serverMod="))
    .flatMap((argument) => argument.slice(argument.indexOf("=") + 1).split(";"))
    .filter(Boolean);
  const selectedModPaths = serverMods.filter((mod) => mod.enabled).map((mod) => mod.path);

  return [
    ...new Set([
      ...configModTokens,
      ...runtimeTokens,
      ...persistedEnabledModPaths,
      ...selectedModPaths,
    ]),
  ];
}

export function parseClientResolution(resolution: string) {
  const [resolutionWidth, resolutionHeight] = resolution
    .toLowerCase()
    .split("x")
    .map((part) => Number.parseInt(part.trim(), 10));

  return { resolutionWidth, resolutionHeight };
}

export function resolveMissionsFolderPath({
  configuredMissionsPath,
  missions,
  template,
}: {
  configuredMissionsPath: string;
  missions: DayzMission[];
  template: string;
}) {
  const activeMission = missions.find((mission) => mission.name === template) ?? missions[0] ?? null;
  const activeMissionPath = (activeMission?.path ?? "").trim();
  const derivedMissionsRoot = activeMissionPath.replace(/[\\/][^\\/]+$/, "");

  return configuredMissionsPath || derivedMissionsRoot || activeMissionPath;
}
