"use client";

import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FolderOpen, Layers3, Search, ShieldCheck, ShieldOff, Wrench } from "lucide-react";

import { SelectField } from "@/components/dayz-server/form-controls";
import { Section } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { formatBytes, formatTimestamp, getModSignatureLabel, getModSourceLabel } from "@/components/dayz-server/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { VirtualList } from "@/components/ui/virtual-list";
import {
  WorkspaceEmptyState,
  WorkspaceInfoRow,
  WorkspaceMetricTile,
  WorkspacePanel,
} from "@/components/workspace/workspace-kit";
import { cn } from "@/lib/utils";

type ModsPageProps = Pick<
  DayzServerWorkspaceProps,
  | "modsSearch"
  | "setModsSearch"
  | "availableWorkshopMods"
  | "availableLocalMods"
  | "enabledMods"
  | "modPresets"
  | "modPresetNameInput"
  | "setModPresetNameInput"
  | "selectedModPresetId"
  | "setSelectedModPresetId"
  | "onSaveModPreset"
  | "onLoadModPreset"
  | "onDeleteModPreset"
  | "onToggleModEnabled"
  | "onOpenModDirectory"
  | "onRefreshMods"
  | "onImportLocalMod"
>;

type ModFilterScope = "all" | "enabled" | "workshop" | "local";

const MOD_SCOPE_OPTIONS: Array<{
  id: ModFilterScope;
  label: string;
}> = [
  { id: "all", label: "All Mods" },
  { id: "enabled", label: "Enabled" },
  { id: "workshop", label: "Workshop" },
  { id: "local", label: "Local" },
];

const MOD_ROW_HEIGHT = 92;
const VIRTUALIZATION_THRESHOLD = 80;

function buildMetaLine(mod: DayzParsedMod) {
  return [mod.author || null, mod.version ? `v${mod.version}` : null, formatBytes(mod.sizeBytes)]
    .filter(Boolean)
    .join(" • ");
}

function getScopeLabel(scope: ModFilterScope) {
  switch (scope) {
    case "enabled":
      return "Enabled mods";
    case "workshop":
      return "Workshop mods";
    case "local":
      return "Local mods";
    case "all":
    default:
      return "All detected mods";
  }
}

function filterModsByScope(
  scope: ModFilterScope,
  workshopMods: DayzParsedMod[],
  localMods: DayzParsedMod[],
  enabledMods: DayzParsedMod[],
) {
  switch (scope) {
    case "enabled":
      return enabledMods;
    case "workshop":
      return workshopMods;
    case "local":
      return localMods;
    case "all":
    default:
      return [...enabledMods, ...workshopMods.filter((mod) => !mod.enabled), ...localMods.filter((mod) => !mod.enabled)];
  }
}

function ModsPageSkeleton() {
  return (
    <Section title="Mods" description="Loading mod inventory and saved presets.">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="h-10 rounded-4xl border border-input bg-input/20" />
              <div className="h-10 w-32 rounded-4xl border border-border/60 bg-muted/30" />
              <div className="h-10 w-32 rounded-4xl border border-border/60 bg-muted/30" />
            </div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="space-y-3">
              <div className="h-5 w-40 rounded bg-muted/40" />
              <div className="h-[28rem] rounded-[20px] border border-border/60 bg-background/20" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="space-y-3">
            <div className="h-5 w-32 rounded bg-muted/40" />
            <div className="h-24 rounded-[20px] border border-border/60 bg-background/20" />
            <div className="h-24 rounded-[20px] border border-border/60 bg-background/20" />
            <div className="h-24 rounded-[20px] border border-border/60 bg-background/20" />
          </div>
        </div>
      </div>
    </Section>
  );
}

function ModsToolbar({
  modsSearch,
  setModsSearch,
  onRefreshMods,
  onImportLocalMod,
}: Pick<ModsPageProps, "modsSearch" | "setModsSearch" | "onRefreshMods" | "onImportLocalMod">) {
  return (
    <WorkspacePanel
      title="Library Controls"
      description="Search the catalog, rescan detected mods or import a local folder."
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={modsSearch}
            onChange={(event) => setModsSearch(event.target.value)}
            placeholder="Search mods, authors, versions, ids and paths"
            className="pl-9"
          />
        </div>
        <Button variant="default" onClick={() => void onRefreshMods()}>
          <Layers3 className="size-4" />
          Refresh Mods
        </Button>
        <Button variant="outline" onClick={() => void onImportLocalMod()}>
          <FolderOpen className="size-4" />
          Add Local Mod
        </Button>
      </div>
    </WorkspacePanel>
  );
}

