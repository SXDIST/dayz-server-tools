import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "DayZ Tools Launcher",
  description: "Desktop launcher for DayZ server and content tools",
};

const launcherBootstrapScript = `
(() => {
  try {
    const storageKey = "dayz-tools.launcher-preferences";
    const defaults = {
      themeMode: "dark",
      interfaceMode: "mono",
      interfaceSansFont: "inter",
      interfaceMonoFont: "jetbrains-mono",
      headingMode: "mono",
      headingSansFont: "geist",
      headingMonoFont: "jetbrains-mono",
    };
    const raw = window.localStorage.getItem(storageKey);
    const prefs = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    const root = document.documentElement;
    window.__DAYZ_LAUNCHER_BOOTSTRAP__ = {
      preferences: prefs,
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
      <body className="min-h-full flex flex-col">
        <Script id="dayz-launcher-bootstrap" strategy="beforeInteractive">
          {launcherBootstrapScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
