"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BackgroundStars } from "@/components/background-stars";
import { DayzServerPage } from "@/components/dayz-server/page";
import { modules, type ModuleId } from "@/components/launcher/constants";
import { AppSidebar } from "@/components/launcher/app-sidebar";
import { PlaceholderModule } from "@/components/launcher/placeholder-module";
import { launcherLastViewStorageKey } from "@/components/launcher/preferences";
import { SettingsPage } from "@/components/launcher/settings-page";
import { useLauncherPreferences } from "@/components/launcher/use-launcher-preferences";
import { Badge } from "@/components/ui/badge";

export function LauncherShell() {
  const {
    preferences,
    setPreferences,
    lastView,
    setLastView,
  } = useLauncherPreferences();
  const [activeView, setActiveView] = useState<ModuleId | "settings">("dayz-server");
  const restoredViewRef = useRef(false);

  const activeModuleData = useMemo(
    () => modules.find((item) => item.id === activeView) ?? modules[0],
    [activeView],
  );

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
        return <PlaceholderModule title="Image To PAA" description="Future module for image conversion to PAA." />;
      case "rvmat-editor":
        return <PlaceholderModule title="RVMAT Editor" description="Future material editor workspace." />;
      case "model-tools":
        return <PlaceholderModule title="Model Tools" description="Future addon and asset validation workspace." />;
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {preferences.backgroundEffects ? <BackgroundStars /> : null}
      <div className="launcher-shell-grid grid min-h-screen grid-cols-[260px_minmax(0,1fr)] items-start">
        <AppSidebar
          activeView={activeView}
          onSelectModule={handleSelectView}
          compactSidebar={preferences.compactSidebar}
        />

        <section className="relative z-10 min-w-0 p-5 pl-4">
          {activeView === "dayz-server" || activeView === "settings" ? (
            renderContent()
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-foreground">{activeModuleData.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{activeModuleData.note}</p>
                </div>
                <Badge variant="secondary">{activeModuleData.status}</Badge>
              </div>
              {renderContent()}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
