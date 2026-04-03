"use client";

import { Boxes, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { modules, type ModuleId } from "@/components/launcher/constants";
import { Badge } from "@/components/ui/badge";

function SidebarItem({
  active,
  title,
  note,
  status,
  icon: Icon,
  compact,
  onClick,
}: {
  active: boolean;
  title: string;
  note: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  compact: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "module-nav__item flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all duration-200",
        compact && "py-2.5",
        active
          ? "border-border bg-accent text-accent-foreground"
          : "border-transparent text-muted-foreground hover:border-border/50 hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <div className="module-nav__icon flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <Badge variant={active ? "secondary" : "outline"} className="text-[10px]">
            {status}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{note}</p>
      </div>
    </button>
  );
}

export function AppSidebar({
  activeView,
  onSelectModule,
  compactSidebar,
}: {
  activeView: ModuleId | "settings";
  onSelectModule: (moduleId: ModuleId | "settings") => void;
  compactSidebar: boolean;
}) {
  return (
    <aside className="module-nav sticky top-0 z-10 hidden min-h-0 overflow-hidden rounded-xl border bg-background xl:flex">
      <div className="module-nav__content flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/60 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
              <Boxes className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">DayZ Tools</p>
              <p className="text-xs text-muted-foreground">Desktop workspace</p>
            </div>
          </div>
        </div>

        <div className="border-b border-border/60 px-5 py-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium text-muted-foreground">Workspace</p>
            <p className="mt-2 text-sm text-foreground">Choose a focused toolset. Each module is optimized around one primary task flow.</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3 py-4">
          <div className="space-y-4">
            <p className="px-2 pb-1 text-sm font-medium text-muted-foreground">
              Modules
            </p>
            {modules.map((module) => (
              <SidebarItem
                key={module.id}
                active={activeView === module.id}
                title={module.name}
                note={module.note}
                status={module.status}
                icon={module.icon}
                compact={compactSidebar}
                onClick={() => onSelectModule(module.id)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 px-3 py-3">
          <button
            onClick={() => onSelectModule("settings")}
            className={cn(
              "module-nav__item flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
              activeView === "settings"
                ? "border-border bg-accent text-accent-foreground"
                : "border-transparent text-muted-foreground hover:border-border/50 hover:bg-accent/60 hover:text-foreground",
              compactSidebar && "py-2.5",
            )}
          >
            <div className="module-nav__icon flex size-10 items-center justify-center rounded-md border bg-muted">
              <Settings2 className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Settings</p>
              <p className="text-xs text-muted-foreground">Launcher preferences</p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
