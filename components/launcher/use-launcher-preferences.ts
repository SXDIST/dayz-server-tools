"use client";

import { useEffect, useRef, useState } from "react";

import {
  defaultLauncherPreferences,
  launcherPreferencesStorageKey,
  normalizeLauncherPreferences,
  resolveFontVariable,
  type LauncherPreferences,
} from "@/components/launcher/preferences";

function getResolvedTheme(themeMode: LauncherPreferences["themeMode"]) {
  if (themeMode !== "system") {
    return themeMode;
  }

  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useLauncherPreferences() {
  const [preferences, setPreferences] = useState<LauncherPreferences>(() => {
    if (typeof window === "undefined") {
      return defaultLauncherPreferences;
    }

    return normalizeLauncherPreferences(window.__DAYZ_LAUNCHER_BOOTSTRAP__?.preferences);
  });
  const [loaded] = useState(typeof window !== "undefined");
  const hasHydratedRef = useRef(false);
  const fontSignatureRef = useRef("");

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(launcherPreferencesStorageKey, JSON.stringify(preferences));
  }, [loaded, preferences]);

  useEffect(() => {
    const root = document.documentElement;
    let cleanupTimeoutId: number | undefined;

    const applyTheme = () => {
      root.dataset.themeSwitching = "true";
      const resolvedTheme = getResolvedTheme(preferences.themeMode);
      root.classList.toggle("dark", resolvedTheme === "dark");
      root.classList.toggle("light", resolvedTheme === "light");

      window.clearTimeout(cleanupTimeoutId);
      cleanupTimeoutId = window.setTimeout(() => {
        delete root.dataset.themeSwitching;
      }, 80);
    };

    applyTheme();

    if (preferences.themeMode !== "system") {
      return () => {
        window.clearTimeout(cleanupTimeoutId);
        delete root.dataset.themeSwitching;
      };
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme();
    media.addEventListener("change", listener);
    return () => {
      media.removeEventListener("change", listener);
      window.clearTimeout(cleanupTimeoutId);
      delete root.dataset.themeSwitching;
    };
  }, [preferences.themeMode]);

  useEffect(() => {
    const root = document.documentElement;

    const interfaceFont =
      preferences.interfaceMode === "mono"
        ? resolveFontVariable(preferences.interfaceMonoFont)
        : resolveFontVariable(preferences.interfaceSansFont);

    const monoFont = resolveFontVariable(preferences.interfaceMonoFont);

    const headingFont =
      preferences.headingMode === "mono"
        ? resolveFontVariable(preferences.headingMonoFont)
        : resolveFontVariable(preferences.headingSansFont);

    const nextFontSignature = [
      preferences.interfaceMode,
      preferences.interfaceSansFont,
      preferences.interfaceMonoFont,
      preferences.headingMode,
      preferences.headingSansFont,
      preferences.headingMonoFont,
    ].join("|");

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      fontSignatureRef.current = nextFontSignature;
      root.style.setProperty("--app-font-sans", interfaceFont);
      root.style.setProperty("--app-font-mono", monoFont);
      root.style.setProperty("--app-font-heading", headingFont);
      return;
    }

    if (fontSignatureRef.current === nextFontSignature) {
      root.style.setProperty("--app-font-sans", interfaceFont);
      root.style.setProperty("--app-font-mono", monoFont);
      root.style.setProperty("--app-font-heading", headingFont);
      return;
    }

    fontSignatureRef.current = nextFontSignature;
    root.dataset.fontTransition = "true";
    const swapTimeoutId = window.setTimeout(() => {
      root.style.setProperty("--app-font-sans", interfaceFont);
      root.style.setProperty("--app-font-mono", monoFont);
      root.style.setProperty("--app-font-heading", headingFont);
    }, 90);
    const clearTimeoutId = window.setTimeout(() => {
      delete root.dataset.fontTransition;
    }, 220);

    return () => {
      window.clearTimeout(swapTimeoutId);
      window.clearTimeout(clearTimeoutId);
      delete root.dataset.fontTransition;
    };
  }, [preferences]);

  return {
    preferences,
    setPreferences,
    loaded,
  };
}
