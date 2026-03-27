"use client";

import { memo, useDeferredValue, useEffect, useState } from "react";
import { Search } from "lucide-react";

import { SelectField } from "@/components/dayz-server/form-controls";
import { formatBytes, formatTimestamp, getModSignatureLabel, getModSourceLabel } from "@/components/dayz-server/utils";
import { Section } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onOpenModDirectory,
}: {
  mod: DayzParsedMod;
  toggleLabel: string;
  modId: string;
  onToggleEnabled: (modId: string) => void;
  onOpenModDirectory: (modPath: string) => Promise<void>;
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                void onOpenModDirectory(mod.path);
              }}
            >
              Open Folder
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});

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
                    onOpenModDirectory={onOpenModDirectory}
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
                    onOpenModDirectory={onOpenModDirectory}
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

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Mod Presets</p>
                  <p className="mt-1 text-sm text-muted-foreground">Save and restore reusable enabled-mod sets.</p>
                </div>
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
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" onClick={onSaveModPreset}>
                    Save
                  </Button>
                  <Button variant="outline" onClick={onLoadModPreset} disabled={modPresets.length === 0}>
                    Load
                  </Button>
                  <Button variant="outline" onClick={onDeleteModPreset} disabled={modPresets.length === 0}>
                    Delete
                  </Button>
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
                    onOpenModDirectory={onOpenModDirectory}
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
