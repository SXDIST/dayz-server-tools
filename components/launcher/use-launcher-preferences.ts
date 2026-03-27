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
  const [preferences, setPreferences] = useState<LauncherPreferences>(() => {
    if (typeof window === "undefined") {
      return defaultLauncherPreferences;
    }

    return normalizeLauncherPreferences(window.__DAYZ_LAUNCHER_BOOTSTRAP__?.preferences);
  });
  const [lastView, setLastView] = useState(() => {
    if (typeof window === "undefined") {
      return "dayz-server";
    }

    return window.__DAYZ_LAUNCHER_BOOTSTRAP__?.lastView || "dayz-server";
  });
  const [loaded, setLoaded] = useState(false);
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
      } finally {
        setLoaded(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(launcherPreferencesStorageKey, JSON.stringify(preferences));
  }, [loaded, preferences]);

  useEffect(() => {
    if (!loaded || !preferences.rememberLastView) {
      return;
    }

    window.localStorage.setItem(launcherLastViewStorageKey, lastView);
  }, [lastView, loaded, preferences.rememberLastView]);

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
      loaded,
      lastView,
      setLastView,
    }),
    [lastView, loaded, preferences],
  );

  return api;
}