function ModsFilterTabs({
  activeScope,
  setActiveScope,
  counts,
}: {
  activeScope: ModFilterScope;
  setActiveScope: (scope: ModFilterScope) => void;
  counts: Record<ModFilterScope, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOD_SCOPE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setActiveScope(option.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            activeScope === option.id
              ? "border-border bg-accent text-accent-foreground"
              : "border-transparent bg-background/40 text-muted-foreground hover:border-border/50 hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <span>{option.label}</span>
          <Badge variant={activeScope === option.id ? "secondary" : "outline"}>{counts[option.id]}</Badge>
        </button>
      ))}
    </div>
  );
}

const ModsListRow = memo(function ModsListRow({
  mod,
  selected,
  onSelect,
  onToggleModEnabled,
  onOpenModDirectory,
}: {
  mod: DayzParsedMod;
  selected: boolean;
  onSelect: (modId: string) => void;
  onToggleModEnabled: (modId: string) => void;
  onOpenModDirectory: (modPath: string) => Promise<void>;
}) {
  return (
    <div className="px-3">
      <div
        className={cn(
          "mods-list__row grid h-[80px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-4 transition-colors",
          selected
            ? "border-border bg-accent text-accent-foreground"
            : "border-border/60 bg-background text-foreground hover:bg-muted/35",
        )}
      >
        <button
          type="button"
          aria-label={mod.enabled ? `Disable ${mod.displayName}` : `Enable ${mod.displayName}`}
          aria-pressed={mod.enabled}
          onClick={(event) => {
            event.stopPropagation();
            onToggleModEnabled(mod.id);
          }}
          className="flex size-10 items-center justify-center rounded-md border bg-background transition-colors hover:bg-muted/40"
        >
          <Checkbox checked={mod.enabled} className="pointer-events-none" />
        </button>

        <button
          type="button"
          onClick={() => onSelect(mod.id)}
          className="min-w-0 text-left focus-visible:outline-none"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{mod.displayName}</p>
            <Badge variant="secondary">{getModSourceLabel(mod)}</Badge>
            <Badge variant="outline">{mod.state}</Badge>
            {mod.enabled ? <Badge variant="default">Enabled</Badge> : null}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{buildMetaLine(mod)}</p>
          <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">{mod.path}</p>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            void onOpenModDirectory(mod.path);
          }}
        >
          Open Folder
        </Button>
      </div>
    </div>
  );
});

