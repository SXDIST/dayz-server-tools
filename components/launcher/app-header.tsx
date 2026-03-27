"use client";

import { Boxes, FileCog, Image, Minus, PackageSearch, ServerCog, Siren, Square, X } from "lucide-react";

import { modules, type ModuleId } from "@/components/launcher/constants";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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
    <NavigationMenuLink asChild>
      <button type="button" className={cn(navigationMenuTriggerStyle(active), "app-no-drag")} onClick={onClick}>
        {label}
      </button>
    </NavigationMenuLink>
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
        "app-no-drag inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
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

  const handleMinimize = () => {
    void window.desktopBridge?.app.minimizeWindow();
  };

  const handleToggleMaximize = () => {
    void window.desktopBridge?.app.toggleMaximizeWindow();
  };

  const handleClose = () => {
    void window.desktopBridge?.app.closeWindow();
  };

  return (
    <header className="app-drag-region fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-card/92 backdrop-blur-xl">
      <div className="overflow-visible px-4 py-3 pr-5">
        <div className="flex items-center gap-3">
          <div className="app-no-drag flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/35">
              <Boxes className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">DayZ Tools</p>
              <p className="truncate text-[11px] text-muted-foreground">Launcher</p>
            </div>
          </div>

          <div className="min-w-0 flex flex-1 justify-center">
            <NavigationMenu className="w-full max-w-[760px] justify-center">
              <NavigationMenuList className="justify-center gap-1 rounded-2xl px-1.5 py-1">
                <NavigationMenuItem>
                  <HeaderModuleButton
                    active={activeView === "dayz-server"}
                    label="DayZ Server"
                    onClick={() => onSelectView("dayz-server")}
                  />
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <HeaderModuleButton
                    active={activeView === "image-to-paa"}
                    label="Image To PAA"
                    onClick={() => onSelectView("image-to-paa")}
                  />
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="app-no-drag px-4">Tools</NavigationMenuTrigger>
                  <NavigationMenuContent className="app-no-drag">
                    <div className="grid min-w-[460px] gap-2 p-2.5">
                      {dropdownModules.map((module) => {
                        const Icon = moduleIconMap[module.id];

                        return (
                          <button
                            key={module.id}
                            type="button"
                            onClick={() => onSelectView(module.id)}
                            className={cn(
                              "rounded-xl border border-border/60 bg-card/70 p-3 text-left transition-colors hover:bg-accent/60",
                              activeView === module.id && "bg-accent",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/35">
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
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <HeaderModuleButton
                    active={activeView === "settings"}
                    label="Settings"
                    onClick={() => onSelectView("settings")}
                  />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
