"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  defaultLauncherPreferences,
  launcherLastViewStorageKey,
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
  const [preferences, setPreferences] = useState<LauncherPreferences>(defaultLauncherPreferences);
  const [lastView, setLastView] = useState("dayz-server");
  const hasHydratedRef = useRef(false);
  const fontSignatureRef = useRef("");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      try {
        const rawPreferences = window.localStorage.getItem(launcherPreferencesStorageKey);
        const rawLastView = window.localStorage.getItem(launcherLastViewStorageKey);

        if (rawPreferences) {
          setPreferences(normalizeLauncherPreferences(JSON.parse(rawPreferences)));
        }

        if (rawLastView) {
          setLastView(rawLastView);
        }
      } catch {
        setPreferences(defaultLauncherPreferences);
        setLastView("dayz-server");
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(launcherPreferencesStorageKey, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!preferences.rememberLastView) {
      return;
    }

    window.localStorage.setItem(launcherLastViewStorageKey, lastView);
  }, [lastView, preferences.rememberLastView]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const resolvedTheme = getResolvedTheme(preferences.themeMode);
      root.classList.toggle("dark", resolvedTheme === "dark");
      root.classList.toggle("light", resolvedTheme === "light");
    };

    applyTheme();

    if (preferences.themeMode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [preferences.themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reduceMotion = preferences.reduceMotion ? "true" : "false";
    root.dataset.compactSidebar = preferences.compactSidebar ? "true" : "false";

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

  const api = useMemo(
    () => ({
      preferences,
      setPreferences,
      loaded: true,
      lastView,
      setLastView,
    }),
    [lastView, preferences],
  );

  return api;
}
