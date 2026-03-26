"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  ChevronDown,
  FileCog,
  Image,
  PackageSearch,
  Search,
  ServerCog,
  Settings2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackgroundStars } from "@/components/background-stars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ModuleId = "dayz-server" | "image-to-paa" | "rvmat-editor" | "model-tools";
type ServerTab = "overview" | "mods" | "config" | "admins" | "missions" | "paths";

const modules = [
  {
    id: "dayz-server" as ModuleId,
    name: "DayZ Server",
    note: "Server manager",
    icon: ServerCog,
    status: "Ready",
  },
  {
    id: "image-to-paa" as ModuleId,
    name: "Image To PAA",
    note: "Image conversion",
    icon: Image,
    status: "Planned",
  },
  {
    id: "rvmat-editor" as ModuleId,
    name: "RVMAT Editor",
    note: "Material editor",
    icon: FileCog,
    status: "Planned",
  },
  {
    id: "model-tools" as ModuleId,
    name: "Model Tools",
    note: "Addon validation",
    icon: PackageSearch,
    status: "Planned",
  },
];

const serverTabs: { id: ServerTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mods", label: "Mods" },
  { id: "config", label: "Server.cfg" },
  { id: "admins", label: "Admin Tools" },
  { id: "missions", label: "Missions" },
  { id: "paths", label: "Paths" },
];

const quickActions = [
  "Open server folder",
  "Import Workshop collection",
  "Load existing server.cfg",
  "Open active mission",
];

const mods = [
  { name: "@CF", source: "Steam Workshop", state: "Installed" },
  { name: "@VPPAdminTools", source: "Steam Workshop", state: "Queued" },
  { name: "@BuilderItems", source: "Local Folder", state: "Installed" },
];

const adminTools = [
  ["VPPAdminTools", "Auto-setup for profiles, permissions and base files."],
  ["Community Online Tools", "Initialize roles and permissions config files."],
];

const missions = [
  ["chernarusplus", "Main production mission"],
  ["enoch", "Livonia profile"],
  ["custom.namalsk", "Custom mission preset"],
];

const serverPaths = [
  ["DayZ Server Root", "D:\\Games\\DayZServer", "Required path"],
  ["Profiles", "D:\\Games\\DayZServer\\profiles", "Optional override"],
  ["Keys", "D:\\Games\\DayZServer\\keys", "Usually auto-detected"],
  ["mpmissions", "D:\\Games\\DayZServer\\mpmissions", "Mission folder"],
];

function SidebarItem({
  active,
  title,
  note,
  status,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  note: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
        active
          ? "glass-subtle text-white shadow-[0_10px_30px_rgba(34,211,238,0.08)]"
          : "text-slate-300 hover:bg-white/6 hover:translate-x-[2px]",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-cyan-300/14 ring-1 ring-cyan-200/10" : "bg-white/6",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {status}
          </span>
        </div>
        <p className="truncate text-xs text-slate-400">{note}</p>
      </div>
    </button>
  );
}

function TabButton({
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
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm transition-colors duration-150",
        active
          ? "border-white/12 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-transparent text-slate-400 hover:bg-white/6 hover:text-slate-200",
      )}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-panel rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_60px_rgba(2,8,23,0.2)]">
      <CardHeader className="border-b border-white/8 px-5 py-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function Row({
  title,
  description,
  trailing,
}: {
  title: string;
  description: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="truncate text-sm text-slate-400">{description}</p>
      </div>
      {trailing}
    </div>
  );
}

function PlaceholderModule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Section title={title} description={description}>
      <div className="space-y-2">
        <Row title="Status" description="This module will get its own workspace." />
        <Row title="Approach" description="The launcher shell stays the same while the main pane changes." />
      </div>
    </Section>
  );
}

function ConfigField({
  label,
  description,
  control,
}: {
  label: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-white/6 py-4 last:border-b-0 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <div>{control}</div>
    </div>
  );
}

