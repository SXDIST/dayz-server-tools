"use client";

import { Boxes, Settings2, Siren } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AppHeader({
  onOpenCrashTools,
  onOpenSettings,
}: {
  onOpenCrashTools: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
            <Boxes className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">DayZ Server Launcher</p>
            <p className="truncate text-[11px] text-muted-foreground">Server workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open crash tools"
            title="Open crash tools"
            onClick={onOpenCrashTools}
          >
            <Siren className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open settings"
            title="Open settings"
            onClick={onOpenSettings}
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
