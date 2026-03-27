import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono, Noto_Sans, Roboto } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "DayZ Tools Launcher",
  description: "Desktop launcher for DayZ server and content tools",
};

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
      className={`${inter.variable} ${jetbrainsMono.variable} ${geist.variable} ${geistMono.variable} ${notoSans.variable} ${roboto.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="dayz-launcher-bootstrap" strategy="beforeInteractive">
          {launcherBootstrapScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
