"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { AppHeader } from "@/components/launcher/app-header";
import { useLauncherPreferences } from "@/components/launcher/use-launcher-preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const CrashToolsPage = dynamic(
  () => import("@/components/crash-tools/page").then((module) => module.CrashToolsPage),
  {
    loading: () => (
      <ModuleLoadingCard
        title="Loading Crash Tools"
        description="Restoring crash diagnostics and recent artifact views."
      />
    ),
  },
);

export function LauncherShell() {
  const { preferences, setPreferences } = useLauncherPreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [crashToolsOpen, setCrashToolsOpen] = useState(false);

  return (
    <main className="launcher-shell relative h-screen overflow-hidden bg-background text-foreground">
      <div className="launcher-shell__frame relative z-10 flex h-full flex-col overflow-hidden">
        <AppHeader
          onOpenCrashTools={() => setCrashToolsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <div className="launcher-shell__body min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-3">
          <section className="launcher-shell__content app-soft-scroll app-scroll-fade min-h-0 h-full overflow-y-auto rounded-xl bg-background/0 p-1 sm:p-2">
            <DayzServerPage />
          </section>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="h-[88vh] max-h-[980px] w-[calc(100vw-3rem)] !max-w-[1280px] overflow-hidden rounded-2xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Launcher-wide preferences for theme and typography.
            </DialogDescription>
          </DialogHeader>
          <div className="app-soft-scroll h-[calc(88vh-5.5rem)] max-h-[calc(980px-5.5rem)] overflow-y-auto px-6 py-5">
            <SettingsPage preferences={preferences} setPreferences={setPreferences} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={crashToolsOpen} onOpenChange={setCrashToolsOpen}>
        <DialogContent className="h-[92vh] max-h-[1100px] w-[calc(100vw-3rem)] !max-w-[1680px] overflow-hidden rounded-2xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Crash Tools</DialogTitle>
            <DialogDescription>
              Combined server and client crash diagnostics with log cleanup tools.
            </DialogDescription>
          </DialogHeader>
          <div className="app-soft-scroll h-[calc(92vh-5.5rem)] max-h-[calc(1100px-5.5rem)] overflow-y-auto px-6 py-5">
            <CrashToolsPage />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
