"use client";

import { useEffect, useRef, useState } from "react";

import { BackgroundStars } from "@/components/background-stars";
import { CrashToolsPage } from "@/components/crash-tools/page";
import { DayzServerPage } from "@/components/dayz-server/page";
import { ImageToPaaPage } from "@/components/image-to-paa/page";
import { AppHeader } from "@/components/launcher/app-header";
import type { ModuleId } from "@/components/launcher/constants";
import { PlaceholderModule } from "@/components/launcher/placeholder-module";
import { launcherLastViewStorageKey } from "@/components/launcher/preferences";
import { SettingsPage } from "@/components/launcher/settings-page";
import { useLauncherPreferences } from "@/components/launcher/use-launcher-preferences";

export function LauncherShell() {
  const {
    preferences,
    setPreferences,
    lastView,
    setLastView,
  } = useLauncherPreferences();
  const [activeView, setActiveView] = useState<ModuleId | "settings">("dayz-server");
  const restoredViewRef = useRef(false);

  const handleSelectView = (view: ModuleId | "settings") => {
    setActiveView(view);
    setLastView(view);

    if (!preferences.rememberLastView && typeof window !== "undefined") {
      window.localStorage.removeItem(launcherLastViewStorageKey);
    }
  };

  useEffect(() => {
    if (restoredViewRef.current) {
      return;
    }

    restoredViewRef.current = true;

    if (!preferences.rememberLastView || !lastView) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setActiveView(lastView as ModuleId | "settings");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [lastView, preferences.rememberLastView]);

  const renderContent = () => {
    switch (activeView) {
      case "dayz-server":
        return <DayzServerPage />;
      case "settings":
        return <SettingsPage preferences={preferences} setPreferences={setPreferences} />;
      case "image-to-paa":
        return <ImageToPaaPage />;
      case "crash-tools":
        return <CrashToolsPage />;
      case "rvmat-editor":
        return <PlaceholderModule title="RVMAT Editor" description="Future material editor workspace." />;
      case "model-tools":
        return <PlaceholderModule title="Model Tools" description="Future addon and asset validation workspace." />;
    }
  };

  return (
    <main className="relative h-screen overflow-hidden bg-background text-foreground">
      {preferences.backgroundEffects ? <BackgroundStars /> : null}
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader
          activeView={activeView}
          onSelectView={handleSelectView}
        />
        <section className="relative z-10 mt-[5.5rem] min-w-0 h-[calc(100vh-5.5rem)] overflow-y-auto">
          <div className="px-4 pb-4 pt-3">
            {renderContent()}
          </div>
        </section>
      </div>
    </main>
  );
}