function ModsList({
  mods,
  selectedModId,
  onSelect,
  onToggleModEnabled,
  onOpenModDirectory,
}: {
  mods: DayzParsedMod[];
  selectedModId: string;
  onSelect: (modId: string) => void;
  onToggleModEnabled: (modId: string) => void;
  onOpenModDirectory: (modPath: string) => Promise<void>;
}) {
  if (mods.length === 0) {
    return (
      <WorkspaceEmptyState
        icon={Wrench}
        title="No mods in this view"
        description="Change the filter, refresh detected mods or import a local folder to populate the workspace."
      />
    );
  }

  const useVirtualizedList = mods.length >= VIRTUALIZATION_THRESHOLD;

  if (!useVirtualizedList) {
    return (
      <div className="app-soft-scroll app-scroll-fade app-scroll-fade-tight h-[min(62vh,44rem)] overflow-auto py-3">
        <div className="space-y-3">
          {mods.map((mod) => (
            <ModsListRow
              key={mod.id}
              mod={mod}
              selected={selectedModId === mod.id}
              onSelect={onSelect}
              onToggleModEnabled={onToggleModEnabled}
              onOpenModDirectory={onOpenModDirectory}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <VirtualList
      items={mods}
      itemHeight={MOD_ROW_HEIGHT}
      paddingTop={12}
      paddingBottom={12}
      className="h-[min(62vh,44rem)]"
      renderItem={(mod) => (
        <ModsListRow
          mod={mod}
          selected={selectedModId === mod.id}
          onSelect={onSelect}
          onToggleModEnabled={onToggleModEnabled}
          onOpenModDirectory={onOpenModDirectory}
        />
      )}
    />
  );
}

function ModPresetPanel({
  modPresets,
  modPresetNameInput,
  setModPresetNameInput,
  selectedModPresetId,
  setSelectedModPresetId,
  onSaveModPreset,
  onLoadModPreset,
  onDeleteModPreset,
  enabledCount,
}: Pick<
  ModsPageProps,
  | "modPresets"
  | "modPresetNameInput"
  | "setModPresetNameInput"
  | "selectedModPresetId"
  | "setSelectedModPresetId"
  | "onSaveModPreset"
  | "onLoadModPreset"
  | "onDeleteModPreset"
> & { enabledCount: number }) {
  return (
    <WorkspacePanel
      title="Preset Workspace"
      description="Save the current enabled set or restore a previous launch profile."
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <WorkspaceMetricTile label="Enabled" value={enabledCount} note="Mods currently active for launch." />
        <WorkspaceMetricTile label="Presets" value={modPresets.length} note="Saved reusable loadouts." />
        <WorkspaceMetricTile
          label="Current Preset"
          value={selectedModPresetId ? modPresets.find((preset) => preset.id === selectedModPresetId)?.name ?? "Custom" : "Custom"}
          note="Selection used by save/load actions."
        />
      </div>

      <div className="grid gap-3">
        <Input
          value={modPresetNameInput}
          onChange={(event) => setModPresetNameInput(event.target.value)}
          placeholder="Preset name"
        />
        <SelectField
          value={
            selectedModPresetId && modPresets.some((preset) => preset.id === selectedModPresetId)
              ? selectedModPresetId
              : "no-presets"
          }
          options={
            modPresets.length > 0
              ? modPresets.map((preset) => ({
                  value: preset.id,
                  label: preset.name,
                }))
              : [{ value: "no-presets", label: "No presets" }]
          }
          onValueChange={(value) => {
            if (value === "no-presets") {
              setSelectedModPresetId("");
              setModPresetNameInput("");
              return;
            }

            const selectedPreset = modPresets.find((preset) => preset.id === value);
            setSelectedModPresetId(value);
            setModPresetNameInput(selectedPreset?.name ?? "");
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="default" onClick={onSaveModPreset}>
          Save Preset
        </Button>
        <Button variant="outline" onClick={onLoadModPreset} disabled={modPresets.length === 0}>
          Load
        </Button>
        <Button variant="outline" onClick={onDeleteModPreset} disabled={modPresets.length === 0}>
          Delete
        </Button>
      </div>
    </WorkspacePanel>
  );
}

function ModInspector({
  mod,
  onToggleModEnabled,
  onOpenModDirectory,
}: {
  mod: DayzParsedMod | null;
  onToggleModEnabled: (modId: string) => void;
  onOpenModDirectory: (modPath: string) => Promise<void>;
}) {
  if (!mod) {
    return (
      <WorkspacePanel title="Mod Inspector" description="Pick a mod from the list to inspect its details and actions.">
        <WorkspaceEmptyState
          icon={Wrench}
          title="Nothing selected"
          description="Select any mod to review validation state, source details and quick actions without expanding items inside the list."
        />
      </WorkspacePanel>
    );
  }

  return (
    <div className="space-y-4 xl:sticky xl:top-0">
      <WorkspacePanel
        title="Mod Inspector"
        description="Full details for the currently selected mod."
        contentClassName="space-y-4"
      >
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getModSourceLabel(mod)}</Badge>
            <Badge variant="outline">{mod.state}</Badge>
            <Badge variant={mod.enabled ? "default" : "outline"}>{mod.enabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{mod.displayName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{buildMetaLine(mod)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={mod.enabled ? "secondary" : "default"} onClick={() => onToggleModEnabled(mod.id)}>
              {mod.enabled ? "Disable Mod" : "Enable Mod"}
            </Button>
            <Button variant="outline" onClick={() => void onOpenModDirectory(mod.path)}>
              Open Folder
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <WorkspaceInfoRow label="Overview" value={
            <div className="space-y-2">
              <div>Name: {mod.name}</div>
              <div>Launch mode: {mod.launchMode}</div>
              <div>Workshop ID: {mod.workshopId || "Local mod"}</div>
            </div>
          } />
          <WorkspaceInfoRow label="Files & Source" value={
            <div className="space-y-2">
              <div className="break-all">{mod.path}</div>
              <div>Created: {mod.createdAt ? formatTimestamp(mod.createdAt) : "Unknown"}</div>
              <div>Updated: {formatTimestamp(mod.updatedAt)}</div>
              <div>Size: {formatBytes(mod.sizeBytes)}</div>
            </div>
          } />
          <WorkspaceInfoRow label="Validation" value={
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {mod.isFullySigned ? <ShieldCheck className="size-4 text-emerald-500" /> : <ShieldOff className="size-4 text-amber-500" />}
                <span>{getModSignatureLabel(mod)}</span>
              </div>
              <div>Addons folder: {mod.hasAddonsDir ? "Present" : "Missing"}</div>
              <div>Keys folder: {mod.hasKeysDir ? "Present" : "Missing"}</div>
              <div>PBO files: {mod.pboCount}</div>
              <div>Signed PBO files: {mod.signedPboCount}</div>
            </div>
          } />
        </div>
      </WorkspacePanel>
    </div>
  );
}

const ModsPageContent = memo(function ModsPageContent({
  modsSearch,
  setModsSearch,
  availableWorkshopMods,
  availableLocalMods,
  enabledMods,
  modPresets,
  modPresetNameInput,
  setModPresetNameInput,
  selectedModPresetId,
  setSelectedModPresetId,
  onSaveModPreset,
  onLoadModPreset,
  onDeleteModPreset,
  onToggleModEnabled,
  onOpenModDirectory,
  onRefreshMods,
  onImportLocalMod,
}: ModsPageProps) {
  const deferredWorkshopMods = useDeferredValue(availableWorkshopMods);
  const deferredLocalMods = useDeferredValue(availableLocalMods);
  const deferredEnabledMods = useDeferredValue(enabledMods);

  const [activeScope, setActiveScope] = useState<ModFilterScope>("all");
  const [selectedModId, setSelectedModId] = useState("");

  const scopedMods = useMemo(
    () => filterModsByScope(activeScope, deferredWorkshopMods, deferredLocalMods, deferredEnabledMods),
    [activeScope, deferredEnabledMods, deferredLocalMods, deferredWorkshopMods],
  );

  const selectedMod = useMemo(
    () => scopedMods.find((mod) => mod.id === selectedModId) ?? scopedMods[0] ?? null,
    [scopedMods, selectedModId],
  );

  useEffect(() => {
    if (!selectedMod) {
      setSelectedModId("");
      return;
    }

    if (selectedMod.id !== selectedModId) {
      setSelectedModId(selectedMod.id);
    }
  }, [selectedMod, selectedModId]);

  const counts = useMemo(
    () => ({
      all: deferredEnabledMods.length + deferredWorkshopMods.filter((mod) => !mod.enabled).length + deferredLocalMods.filter((mod) => !mod.enabled).length,
      enabled: deferredEnabledMods.length,
      workshop: deferredWorkshopMods.length,
      local: deferredLocalMods.length,
    }),
    [deferredEnabledMods, deferredLocalMods, deferredWorkshopMods],
  );

  return (
    <Section
      title="Mods"
      description="One focused workspace for discovery, enablement and inspection. Details live in the inspector, so the list stays fast and readable."
    >
      <div className="space-y-4">
        <ModsToolbar
          modsSearch={modsSearch}
          setModsSearch={setModsSearch}
          onRefreshMods={onRefreshMods}
          onImportLocalMod={onImportLocalMod}
        />

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <ModPresetPanel
              modPresets={modPresets}
              modPresetNameInput={modPresetNameInput}
              setModPresetNameInput={setModPresetNameInput}
              selectedModPresetId={selectedModPresetId}
              setSelectedModPresetId={setSelectedModPresetId}
              onSaveModPreset={onSaveModPreset}
              onLoadModPreset={onLoadModPreset}
              onDeleteModPreset={onDeleteModPreset}
              enabledCount={deferredEnabledMods.length}
            />

            <WorkspacePanel
              title={getScopeLabel(activeScope)}
              description="Use filters to move between all detected mods, enabled set, Workshop items and local folders without switching scroll regions."
              contentClassName="space-y-4"
            >
              <ModsFilterTabs activeScope={activeScope} setActiveScope={setActiveScope} counts={counts} />

              <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <span>{counts[activeScope]} results</span>
                <span>•</span>
                <span>{deferredEnabledMods.length} enabled</span>
                <span>•</span>
                <span>{deferredLocalMods.length} local</span>
                <span>•</span>
                <span>{deferredWorkshopMods.length} workshop</span>
              </div>

              <ModsList
                mods={scopedMods}
                selectedModId={selectedModId}
                onSelect={setSelectedModId}
                onToggleModEnabled={onToggleModEnabled}
                onOpenModDirectory={onOpenModDirectory}
              />
            </WorkspacePanel>
          </div>

          <ModInspector
            mod={selectedMod}
            onToggleModEnabled={onToggleModEnabled}
            onOpenModDirectory={onOpenModDirectory}
          />
        </div>
      </div>
    </Section>
  );
});

export function DeferredModsPage(props: ModsPageProps & { active: boolean }) {
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

  return <ModsPageContent {...props} />;
}
