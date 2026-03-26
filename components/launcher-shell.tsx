"use client";

import { useMemo, useState } from "react";

import { BackgroundStars } from "@/components/background-stars";
import { DayzServerPage } from "@/components/dayz-server/page";
import { modules, type ModuleId } from "@/components/launcher/constants";
import { AppSidebar } from "@/components/launcher/app-sidebar";
import { PlaceholderModule } from "@/components/launcher/placeholder-module";
import { Badge } from "@/components/ui/badge";

export function LauncherShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dayz-server");

  const activeModuleData = useMemo(
    () => modules.find((item) => item.id === activeModule) ?? modules[0],
    [activeModule],
  );

  const renderContent = () => {
    switch (activeModule) {
      case "dayz-server":
        return <DayzServerPage />;
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
      <BackgroundStars />
      <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] items-start">
        <AppSidebar activeModule={activeModule} onSelectModule={setActiveModule} />

        <section className="relative z-10 min-w-0 p-5 pl-4">
          {activeModule === "dayz-server" ? (
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
