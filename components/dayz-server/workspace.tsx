"use client";

import {
  memo,
  type ComponentProps,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Gamepad2, GripHorizontal, Pause, Play, RotateCcw, Search } from "lucide-react";

import {
  clientResolutionOptions,
  DAYZ_CLIENT_PATH_LABEL,
  serverTabs,
  serverPaths,
  type ServerConfigValues,
  type ServerTab,
  adminTools,
} from "@/components/dayz-server/constants";
import { SelectField, ToggleField } from "@/components/dayz-server/form-controls";
import { InitGeneratorPanel } from "@/components/dayz-server/init-generator-panel";
import { formatBytes, formatTimestamp, getModSignatureLabel, getModSourceLabel } from "@/components/dayz-server/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
          ? "border-border bg-accent text-accent-foreground"
          : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
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
    <Card className="overflow-visible rounded-2xl border border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 px-5 py-4">
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
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
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

function ModsPageSkeleton() {
  return (
    <Section title="Mods" description="Search, inspect and manage the launch preset for local and Workshop mods.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-11 min-w-[280px] flex-1 rounded-xl border border-input bg-input/20" />
          <div className="h-10 w-32 rounded-xl border border-border/60 bg-muted/30" />
          <div className="h-10 w-32 rounded-xl border border-border/60 bg-muted/30" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
              <div className="space-y-3">
                <div className="h-5 w-36 rounded bg-muted/40" />
                <div className="h-16 rounded-xl border border-border/60 bg-background/20" />
                <div className="h-16 rounded-xl border border-border/60 bg-background/20" />
                <div className="h-16 rounded-xl border border-border/60 bg-background/20" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
              <div className="space-y-3">
                <div className="h-5 w-28 rounded bg-muted/40" />
                <div className="h-16 rounded-xl border border-border/60 bg-background/20" />
                <div className="h-16 rounded-xl border border-border/60 bg-background/20" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <div className="space-y-3">
              <div className="h-5 w-32 rounded bg-muted/40" />
              <div className="h-16 rounded-xl border border-border/60 bg-background/20" />
              <div className="h-16 rounded-xl border border-border/60 bg-background/20" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

const ModListItem = memo(function ModListItem({
  mod,
  toggleLabel,
  modId,
  onToggleEnabled,
}: {
  mod: DayzParsedMod;
  toggleLabel: string;
  modId: string;
  onToggleEnabled: (modId: string) => void;
}) {
  const [expandedValue, setExpandedValue] = useState("");

  return (
    <Accordion
      type="single"
      collapsible
      value={expandedValue}
      onValueChange={setExpandedValue}
      className="rounded-xl border border-border/60 bg-background/30 px-4"
    >
      <AccordionItem value={mod.id} className="border-b-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <AccordionTrigger className="min-w-0 py-3 pr-0 hover:no-underline">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{mod.displayName}</p>
                <Badge variant="secondary">{getModSourceLabel(mod)}</Badge>
                <Badge variant="outline">{mod.state}</Badge>
              </div>
              <p className="mt-1 truncate text-sm font-normal text-muted-foreground">
                {mod.author ? `${mod.author} • ` : ""}
                {mod.version ? `v${mod.version} • ` : ""}
                {formatBytes(mod.sizeBytes)}
              </p>
            </div>
          </AccordionTrigger>

          <div className="flex shrink-0 items-center pt-3">
            <button
              type="button"
              aria-pressed={mod.enabled}
              aria-label={toggleLabel}
              title={toggleLabel}
              onClick={() => onToggleEnabled(modId)}
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-1 transition-all duration-200",
                mod.enabled ? "bg-primary/70" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "size-4 rounded-full bg-white transition-transform duration-200",
                  mod.enabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>

        <AccordionContent className="border-t border-border/60 pt-4">
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Path</p>
              <p className="mt-1 break-all text-foreground">{mod.path}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Author</p>
              <p className="mt-1 text-foreground">{mod.author || "Not provided by mod"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Version</p>
              <p className="mt-1 text-foreground">{mod.version || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Created</p>
              <p className="mt-1 text-foreground">
                {mod.createdAt ? formatTimestamp(mod.createdAt) : mod.source === "Workshop" ? "Unavailable locally" : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updated</p>
              <p className="mt-1 text-foreground">{formatTimestamp(mod.updatedAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Size</p>
              <p className="mt-1 text-foreground">{formatBytes(mod.sizeBytes)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PBO Signatures</p>
              <p className="mt-1 text-foreground">{getModSignatureLabel(mod)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Keys Folder</p>
              <p className="mt-1 text-foreground">{mod.hasKeysDir ? "Present" : "Missing"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workshop ID</p>
              <p className="mt-1 text-foreground">{mod.workshopId || "Local mod"}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});

const ModsPage = memo(function ModsPage({
  modsSearch,
  setModsSearch,
  availableWorkshopMods,
  availableLocalMods,
  enabledMods,
  onToggleModEnabled,
  onRefreshMods,
  onImportLocalMod,
}: {
  modsSearch: string;
  setModsSearch: (value: string) => void;
  availableWorkshopMods: DayzParsedMod[];
  availableLocalMods: DayzParsedMod[];
  enabledMods: DayzParsedMod[];
  onToggleModEnabled: (modId: string) => void;
  onRefreshMods: () => Promise<void>;
  onImportLocalMod: () => Promise<void>;
}) {
  const deferredWorkshopMods = useDeferredValue(availableWorkshopMods);
  const deferredLocalMods = useDeferredValue(availableLocalMods);
  const deferredEnabledMods = useDeferredValue(enabledMods);

  return (
    <Section title="Mods" description="Search, inspect and manage the launch preset for local and Workshop mods.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={modsSearch}
              onChange={(event) => setModsSearch(event.target.value)}
              placeholder="Search all mods, authors, versions, IDs and paths"
              className="pl-9"
            />
          </div>
          <Button variant="default" onClick={() => void onRefreshMods()}>
            Refresh Mods
          </Button>
          <Button variant="outline" onClick={() => void onImportLocalMod()}>
            Add Local Mod
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/15">
              <div className="border-b border-border/60 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Workshop Mods</p>
                <p className="mt-1 text-sm text-muted-foreground">Detected automatically from Steam Workshop for DayZ.</p>
              </div>
              <div className="space-y-3 px-4 py-4">
                {deferredWorkshopMods.map((mod) => (
                  <ModListItem
                    key={mod.id}
                    mod={mod}
                    toggleLabel="Enable"
                    modId={mod.id}
                    onToggleEnabled={onToggleModEnabled}
                  />
                ))}
                {deferredWorkshopMods.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
                    No Workshop mods match the current filter.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/15">
              <div className="border-b border-border/60 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Local Mods</p>
                <p className="mt-1 text-sm text-muted-foreground">Server-root mods and manually imported local folders.</p>
              </div>
              <div className="space-y-3 px-4 py-4">
                {deferredLocalMods.map((mod) => (
                  <ModListItem
                    key={mod.id}
                    mod={mod}
                    toggleLabel="Enable"
                    modId={mod.id}
                    onToggleEnabled={onToggleModEnabled}
                  />
                ))}
                {deferredLocalMods.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
                    No local mods match the current filter.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/15">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Enabled Mods</p>
              <p className="mt-1 text-sm text-muted-foreground">Active preset selection used for launch arguments.</p>
            </div>
            <div className="space-y-2 px-4 py-3">
              {deferredEnabledMods.map((mod) => (
                <ModListItem
                  key={`${mod.id}-enabled`}
                  mod={mod}
                  toggleLabel="Disable"
                  modId={mod.id}
                  onToggleEnabled={onToggleModEnabled}
                />
              ))}
              {deferredEnabledMods.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
                  No enabled mods match the current filter.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
});

function DeferredModsPage(
  props: ComponentProps<typeof ModsPage> & {
    active: boolean;
  },
) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!props.active) {
      return;
    }

    let frameId = 0;
    let timeoutId = 0;

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setReady(true);
      }, 0);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [props.active]);

  if (!ready) {
    return <ModsPageSkeleton />;
  }

  const modsPageProps = {
    modsSearch: props.modsSearch,
    setModsSearch: props.setModsSearch,
    availableWorkshopMods: props.availableWorkshopMods,
    availableLocalMods: props.availableLocalMods,
    enabledMods: props.enabledMods,
    onToggleModEnabled: props.onToggleModEnabled,
    onRefreshMods: props.onRefreshMods,
    onImportLocalMod: props.onImportLocalMod,
  };
  return <ModsPage {...modsPageProps} />;
}

function OverviewPage({
  runtime,
  isServerPending,
  onStart,
  onStop,
  onRestart,
  onLaunchClient,
}: {
  runtime: DayzServerRuntime;
  isServerPending: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onRestart: () => Promise<void>;
  onLaunchClient: () => Promise<void>;
}) {
  const [terminalHeight, setTerminalHeight] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function handleMove(event: MouseEvent) {
      if (!dragRef.current) {
        return;
      }

      const delta = dragRef.current.startY - event.clientY;
      const nextHeight = Math.min(520, Math.max(180, dragRef.current.startHeight + delta));
      setTerminalHeight(nextHeight);
    }

    function handleUp() {
      setIsDragging(false);
      dragRef.current = null;
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const element = terminalRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [runtime.logs]);

  const statusTone =
    runtime.status === "running"
      ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/20"
      : runtime.status === "starting"
        ? "bg-amber-500/12 text-amber-300 border-amber-500/20"
        : "bg-muted text-muted-foreground border-border";

  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] flex-col gap-4">
      <Section title="Server Control" description="Start, stop and monitor the current DayZ Server workspace.">
        <div className="flex flex-wrap items-center gap-3">
          <Button className="gap-2" onClick={() => void onStart()} disabled={isServerPending}>
            <Play className="size-4" />
            Start Server
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => void onStop()} disabled={isServerPending}>
            <Pause className="size-4" />
            Stop
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => void onRestart()} disabled={isServerPending}>
            <RotateCcw className="size-4" />
            Restart
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => void onLaunchClient()}>
            <Gamepad2 className="size-4" />
            Launch Client
          </Button>
          <Badge className={cn("rounded-full border px-3 py-1 text-xs", statusTone)}>
            {runtime.status === "running" ? "Running" : runtime.status === "starting" ? "Starting" : "Stopped"}
          </Badge>
        </div>
      </Section>

      <div className="pointer-events-none mt-auto -mx-5 -mb-5">
        <div className="pointer-events-auto rounded-t-[26px] border-x border-t border-border/70 bg-[#111315]/96 shadow-[0_-24px_60px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            aria-label="Resize terminal"
            onMouseDown={(event) => {
              setIsDragging(true);
              dragRef.current = { startY: event.clientY, startHeight: terminalHeight };
            }}
            className="group flex w-full items-center justify-center border-b border-white/8 py-3 text-muted-foreground transition-colors hover:bg-white/[0.03]"
          >
            <GripHorizontal className="size-4 transition-transform group-hover:scale-110" />
          </button>

          <div className="overflow-hidden" style={{ height: `${terminalHeight}px` }}>
            <div ref={terminalRef} className="h-full overflow-auto px-5 py-4 font-mono text-[13px] leading-7 text-zinc-200">
              {runtime.logs.map((entry, index) => (
                <div key={`${entry.id}-${index}`} className="whitespace-pre-wrap">
                  <span className="text-emerald-400">{`[${index + 1}]`}</span>{" "}
                  <span>{entry.line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type DayzServerWorkspaceProps = {
  serverTab: ServerTab;
  setServerTab: (tab: ServerTab) => void;
  runtime: DayzServerRuntime;
  isServerPending: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onRestart: () => Promise<void>;
  onLaunchClient: () => Promise<void>;
  modsSearch: string;
  setModsSearch: (value: string) => void;
  pathValues: Record<string, string>;
  enabledMods: DayzParsedMod[];
  availableWorkshopMods: DayzParsedMod[];
  availableLocalMods: DayzParsedMod[];
  onToggleModEnabled: (modId: string) => void;
  onRefreshMods: () => Promise<void>;
  onImportLocalMod: () => Promise<void>;
  serverConfigValues: ServerConfigValues;
  setServerConfigValues: Dispatch<SetStateAction<ServerConfigValues>>;
  missions: DayzMission[];
  initGeneratorState: DayzInitGeneratorState;
  setInitGeneratorState: Dispatch<SetStateAction<DayzInitGeneratorState>>;
  initSelectedMissionName: string;
  setInitSelectedMissionName: (value: string) => void;
  initPreviewResult: DayzInitPreviewResult | null;
  isInitPreviewPending: boolean;
  isInitBackupPending: boolean;
  isInitApplyPending: boolean;
  initPresetNameInput: string;
  setInitPresetNameInput: (value: string) => void;
  initSelectedPresetId: string;
  setInitSelectedPresetId: (value: string) => void;
  onGenerateInitPreview: () => Promise<void>;
  onBackupGeneratedInit: () => Promise<void>;
  onApplyGeneratedInit: () => Promise<void>;
  onSaveInitLoadoutPreset: () => void;
  onLoadInitLoadoutPreset: () => void;
  onDeleteInitLoadoutPreset: () => void;
  clientPath: string;
  setClientPath: (value: string) => void;
  clientSettings: {
    displayMode: "windowed" | "fullscreen";
    resolution: string;
  };
  setClientSettings: Dispatch<
    SetStateAction<{
      displayMode: "windowed" | "fullscreen";
      resolution: string;
    }>
  >;
  onPathChange: (label: string, value: string) => void;
  onBrowseClientPath: () => Promise<void>;
  onBrowsePath: (label: string) => Promise<void>;
  onAutoScanServer: () => Promise<void>;
  onSavePathOverrides: () => Promise<void>;
  onResetPaths: () => Promise<void>;
  onRefreshMissions: () => Promise<void>;
};

export function DayzServerWorkspace(props: DayzServerWorkspaceProps) {
  const serverTimeMode = props.serverConfigValues.serverTime.trim();
  const usesStaticTimeConfig = serverTimeMode !== "SystemTime";

  const renderContent = () => {
    switch (props.serverTab) {
      case "overview":
        return (
          <OverviewPage
            runtime={props.runtime}
            isServerPending={props.isServerPending}
            onStart={props.onStart}
            onStop={props.onStop}
            onRestart={props.onRestart}
            onLaunchClient={props.onLaunchClient}
          />
        );
      case "mods":
        return (
          <DeferredModsPage
            active={props.serverTab === "mods"}
            modsSearch={props.modsSearch}
            setModsSearch={props.setModsSearch}
            availableWorkshopMods={props.availableWorkshopMods}
            availableLocalMods={props.availableLocalMods}
            enabledMods={props.enabledMods}
            onToggleModEnabled={props.onToggleModEnabled}
            onRefreshMods={props.onRefreshMods}
            onImportLocalMod={props.onImportLocalMod}
          />
        );
      case "config":
        return (
          <Section title="Server.cfg" description="Single editor panel for all core server.cfg values with context-aware controls.">
            <div className="space-y-1">
              <ConfigField label="hostname" description="Public server name shown in the browser." control={<Input value={props.serverConfigValues.hostname} onChange={(event) => props.setServerConfigValues((current) => ({ ...current, hostname: event.target.value }))} />} />
              <ConfigField label="password" description="Optional join password." control={<Input value={props.serverConfigValues.password} placeholder="Optional" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, password: event.target.value }))} />} />
              <ConfigField label="passwordAdmin" description="Admin password used for server login." control={<Input value={props.serverConfigValues.passwordAdmin} placeholder="Optional" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, passwordAdmin: event.target.value }))} />} />
              <ConfigField label="description" description="Shown in the DayZ server browser." control={<Input value={props.serverConfigValues.description} placeholder="Optional" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, description: event.target.value }))} />} />
              <ConfigField label="template" description="Active mission from the mpmissions folder." control={<SelectField value={props.serverConfigValues.template || "Select mission"} options={[...new Set([props.serverConfigValues.template, ...props.missions.map((mission) => mission.name)].filter(Boolean))]} onValueChange={(value) => props.setServerConfigValues((current) => ({ ...current, template: value }))} />} />
              <ConfigField label="maxPlayers" description="Maximum connected players." control={<Input value={props.serverConfigValues.maxPlayers} type="number" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, maxPlayers: event.target.value }))} />} />
              <ConfigField label="enableWhitelist" description="Allow only whitelisted players to connect." control={<ToggleField checked={props.serverConfigValues.enableWhitelist} label={props.serverConfigValues.enableWhitelist ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, enableWhitelist: checked }))} />} />
              <ConfigField label="verifySignatures" description="Validate addon signatures on client connect." control={<ToggleField checked={props.serverConfigValues.verifySignatures} label={props.serverConfigValues.verifySignatures ? "Strict" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, verifySignatures: checked }))} />} />
              <ConfigField label="forceSameBuild" description="Allow only clients with the same executable build." control={<ToggleField checked={props.serverConfigValues.forceSameBuild} label={props.serverConfigValues.forceSameBuild ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, forceSameBuild: checked }))} />} />
              <ConfigField label="disableVoN" description="Disable in-game voice chat." control={<ToggleField checked={props.serverConfigValues.disableVoN} label={props.serverConfigValues.disableVoN ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, disableVoN: checked }))} />} />
              <ConfigField label="vonCodecQuality" description="Voice codec quality from 0 to 30." control={<Input value={props.serverConfigValues.vonCodecQuality} type="number" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, vonCodecQuality: event.target.value }))} />} />
              <ConfigField label="battlEye" description="Enable BattlEye for this server instance." control={<ToggleField checked={props.serverConfigValues.battlEye} label={props.serverConfigValues.battlEye ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, battlEye: checked }))} />} />
              <ConfigField label="shardId" description="Private shard identifier for the server." control={<Input value={props.serverConfigValues.shardId} placeholder="Optional private shard id" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, shardId: event.target.value }))} />} />
              <ConfigField label="disable3rdPerson" description="Disable third-person camera for players." control={<ToggleField checked={props.serverConfigValues.disable3rdPerson} label={props.serverConfigValues.disable3rdPerson ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, disable3rdPerson: checked }))} />} />
              <ConfigField label="disableCrosshair" description="Disable crosshair for connected clients." control={<ToggleField checked={props.serverConfigValues.disableCrosshair} label={props.serverConfigValues.disableCrosshair ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, disableCrosshair: checked }))} />} />
              <ConfigField label="disablePersonalLight" description="Disable personal light for all players." control={<ToggleField checked={props.serverConfigValues.disablePersonalLight} label={props.serverConfigValues.disablePersonalLight ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, disablePersonalLight: checked }))} />} />
              <ConfigField label="lightingConfig" description="Night lighting mode used by the server." control={<SelectField value={props.serverConfigValues.lightingConfig} options={["0", "1"]} onValueChange={(value) => props.setServerConfigValues((current) => ({ ...current, lightingConfig: value }))} />} />
              <ConfigField label="serverTime" description="Choose how the server time is resolved." control={<Input value={props.serverConfigValues.serverTime} onChange={(event) => props.setServerConfigValues((current) => ({ ...current, serverTime: event.target.value }))} placeholder='SystemTime or YYYY/MM/DD/HH/MM' />} />
              {usesStaticTimeConfig ? (
                <ConfigField label="serverTimePersistent" description="Persist in-game time between restarts." control={<ToggleField checked={props.serverConfigValues.serverTimePersistent === "1"} label={props.serverConfigValues.serverTimePersistent === "1" ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, serverTimePersistent: checked ? "1" : "0" }))} />} />
              ) : null}
              <ConfigField label="serverTimeAcceleration" description="Controls daytime acceleration multiplier." control={<Input value={props.serverConfigValues.serverTimeAcceleration} type="number" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, serverTimeAcceleration: event.target.value }))} />} />
              <ConfigField label="serverNightTimeAcceleration" description="Controls nighttime acceleration multiplier." control={<Input value={props.serverConfigValues.serverNightTimeAcceleration} type="number" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, serverNightTimeAcceleration: event.target.value }))} />} />
              <ConfigField label="guaranteedUpdates" description="Network update mode used by the server." control={<SelectField value={props.serverConfigValues.guaranteedUpdates} options={["1", "2", "3"]} onValueChange={(value) => props.setServerConfigValues((current) => ({ ...current, guaranteedUpdates: value }))} />} />
              <ConfigField label="loginQueueConcurrentPlayers" description="How many players are processed in queue concurrently." control={<Input value={props.serverConfigValues.loginQueueConcurrentPlayers} type="number" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, loginQueueConcurrentPlayers: event.target.value }))} />} />
              <ConfigField label="loginQueueMaxPlayers" description="Maximum number of players allowed to wait in queue." control={<Input value={props.serverConfigValues.loginQueueMaxPlayers} type="number" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, loginQueueMaxPlayers: event.target.value }))} />} />
              <ConfigField label="instanceId" description="Unique instance identifier." control={<Input value={props.serverConfigValues.instanceId} type="number" onChange={(event) => props.setServerConfigValues((current) => ({ ...current, instanceId: event.target.value }))} />} />
              <ConfigField label="storageAutoFix" description="Attempt automatic cleanup of storage problems." control={<ToggleField checked={props.serverConfigValues.storageAutoFix} label={props.serverConfigValues.storageAutoFix ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, storageAutoFix: checked }))} />} />
              <ConfigField label="adminLogPlayerHitsOnly" description="Reduce admin logs to player hit events only." control={<ToggleField checked={props.serverConfigValues.adminLogPlayerHitsOnly} label={props.serverConfigValues.adminLogPlayerHitsOnly ? "Enabled" : "Disabled"} onCheckedChange={(checked) => props.setServerConfigValues((current) => ({ ...current, adminLogPlayerHitsOnly: checked }))} />} />
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
              <Button variant="default">Setup Selected Tool</Button>
            </div>
          </Section>
        );
      case "missions":
        return (
          <Section title="Missions" description="Detected mission folders from mpmissions with quick selection for Server.cfg and init.c generation.">
            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
              <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 xl:sticky xl:top-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mission Folders</p>
                    <p className="mt-1 text-sm text-muted-foreground">Pick the active mission and inspect its current files.</p>
                  </div>
                  <Button variant="default" onClick={() => void props.onRefreshMissions()}>
                    Refresh Missions
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {props.missions.map((mission) => {
                    const isActive = props.serverConfigValues.template === mission.name;

                    return (
                      <div key={mission.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{mission.name}</p>
                              <Badge variant="secondary">{mission.mapName}</Badge>
                              {isActive ? <Badge>Active</Badge> : null}
                            </div>
                            <p className="mt-1 break-all text-sm text-muted-foreground">{mission.path}</p>
                          </div>
                          <Button
                            variant={isActive ? "secondary" : "outline"}
                            onClick={() =>
                              props.setServerConfigValues((current) => ({
                                ...current,
                                template: mission.name,
                              }))
                            }
                          >
                            {isActive ? "Selected" : "Use Mission"}
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Init.c</p>
                            <p className="mt-1 text-foreground">{mission.hasInitFile ? "Present" : "Missing"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">DB Folder</p>
                            <p className="mt-1 text-foreground">{mission.hasDbFolder ? "Present" : "Missing"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">CfgEconomyCore</p>
                            <p className="mt-1 text-foreground">{mission.hasCfgEconomyCore ? "Present" : "Missing"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entries</p>
                            <p className="mt-1 text-foreground">{mission.fileCount}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {props.missions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 px-3 py-8 text-center text-sm text-muted-foreground">
                      No missions were found in the current mpmissions folder.
                    </div>
                  ) : null}
                </div>
              </div>
              <InitGeneratorPanel
                missions={props.missions}
                selectedMissionName={props.initSelectedMissionName}
                setSelectedMissionName={props.setInitSelectedMissionName}
                initGeneratorState={props.initGeneratorState}
                setInitGeneratorState={props.setInitGeneratorState}
                presetNameInput={props.initPresetNameInput}
                setPresetNameInput={props.setInitPresetNameInput}
                selectedPresetId={props.initSelectedPresetId}
                setSelectedPresetId={props.setInitSelectedPresetId}
                onSavePreset={props.onSaveInitLoadoutPreset}
                onLoadPreset={props.onLoadInitLoadoutPreset}
                onDeletePreset={props.onDeleteInitLoadoutPreset}
                onGeneratePreview={props.onGenerateInitPreview}
                onBackup={props.onBackupGeneratedInit}
                onApply={props.onApplyGeneratedInit}
                previewResult={props.initPreviewResult}
                isPreviewPending={props.isInitPreviewPending}
                isBackupPending={props.isInitBackupPending}
                isApplyPending={props.isInitApplyPending}
              />
            </div>
          </Section>
        );
      case "settings":
        return (
          <Section title="Settings" description="Set auto-detected folders and an explicit DayZ client executable.">
            <div className="space-y-3">
              {serverPaths.map(([label, value, note]) => (
                <div key={label} className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-4 xl:grid-cols-[180px_1fr]">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      value={props.pathValues[label] ?? ""}
                      placeholder={value}
                      onChange={(event) => props.onPathChange(label, event.target.value)}
                    />
                    <Button variant="outline" className="shrink-0" onClick={() => void props.onBrowsePath(label)}>
                      Browse
                    </Button>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-4 xl:grid-cols-[180px_1fr]">
                <div>
                  <p className="text-sm font-medium text-foreground">{DAYZ_CLIENT_PATH_LABEL}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Optional explicit path to DayZ_x64.exe.</p>
                </div>
                <div className="flex gap-3">
                  <Input
                    value={props.clientPath}
                    onChange={(event) => props.setClientPath(event.target.value)}
                    placeholder="C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ\\DayZ_x64.exe"
                  />
                  <Button variant="outline" className="shrink-0" onClick={() => void props.onBrowseClientPath()}>
                    Browse
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-4 xl:grid-cols-[180px_1fr]">
                <div>
                  <p className="text-sm font-medium text-foreground">Client Display</p>
                  <p className="mt-1 text-xs text-muted-foreground">Launch mode and resolution for the DayZ client.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField
                    value={props.clientSettings.displayMode === "fullscreen" ? "Fullscreen" : "Windowed"}
                    options={["Windowed", "Fullscreen"]}
                    onValueChange={(value) =>
                      props.setClientSettings((current) => ({
                        ...current,
                        displayMode: value === "Fullscreen" ? "fullscreen" : "windowed",
                      }))
                    }
                  />
                  <SelectField
                    value={props.clientSettings.resolution}
                    options={[...new Set([props.clientSettings.resolution, ...clientResolutionOptions])]}
                    onValueChange={(value) =>
                      props.setClientSettings((current) => ({
                        ...current,
                        resolution: value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="secondary" onClick={() => void props.onAutoScanServer()}>
                  Auto Scan
                </Button>
                <Button variant="default" onClick={() => void props.onSavePathOverrides()}>
                  Save Path Overrides
                </Button>
                <Button variant="outline" onClick={() => void props.onResetPaths()}>
                  Reset to Auto
                </Button>
              </div>
            </div>
          </Section>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/70 p-2">
        {serverTabs.map((tab) => (
          <TabButton key={tab.id} active={props.serverTab === tab.id} label={tab.label} onClick={() => props.setServerTab(tab.id)} />
        ))}
      </div>
      {renderContent()}
    </div>
  );
}
