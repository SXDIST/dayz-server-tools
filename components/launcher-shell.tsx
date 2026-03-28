"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { AppHeader } from "@/components/launcher/app-header";
import type { ModuleId } from "@/components/launcher/constants";
import { PlaceholderModule } from "@/components/launcher/placeholder-module";
import { launcherLastViewStorageKey } from "@/components/launcher/preferences";
import { useLauncherPreferences } from "@/components/launcher/use-launcher-preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BackgroundStars = dynamic(
  () => import("@/components/background-stars").then((module) => module.BackgroundStars),
  { ssr: false },
);

function ModuleLoadingCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <div className="h-10 animate-pulse rounded-xl bg-muted/35" />
        <div className="h-28 animate-pulse rounded-2xl bg-muted/25" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-20 animate-pulse rounded-xl bg-muted/20" />
          <div className="h-20 animate-pulse rounded-xl bg-muted/20" />
          <div className="h-20 animate-pulse rounded-xl bg-muted/20" />
        </div>
      </CardContent>
    </Card>
  );
}

const DayzServerPage = dynamic(
  () => import("@/components/dayz-server/page").then((module) => module.DayzServerPage),
  {
    loading: () => (
      <ModuleLoadingCard
        title="Loading DayZ Server"
        description="Preparing workspace state and launcher controls."
      />
    ),
  },
);

const SettingsPage = dynamic(
  () => import("@/components/launcher/settings-page").then((module) => module.SettingsPage),
  {
    loading: () => (
      <ModuleLoadingCard
        title="Loading Settings"
        description="Restoring launcher preferences and interface controls."
      />
    ),
  },
);

const ImageToPaaPage = dynamic(
  () => import("@/components/image-to-paa/page").then((module) => module.ImageToPaaPage),
  {
    loading: () => (
      <ModuleLoadingCard
        title="Loading Image To PAA"
        description="Preparing the texture conversion workspace."
      />
    ),
  },
);

const CrashToolsPage = dynamic(
  () => import("@/components/crash-tools/page").then((module) => module.CrashToolsPage),
  {
    loading: () => (
      <ModuleLoadingCard
        title="Loading Crash Tools"
        description="Preparing crash diagnostics and recent artifact views."
      />
    ),
  },
);

export function LauncherShell() {
  const {
    preferences,
    setPreferences,
    lastView,
    setLastView,
  } = useLauncherPreferences();
  const [activeView, setActiveView] = useState<ModuleId | "settings">(
    preferences.rememberLastView ? (lastView as ModuleId | "settings") : "dayz-server",
  );

  const handleSelectView = (view: ModuleId | "settings") => {
    setActiveView(view);
    setLastView(view);

    if (!preferences.rememberLastView && typeof window !== "undefined") {
      window.localStorage.removeItem(launcherLastViewStorageKey);
    }
  };

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
        <section className="app-soft-scroll app-scroll-fade relative z-10 mt-[5.5rem] min-w-0 h-[calc(100vh-5.5rem)] overflow-y-auto">
          <div className="px-4 pb-4 pt-3">
            {renderContent()}
          </div>
        </section>
      </div>
    </main>
  );
}