function SelectField({
  defaultValue,
  options,
}: {
  defaultValue: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="glass-subtle flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm text-white outline-none"
      >
        <span>{value}</span>
        <ChevronDown
          className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="glass-panel animate-[panel-fade_180ms_ease-out] absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-xl p-2">
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setValue(option);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  value === option
                    ? "bg-cyan-300/14 text-white"
                    : "text-slate-300 hover:bg-white/6",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToggleField({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  const [checked, setChecked] = useState(enabled);

  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => setChecked((current) => !current)}
      className="glass-subtle inline-flex w-auto items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 hover:bg-white/8"
    >
      <span
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-1 transition-all duration-200",
          checked
            ? "bg-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.18)]"
            : "bg-white/10",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-white transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      <span className="text-sm text-slate-200">{label}</span>
    </button>
  );
}

export function LauncherShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dayz-server");
  const [serverTab, setServerTab] = useState<ServerTab>("overview");

  const activeModuleData = useMemo(
    () => modules.find((item) => item.id === activeModule) ?? modules[0],
    [activeModule],
  );

  const renderServerContent = () => {
    switch (serverTab) {
      case "overview":
        return (
          <Section
            title="Quick Actions"
            description="Fast entry points for the most common server tasks."
          >
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant={action === quickActions[0] ? "primary" : "outline"}
                >
                  {action}
                </Button>
              ))}
            </div>
          </Section>
        );

      case "mods":
        return (
          <Section
            title="Mods"
            description="All detected server mods will appear here after automatic parsing."
          >
            <div className="flex flex-wrap gap-3 pb-4">
              <Button variant="primary">Sync Workshop Mods</Button>
              <Button variant="outline">Add Local Mod</Button>
            </div>
            <div>
              {mods.map((mod) => (
                <Row
                  key={mod.name}
                  title={mod.name}
                  description={mod.source}
                  trailing={<Badge>{mod.state}</Badge>}
                />
              ))}
            </div>
          </Section>
        );

      case "config":
        return (
          <Section
            title="Server.cfg"
            description="Single editor panel for all core server.cfg values with context-aware controls."
          >
            <div className="space-y-1">
              <ConfigField
                label="hostname"
                description="Public server name shown in the browser."
                control={<Input defaultValue="DayZ Tools Dev Server" />}
              />
              <ConfigField
                label="password"
                description="Optional join password."
                control={<Input defaultValue="" placeholder="Optional" />}
              />
              <ConfigField
                label="maxPlayers"
                description="Maximum connected players."
                control={<Input defaultValue="60" type="number" />}
              />
              <ConfigField
                label="verifySignatures"
                description="Validate addon signatures on client connect."
                control={<ToggleField enabled label="Enabled" />}
              />
              <ConfigField
                label="disableVoN"
                description="Disable in-game voice chat."
                control={<ToggleField enabled={false} label="Disabled" />}
              />
              <ConfigField
                label="serverTime"
                description="Choose how the server time is resolved."
                control={
                  <div className="space-y-3">
                    <SelectField
                      defaultValue="SystemTime"
                      options={["SystemTime", "Static", "Custom"]}
                    />
                    <Input defaultValue="2026-03-26 12:00" />
                  </div>
                }
              />
              <ConfigField
                label="serverTimeAcceleration"
                description="Controls daytime acceleration multiplier."
                control={<Input defaultValue="8" type="number" />}
              />
              <ConfigField
                label="serverNightTimeAcceleration"
                description="Controls nighttime acceleration multiplier."
                control={<Input defaultValue="4" type="number" />}
              />
              <ConfigField
                label="instanceId"
                description="Unique instance identifier."
                control={<Input defaultValue="1" type="number" />}
              />
              <ConfigField
                label="storageAutoFix"
                description="Attempt automatic cleanup of storage problems."
                control={<ToggleField enabled label="Enabled" />}
              />
              <ConfigField
                label="loginQueueConcurrentPlayers"
                description="How many players are processed in queue concurrently."
                control={<Input defaultValue="5" type="number" />}
              />
              <ConfigField
                label="adminLogPlayerHitsOnly"
                description="Reduce admin logs to player hit events only."
                control={<ToggleField enabled={false} label="Disabled" />}
              />
              <ConfigField
                label="guaranteedUpdates"
                description="Network update mode used by the server."
                control={
                  <SelectField
                    defaultValue="1"
                    options={["1", "2", "3"]}
                  />
                }
              />
            </div>
          </Section>
        );

      case "admins":
        return (
          <Section title="Admin Tools" description="Select and initialize an admin tool.">
            {adminTools.map(([title, description]) => (
              <Row key={title} title={title} description={description} />
            ))}
            <div className="pt-4">
              <Button variant="primary">Setup Selected Tool</Button>
            </div>
          </Section>
        );

      case "missions":
        return (
          <Section title="Missions" description="Manage mpmissions and mission presets.">
            {missions.map(([title, description]) => (
              <Row key={title} title={title} description={description} />
            ))}
            <div className="pt-4">
              <Button variant="primary">Open Mission Manager</Button>
            </div>
          </Section>
        );

      case "paths":
        return (
          <Section title="Advanced Paths" description="Override paths for non-standard installations.">
            <div className="space-y-3">
              {serverPaths.map(([label, value, note]) => (
                <div
                  key={label}
                  className="glass-subtle grid gap-2 rounded-xl p-4 xl:grid-cols-[180px_1fr]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="mt-1 text-xs text-slate-400">{note}</p>
                  </div>
                  <Input readOnly value={value} />
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="primary">Save Path Overrides</Button>
                <Button variant="outline">Reset to Auto</Button>
              </div>
            </div>
          </Section>
        );
    }
  };

  const renderContent = () => {
    switch (activeModule) {
      case "dayz-server":
        return renderServerContent();
      case "image-to-paa":
        return (
          <PlaceholderModule
            title="Image To PAA"
            description="Future module for image conversion to PAA."
          />
        );
      case "rvmat-editor":
        return (
          <PlaceholderModule
            title="RVMAT Editor"
            description="Future material editor workspace."
          />
        );
      case "model-tools":
        return (
          <PlaceholderModule
            title="Model Tools"
            description="Future addon and asset validation workspace."
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#09111d_0%,#0d1524_100%)] text-white">
      <BackgroundStars />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-7rem] top-[-6rem] h-72 w-72 rounded-full bg-cyan-300/10 blur-[120px]" />
        <div className="absolute right-[-9rem] top-20 h-80 w-80 rounded-full bg-sky-400/8 blur-[150px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-blue-500/8 blur-[170px]" />
      </div>

      <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)]">
        <aside className="glass-panel m-3 mr-0 rounded-[24px]">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/8">
                  <Boxes className="size-4" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">DayZ Tools</p>
                  <p className="text-xs text-slate-400">Launcher suite</p>
                </div>
              </div>
            </div>

            <div className="border-b border-white/8 px-4 py-3">
              <div className="glass-subtle flex items-center gap-2 rounded-xl px-3 py-2">
                <Search className="size-4 text-slate-500" />
                <span className="text-sm text-slate-500">Search tools</span>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-auto px-3 py-4">
              <div className="space-y-1">
                <p className="px-2 pb-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Modules
                </p>
                {modules.map((module) => (
                  <SidebarItem
                    key={module.id}
                    active={activeModule === module.id}
                    title={module.name}
                    note={module.note}
                    status={module.status}
                    icon={module.icon}
                    onClick={() => setActiveModule(module.id)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-white/8 px-3 py-3">
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-300 hover:bg-white/6">
                <div className="glass-subtle flex size-9 items-center justify-center rounded-lg">
                  <Settings2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Settings</p>
                  <p className="text-xs text-slate-400">Launcher preferences</p>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 p-5 pl-4">
          <div className="space-y-4">
            {activeModule === "dayz-server" ? (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/4 p-2">
                {serverTabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    active={serverTab === tab.id}
                    label={tab.label}
                    onClick={() => setServerTab(tab.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-white">{activeModuleData.name}</h1>
                  <p className="mt-1 text-sm text-slate-400">{activeModuleData.note}</p>
                </div>
                <Badge variant="accent">{activeModuleData.status}</Badge>
              </div>
            )}

            {renderContent()}
          </div>
        </section>
      </div>
    </main>
  );
}
