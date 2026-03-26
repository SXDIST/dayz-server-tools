"use client";

import { Boxes, Search, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { modules, type ModuleId } from "@/components/launcher/constants";

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
        "launcher-sidebar-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
        compact && "py-2",
        active
          ? "border border-border bg-accent text-accent-foreground"
          : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <div className="launcher-sidebar-item-icon flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{status}</span>
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
    <aside className="launcher-sidebar sticky top-3 relative z-10 m-3 mr-0 self-start rounded-[24px] border border-border/70 bg-card/95">
      <div className="launcher-sidebar-content flex max-h-[calc(100vh-1.5rem)] flex-col">
        <div className="border-b border-border/60 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
              <Boxes className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">DayZ Tools</p>
              <p className="text-xs text-muted-foreground">Launcher suite</p>
            </div>
          </div>
        </div>

        <div className="border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-input/30 px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Search tools</span>
          </div>
        </div>

        <div className="space-y-5 overflow-auto px-3 py-4">
          <div className="space-y-1">
            <p className="px-2 pb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
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
              "launcher-sidebar-item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              activeView === "settings" ? "border border-border bg-accent text-accent-foreground" : "border border-transparent",
              compactSidebar && "py-2",
            )}
          >
            <div className="launcher-sidebar-item-icon flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
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
