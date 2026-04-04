export type ThemeMode = "system" | "light" | "dark";
export type FontMode = "sans" | "mono";
export type SansFontId = "inter" | "geist" | "noto-sans" | "roboto";
export type MonoFontId = "jetbrains-mono" | "geist-mono";

export type LauncherPreferences = {
  themeMode: ThemeMode;
  interfaceMode: FontMode;
  interfaceSansFont: SansFontId;
  interfaceMonoFont: MonoFontId;
  headingMode: FontMode;
  headingSansFont: SansFontId;
  headingMonoFont: MonoFontId;
};

export const launcherPreferencesStorageKey = "dayz-tools.launcher-preferences";

export const defaultLauncherPreferences: LauncherPreferences = {
  themeMode: "dark",
  interfaceMode: "mono",
  interfaceSansFont: "inter",
  interfaceMonoFont: "jetbrains-mono",
  headingMode: "mono",
  headingSansFont: "geist",
  headingMonoFont: "jetbrains-mono",
};

export const sansFontOptions: { value: SansFontId; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "geist", label: "Geist" },
  { value: "noto-sans", label: "Noto Sans" },
  { value: "roboto", label: "Roboto" },
];

export const monoFontOptions: { value: MonoFontId; label: string }[] = [
  { value: "jetbrains-mono", label: "JetBrains Mono" },
  { value: "geist-mono", label: "Geist Mono" },
];

export const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export const fontModeOptions = [
  { value: "sans", label: "Sans" },
  { value: "mono", label: "Mono" },
] as const;

export function normalizeLauncherPreferences(
  value: Partial<LauncherPreferences> | null | undefined,
): LauncherPreferences {
  if (!value) {
    return defaultLauncherPreferences;
  }

  return {
    ...defaultLauncherPreferences,
    ...value,
  };
}

export function resolveFontVariable(fontId: SansFontId | MonoFontId) {
  switch (fontId) {
    case "inter":
      return "var(--font-inter)";
    case "geist":
      return "var(--font-geist)";
    case "noto-sans":
      return "var(--font-noto-sans)";
    case "roboto":
      return "var(--font-roboto)";
    case "geist-mono":
      return "var(--font-geist-mono)";
    case "jetbrains-mono":
    default:
      return "var(--font-jetbrains-mono)";
  }
}
