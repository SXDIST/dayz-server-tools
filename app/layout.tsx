import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "DayZ Tools Launcher",
  description: "Desktop launcher for DayZ server and content tools",
};

const desktopBridgeScript = `
(() => {
  const getApp = () => window.go?.main?.App;
  const getRuntime = () => window.runtime;
  const listenerRegistry = new Map();

  const invoke = (method, ...args) => {
    const fn = getApp()?.[method];

    if (typeof fn !== "function") {
      return Promise.reject(new Error("Wails bridge is unavailable."));
    }

    return fn(...args);
  };

  const subscribe = (eventName, callback) => {
    const runtime = getRuntime();

    if (!runtime?.EventsOn || typeof callback !== "function") {
      return () => {};
    }

    let entry = listenerRegistry.get(eventName);

    if (!entry) {
      const callbacks = new Set();
      const handler = (payload) => {
        callbacks.forEach((listener) => {
          try {
            listener(payload);
          } catch {}
        });
      };

      runtime.EventsOn(eventName, handler);
      entry = { callbacks, handler };
      listenerRegistry.set(eventName, entry);
    }

    entry.callbacks.add(callback);

    return () => {
      const current = listenerRegistry.get(eventName);

      if (!current) {
        return;
      }

      current.callbacks.delete(callback);

      if (current.callbacks.size === 0) {
        getRuntime()?.EventsOff?.(eventName);
        listenerRegistry.delete(eventName);
      }
    };
  };

  window.desktopBridge = {
    platform: navigator.platform || "unknown",
    isElectron: !!getApp(),
    app: {
      minimizeWindow: () => invoke("AppMinimizeWindow"),
      toggleMaximizeWindow: () => invoke("AppToggleMaximizeWindow"),
      closeWindow: () => invoke("AppCloseWindow"),
    },
    dayz: {
      pickFolder: (options) => invoke("DayzPickFolder", options || {}),
      pickExecutable: (options) => invoke("DayzPickExecutable", options || {}),
      detectClientExecutable: () => invoke("DayzDetectClientExecutable"),
      detectServerPaths: (serverRoot) => invoke("DayzDetectServerPaths", serverRoot),
      autoDetectServerPaths: () => invoke("DayzAutoDetectServerPaths"),
      getServerRuntime: () => invoke("DayzGetServerRuntime"),
      getClientRuntime: () => invoke("DayzGetClientRuntime"),
      startServer: (options) => invoke("DayzStartServer", options),
      stopServer: () => invoke("DayzStopServer"),
      restartServer: (options) => invoke("DayzRestartServer", options),
      readServerConfig: (configPath) => invoke("DayzReadServerConfig", configPath),
      writeServerConfig: (options) => invoke("DayzWriteServerConfig", options),
      scanMissions: (missionsRoot) => invoke("DayzScanMissions", missionsRoot),
      readMissionSessionSettings: (missionPath) => invoke("DayzReadMissionSessionSettings", missionPath),
      previewInitGenerator: (request) => invoke("DayzPreviewInitGenerator", request),
      backupInitGenerator: (request) => invoke("DayzBackupInitGenerator", request),
      applyInitGenerator: (request) => invoke("DayzApplyInitGenerator", request),
      scanMods: (serverRoot) => invoke("DayzScanMods", serverRoot),
      scanWorkshopMods: (serverRoot) => invoke("DayzScanWorkshopMods", serverRoot),
      inspectModFolder: (modRoot) => invoke("DayzInspectModFolder", modRoot),
      scanCrashTools: (profilesPath) => invoke("DayzScanCrashTools", profilesPath),
      openPath: (targetPath) => invoke("DayzOpenPath", targetPath),
      launchClient: (options) => invoke("DayzLaunchClient", options),
      stopClient: () => invoke("DayzStopClient"),
      getWorkspaceState: () => invoke("DayzGetWorkspaceState"),
      saveWorkspaceState: (state) => invoke("DayzSaveWorkspaceState", state),
      onServerLog: (callback) => subscribe("dayz:server-log", callback),
      onServerStatus: (callback) => subscribe("dayz:server-status", callback),
      onClientStatus: (callback) => subscribe("dayz:client-status", callback),
    },
  };
})();
`;

const launcherBootstrapScript = `
(() => {
  try {
    const storageKey = "dayz-tools.launcher-preferences";
    const lastViewKey = "dayz-tools.last-view";
    const defaults = {
      themeMode: "dark",
      interfaceMode: "mono",
      interfaceSansFont: "inter",
      interfaceMonoFont: "jetbrains-mono",
      headingMode: "mono",
      headingSansFont: "geist",
      headingMonoFont: "jetbrains-mono",
      backgroundEffects: true,
      reduceMotion: false,
      compactSidebar: false,
      rememberLastView: true,
    };
    const raw = window.localStorage.getItem(storageKey);
    const rawLastView = window.localStorage.getItem(lastViewKey);
    const prefs = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    const root = document.documentElement;
    window.__DAYZ_LAUNCHER_BOOTSTRAP__ = {
      preferences: prefs,
      lastView: rawLastView || "dayz-server",
    };
    const resolveFontVariable = (fontId) => {
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
    };
    const resolvedTheme =
      prefs.themeMode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : prefs.themeMode;

    const interfaceFont =
      prefs.interfaceMode === "mono"
        ? resolveFontVariable(prefs.interfaceMonoFont)
        : resolveFontVariable(prefs.interfaceSansFont);
    const monoFont = resolveFontVariable(prefs.interfaceMonoFont);
    const headingFont =
      prefs.headingMode === "mono"
        ? resolveFontVariable(prefs.headingMonoFont)
        : resolveFontVariable(prefs.headingSansFont);

    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
    root.dataset.reduceMotion = prefs.reduceMotion ? "true" : "false";
    root.dataset.compactSidebar = prefs.compactSidebar ? "true" : "false";
    root.style.setProperty("--app-font-sans", interfaceFont);
    root.style.setProperty("--app-font-mono", monoFont);
    root.style.setProperty("--app-font-heading", headingFont);
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      style={
        {
          "--font-inter": '"Inter", "Segoe UI", sans-serif',
          "--font-jetbrains-mono": '"JetBrains Mono", "Cascadia Code", monospace',
          "--font-geist": '"Geist", "Segoe UI", sans-serif',
          "--font-geist-mono": '"Geist Mono", "JetBrains Mono", monospace',
          "--font-noto-sans": '"Noto Sans", "Segoe UI", sans-serif',
          "--font-roboto": '"Roboto", "Segoe UI", sans-serif',
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
      </head>
      <body className="min-h-full flex flex-col">
        <Script id="dayz-desktop-bridge" strategy="beforeInteractive">
          {desktopBridgeScript}
        </Script>
        <Script id="dayz-launcher-bootstrap" strategy="beforeInteractive">
          {launcherBootstrapScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
