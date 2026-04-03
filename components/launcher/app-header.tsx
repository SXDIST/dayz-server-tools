"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, ChevronDown, FileCog, Image, Minus, PackageSearch, ServerCog, Siren, Square, X } from "lucide-react";

import { modules, type ModuleId } from "@/components/launcher/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HeaderView = ModuleId | "settings";

const moduleIconMap: Record<ModuleId, typeof ServerCog> = {
  "dayz-server": ServerCog,
  "image-to-paa": Image,
  "crash-tools": Siren,
  "rvmat-editor": FileCog,
  "model-tools": PackageSearch,
};

function HeaderModuleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "app-no-drag inline-flex h-9 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground/82 hover:bg-accent/70 hover:text-foreground",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function WindowButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "app-no-drag inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function AppHeader({
  activeView,
  onSelectView,
}: {
  activeView: HeaderView;
  onSelectView: (view: HeaderView) => void;
}) {
  const dropdownModules = modules.filter((module) => module.id !== "dayz-server" && module.id !== "image-to-paa");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isToolsOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!toolsMenuRef.current?.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsToolsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isToolsOpen]);

  const handleMinimize = () => {
    void window.desktopBridge?.app.minimizeWindow();
  };

  const handleToggleMaximize = () => {
    void window.desktopBridge?.app.toggleMaximizeWindow();
  };

  const handleClose = () => {
    void window.desktopBridge?.app.closeWindow();
  };

  const toolsActive = dropdownModules.some((module) => module.id === activeView);

  return (
    <header className="app-drag-region fixed inset-x-0 top-0 z-50 border-b bg-background">
      <div className="overflow-visible px-4 py-3 pr-5">
        <div className="flex items-center gap-3">
          <div className="app-no-drag flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
              <Boxes className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">DayZ Tools</p>
              <p className="truncate text-[11px] text-muted-foreground">Launcher</p>
            </div>
          </div>

          <div className="min-w-0 flex flex-1 justify-center">
            <div className="relative flex w-full max-w-[760px] justify-center" ref={toolsMenuRef}>
              <div className="flex items-center justify-center gap-1 rounded-lg border bg-background p-1">
                <HeaderModuleButton
                  active={activeView === "dayz-server"}
                  label="DayZ Server"
                  onClick={() => onSelectView("dayz-server")}
                />
                <HeaderModuleButton
                  active={activeView === "image-to-paa"}
                  label="Image To PAA"
                  onClick={() => onSelectView("image-to-paa")}
                />
                <button
                  type="button"
                  className={cn(
                    "app-no-drag inline-flex h-9 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    toolsActive || isToolsOpen
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/82 hover:bg-accent/70 hover:text-foreground",
                  )}
                  onClick={() => setIsToolsOpen((current) => !current)}
                  aria-expanded={isToolsOpen}
                  aria-haspopup="menu"
                >
                  Tools
                  <ChevronDown className={cn("ml-1 size-3 transition-transform", isToolsOpen && "rotate-180")} />
                </button>
                <HeaderModuleButton
                  active={activeView === "settings"}
                  label="Settings"
                  onClick={() => onSelectView("settings")}
                />
              </div>

              {isToolsOpen ? (
                <div className="app-no-drag absolute top-full left-1/2 z-50 mt-2.5 w-[min(460px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border bg-popover p-2">
                  <div className="grid gap-2">
                    {dropdownModules.map((module) => {
                      const Icon = moduleIconMap[module.id];

                      return (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => {
                            onSelectView(module.id);
                            setIsToolsOpen(false);
                          }}
                          className={cn(
                            "rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent/60",
                            activeView === module.id && "bg-accent",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{module.name}</p>
                                <Badge variant="secondary">{module.status}</Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">{module.note}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mr-1 flex items-center gap-1.5">
            <WindowButton label="Minimize" onClick={handleMinimize} className="size-8 rounded-md">
              <Minus className="size-3.5" />
            </WindowButton>
            <WindowButton label="Maximize" onClick={handleToggleMaximize} className="size-8 rounded-md">
              <Square className="size-3.5" />
            </WindowButton>
            <WindowButton
              label="Close"
              onClick={handleClose}
              className="size-8 rounded-md hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-200"
            >
              <X className="size-3.5" />
            </WindowButton>
          </div>
        </div>
      </div>
    </header>
  );
}
