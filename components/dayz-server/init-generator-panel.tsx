"use client";

import type { ComponentType, Dispatch, SetStateAction } from "react";
import { Clock3, CloudSun, FileCode2, Package, Pin, PlugZap, Wrench } from "lucide-react";

import { SelectField, ToggleField } from "@/components/dayz-server/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_CHARACTER_CLASS = "SurvivorM_Boris";

const CHARACTER_OPTIONS = [
  {
    groupLabel: "Men",
    options: [
      { value: DEFAULT_CHARACTER_CLASS, label: "Boris" },
      { value: "SurvivorM_Cyril", label: "Cyril" },
      { value: "SurvivorM_Elias", label: "Elias" },
      { value: "SurvivorM_Francis", label: "Francis" },
      { value: "SurvivorM_Guo", label: "Guo" },
      { value: "SurvivorM_Hassan", label: "Hassan" },
      { value: "SurvivorM_Indar", label: "Indar" },
      { value: "SurvivorM_Jose", label: "Jose" },
      { value: "SurvivorM_Lewis", label: "Lewis" },
      { value: "SurvivorM_Manua", label: "Manua" },
      { value: "SurvivorM_Mirek", label: "Mirek" },
      { value: "SurvivorM_Niki", label: "Niki" },
      { value: "SurvivorM_Oliver", label: "Oliver" },
      { value: "SurvivorM_Peter", label: "Peter" },
      { value: "SurvivorM_Quinn", label: "Quinn" },
      { value: "SurvivorM_Rolf", label: "Rolf" },
      { value: "SurvivorM_Seth", label: "Seth" },
      { value: "SurvivorM_Taiki", label: "Taiki" },
    ],
  },
  {
    groupLabel: "Women",
    options: [
      { value: "SurvivorF_Eva", label: "Eva" },
      { value: "SurvivorF_Frida", label: "Frida" },
      { value: "SurvivorF_Gabi", label: "Gabi" },
      { value: "SurvivorF_Helga", label: "Helga" },
      { value: "SurvivorF_Irena", label: "Irena" },
      { value: "SurvivorF_Judy", label: "Judy" },
      { value: "SurvivorF_Keiko", label: "Keiko" },
      { value: "SurvivorF_Linda", label: "Linda" },
      { value: "SurvivorF_Maria", label: "Maria" },
      { value: "SurvivorF_Naomi", label: "Naomi" },
    ],
  },
];

function FieldGroup({
  title,
  description,
  icon: Icon,
  tone = "default",
  className,
  children,
}: {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "sky" | "amber" | "emerald" | "violet" | "rose";
  className?: string;
  children: React.ReactNode;
}) {
  const toneClasses: Record<NonNullable<typeof tone>, string> = {
    default: "border-border/60 bg-muted/15",
    sky: "border-sky-500/20 bg-sky-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    violet: "border-violet-500/20 bg-violet-500/5",
    rose: "border-rose-500/20 bg-rose-500/5",
  };

  return (
    <Card className={cn("overflow-visible rounded-2xl shadow-none", toneClasses[tone], className)}>
      <CardHeader className="space-y-1 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background/50">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">{children}</CardContent>
    </Card>
  );
}

function LabeledField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 xl:grid-cols-[180px_minmax(0,1fr)] xl:items-start">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextareaField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-xl border border-input bg-input/30 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:bg-input/40 focus-visible:ring-1 focus-visible:ring-ring",
        props.className,
      )}
    />
  );
}

type InitGeneratorPanelProps = {
  initGeneratorState: DayzInitGeneratorState;
  setInitGeneratorState: Dispatch<SetStateAction<DayzInitGeneratorState>>;
  presetNameInput: string;
  setPresetNameInput: (value: string) => void;
  selectedPresetId: string;
  setSelectedPresetId: (value: string) => void;
  onSavePreset: () => void;
  onLoadPreset: () => void;
  onDeletePreset: () => void;
  onBackup: () => Promise<void>;
  onApply: () => Promise<void>;
  previewResult: DayzInitPreviewResult | null;
  isBackupPending: boolean;
  isApplyPending: boolean;
};

export function InitGeneratorPanel({
  initGeneratorState,
  setInitGeneratorState,
  presetNameInput,
  setPresetNameInput,
  selectedPresetId,
  setSelectedPresetId,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onBackup,
  onApply,
  previewResult,
  isBackupPending,
  isApplyPending,
}: InitGeneratorPanelProps) {
  const isRandomWeather = initGeneratorState.weather.mode === "random";
  const isFixedSpawn = initGeneratorState.spawn.mode === "fixed";
  const isPresetSpawn = initGeneratorState.spawn.mode === "preset";
  const isNearObjectSpawn = initGeneratorState.spawn.mode === "near-object";
  const hasAutoEquipLoadout = initGeneratorState.helpers.autoEquipLoadout;
  const hasFixedDate = initGeneratorState.helpers.fixedDateEnabled;
  const hasTestTools = initGeneratorState.helpers.giveTestTools;

  const updateWeather = (field: keyof DayzInitWeatherSettings, value: string | boolean) => {
    setInitGeneratorState((current) => ({
      ...current,
      weather: { ...current.weather, [field]: value },
    }));
  };

  const updateSpawn = (field: keyof DayzInitSpawnSettings, value: string) => {
    setInitGeneratorState((current) => ({
      ...current,
      spawn: { ...current.spawn, [field]: value },
    }));
  };

  const updateLoadout = (field: keyof DayzInitLoadoutSettings, value: string) => {
    setInitGeneratorState((current) => ({
      ...current,
      loadout: { ...current.loadout, [field]: value },
    }));
  };

  const updateHelpers = (field: keyof DayzInitHelperSettings, value: string | boolean) => {
    setInitGeneratorState((current) => ({
      ...current,
      helpers: { ...current.helpers, [field]: value },
    }));
  };

  const updateModHooks = (field: keyof DayzInitModHooksSettings, value: string | boolean) => {
    setInitGeneratorState((current) => ({
      ...current,
      modHooks: { ...current.modHooks, [field]: value },
    }));
  };

  const updateSession = (field: keyof DayzInitSessionSettings, value: string) => {
    setInitGeneratorState((current) => ({
      ...current,
      session: { ...current.session, [field]: value },
    }));
  };

  return (
    <div className="grid gap-4 2xl:min-h-[calc(100vh-12rem)] 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:items-stretch">
      <div className="space-y-4">
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)]">
          <FieldGroup
            title="Weather"
            description="Clouds, rain, fog, wind and storm setup for stable mod testing."
            icon={CloudSun}
            tone="sky"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <LabeledField label="Mode">
                <SelectField
                  value={initGeneratorState.weather.mode === "random" ? "Random Range" : "Fixed"}
                  options={["Fixed", "Random Range"]}
                  onValueChange={(value) => updateWeather("mode", value === "Random Range" ? "random" : "fixed")}
                />
              </LabeledField>
              <LabeledField label="Dynamic Weather">
                <ToggleField
                  checked={initGeneratorState.weather.disableDynamicWeather}
                  label={initGeneratorState.weather.disableDynamicWeather ? "Locked" : "Mission Weather"}
                  onCheckedChange={(checked) => updateWeather("disableDynamicWeather", checked)}
                />
              </LabeledField>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {!isRandomWeather ? (
                <>
                  <Input value={initGeneratorState.weather.overcast} onChange={(event) => updateWeather("overcast", event.target.value)} placeholder="Overcast" />
                  <Input value={initGeneratorState.weather.rain} onChange={(event) => updateWeather("rain", event.target.value)} placeholder="Rain" />
                  <Input value={initGeneratorState.weather.fog} onChange={(event) => updateWeather("fog", event.target.value)} placeholder="Fog" />
                  <Input value={initGeneratorState.weather.wind} onChange={(event) => updateWeather("wind", event.target.value)} placeholder="Wind max (m/s)" />
                  <Input value={initGeneratorState.weather.storm} onChange={(event) => updateWeather("storm", event.target.value)} placeholder="Storm density" />
                </>
              ) : null}
            </div>
            {isRandomWeather ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={initGeneratorState.weather.overcastMin} onChange={(event) => updateWeather("overcastMin", event.target.value)} placeholder="Overcast min" />
                <Input value={initGeneratorState.weather.overcastMax} onChange={(event) => updateWeather("overcastMax", event.target.value)} placeholder="Overcast max" />
                <Input value={initGeneratorState.weather.rainMin} onChange={(event) => updateWeather("rainMin", event.target.value)} placeholder="Rain min" />
                <Input value={initGeneratorState.weather.rainMax} onChange={(event) => updateWeather("rainMax", event.target.value)} placeholder="Rain max" />
                <Input value={initGeneratorState.weather.fogMin} onChange={(event) => updateWeather("fogMin", event.target.value)} placeholder="Fog min" />
                <Input value={initGeneratorState.weather.fogMax} onChange={(event) => updateWeather("fogMax", event.target.value)} placeholder="Fog max" />
                <Input value={initGeneratorState.weather.windMin} onChange={(event) => updateWeather("windMin", event.target.value)} placeholder="Wind min" />
                <Input value={initGeneratorState.weather.windMax} onChange={(event) => updateWeather("windMax", event.target.value)} placeholder="Wind max" />
                <Input value={initGeneratorState.weather.stormMin} onChange={(event) => updateWeather("stormMin", event.target.value)} placeholder="Storm min" />
                <Input value={initGeneratorState.weather.stormMax} onChange={(event) => updateWeather("stormMax", event.target.value)} placeholder="Storm max" />
              </div>
            ) : null}
          </FieldGroup>

          <FieldGroup
            title="Spawn"
            description="Random, fixed, preset-based or near-object spawn logic."
            icon={Pin}
            tone="amber"
          >
            <div className="grid gap-3">
              <LabeledField label="Spawn Mode">
                <SelectField
                  value={
                    initGeneratorState.spawn.mode === "fixed"
                      ? "Fixed Position"
                      : initGeneratorState.spawn.mode === "preset"
                        ? "Preset Point"
                        : initGeneratorState.spawn.mode === "near-object"
                          ? "Near Object"
                          : "Random"
                  }
                  options={["Random", "Fixed Position", "Preset Point", "Near Object"]}
                  onValueChange={(value) =>
                    updateSpawn(
                      "mode",
                      value === "Fixed Position"
                        ? "fixed"
                        : value === "Preset Point"
                          ? "preset"
                          : value === "Near Object"
                            ? "near-object"
                            : "random",
                    )
                  }
                />
              </LabeledField>
              {isFixedSpawn ? (
                <Input
                  value={initGeneratorState.spawn.fixedPosition}
                  onChange={(event) => updateSpawn("fixedPosition", event.target.value)}
                  placeholder="Fixed position: X Y Z, e.g. 2208.948730 68.414986 2251.680908"
                />
              ) : null}
              {isPresetSpawn ? (
                <>
                  <TextareaField
                    value={initGeneratorState.spawn.presetPointsText}
                    onChange={(event) => updateSpawn("presetPointsText", event.target.value)}
                    placeholder="Preset points: Name|X Y Z"
                    className="min-h-24"
                  />
                  <Input
                    value={initGeneratorState.spawn.presetPointName}
                    onChange={(event) => updateSpawn("presetPointName", event.target.value)}
                    placeholder="Preset point name"
                  />
                </>
              ) : null}
              {isNearObjectSpawn ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={initGeneratorState.spawn.nearObjectClassname}
                      onChange={(event) => updateSpawn("nearObjectClassname", event.target.value)}
                      placeholder="Target object classname"
                    />
                    <Input
                      value={initGeneratorState.spawn.nearObjectRadius}
                      onChange={(event) => updateSpawn("nearObjectRadius", event.target.value)}
                      placeholder="Search radius"
                    />
                    <Input
                      value={initGeneratorState.spawn.nearObjectAnchor}
                      onChange={(event) => updateSpawn("nearObjectAnchor", event.target.value)}
                      placeholder="Anchor coordinates"
                    />
                    <Input
                      value={initGeneratorState.spawn.nearObjectOffset}
                      onChange={(event) => updateSpawn("nearObjectOffset", event.target.value)}
                      placeholder="Offset from object, e.g. 2 0 2"
                    />
                  </div>
                </>
              ) : null}
            </div>
          </FieldGroup>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
          <FieldGroup
            title="Starter Loadout"
            description="Clothing, weapons, attachments and inventory groups."
            icon={Package}
            tone="emerald"
          >
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto_auto]">
              <Input
                value={presetNameInput}
                onChange={(event) => setPresetNameInput(event.target.value)}
                placeholder="Preset name"
              />
              <SelectField
                value={selectedPresetId || initGeneratorState.loadoutPresets[0]?.id || ""}
                options={
                  initGeneratorState.loadoutPresets.length > 0
                    ? initGeneratorState.loadoutPresets.map((preset) => ({
                        value: preset.id,
                        label: preset.name,
                      }))
                    : ["no-presets"]
                }
                onValueChange={setSelectedPresetId}
              />
              <Button variant="outline" onClick={onLoadPreset}>
                Load
              </Button>
              <Button variant="outline" onClick={onSavePreset}>
                Save
              </Button>
              <Button variant="ghost" onClick={onDeletePreset}>
                Delete
              </Button>
            </div>
            {hasAutoEquipLoadout ? (
              <>
                <LabeledField
                  label="Character"
                  description="Select a specific survivor model for the spawned player."
                >
                  <SelectField
                    value={initGeneratorState.loadout.characterClass}
                    options={CHARACTER_OPTIONS}
                    onValueChange={(value) => updateLoadout("characterClass", value)}
                  />
                </LabeledField>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Input value={initGeneratorState.loadout.body} onChange={(event) => updateLoadout("body", event.target.value)} placeholder="Body clothing" />
                  <Input value={initGeneratorState.loadout.legs} onChange={(event) => updateLoadout("legs", event.target.value)} placeholder="Legs clothing" />
                  <Input value={initGeneratorState.loadout.feet} onChange={(event) => updateLoadout("feet", event.target.value)} placeholder="Footwear" />
                  <Input value={initGeneratorState.loadout.backpack} onChange={(event) => updateLoadout("backpack", event.target.value)} placeholder="Backpack" />
                  <Input value={initGeneratorState.loadout.vest} onChange={(event) => updateLoadout("vest", event.target.value)} placeholder="Vest" />
                  <Input value={initGeneratorState.loadout.headgear} onChange={(event) => updateLoadout("headgear", event.target.value)} placeholder="Headgear" />
                  <Input value={initGeneratorState.loadout.gloves} onChange={(event) => updateLoadout("gloves", event.target.value)} placeholder="Gloves" />
                  <Input value={initGeneratorState.loadout.meleeWeapon} onChange={(event) => updateLoadout("meleeWeapon", event.target.value)} placeholder="Melee weapon" />
                  <Input value={initGeneratorState.loadout.primaryWeapon} onChange={(event) => updateLoadout("primaryWeapon", event.target.value)} placeholder="Primary weapon" />
                  <Input value={initGeneratorState.loadout.secondaryWeapon} onChange={(event) => updateLoadout("secondaryWeapon", event.target.value)} placeholder="Secondary weapon" />
                  <Input value={initGeneratorState.loadout.weaponAttachments} onChange={(event) => updateLoadout("weaponAttachments", event.target.value)} placeholder="Weapon attachments" className="xl:col-span-2" />
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  <TextareaField value={initGeneratorState.loadout.inventoryItems} onChange={(event) => updateLoadout("inventoryItems", event.target.value)} placeholder="Starter items" />
                  <TextareaField value={initGeneratorState.loadout.magazines} onChange={(event) => updateLoadout("magazines", event.target.value)} placeholder="Magazines and ammo" />
                  <TextareaField value={initGeneratorState.loadout.foodWater} onChange={(event) => updateLoadout("foodWater", event.target.value)} placeholder="Food and water" />
                  <TextareaField value={initGeneratorState.loadout.medical} onChange={(event) => updateLoadout("medical", event.target.value)} placeholder="Medical items" />
                  <TextareaField className="xl:col-span-2" value={initGeneratorState.loadout.extraItems} onChange={(event) => updateLoadout("extraItems", event.target.value)} placeholder="Extra items" />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                Starter loadout fields are hidden because <span className="font-medium text-foreground">Auto Equip</span> is disabled.
              </div>
            )}
          </FieldGroup>

          <div className="space-y-4">
            <FieldGroup
              title="Session Timers"
              description="Mission login/logout wait times written to db/globals.xml for the selected mission."
              icon={Clock3}
              tone="default"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={initGeneratorState.session.loginDelaySeconds}
                  onChange={(event) => updateSession("loginDelaySeconds", event.target.value)}
                  placeholder="Login delay (seconds)"
                  type="number"
                />
                <Input
                  value={initGeneratorState.session.logoutDelaySeconds}
                  onChange={(event) => updateSession("logoutDelaySeconds", event.target.value)}
                  placeholder="Logout delay (seconds)"
                  type="number"
                />
              </div>
            </FieldGroup>

            <FieldGroup
              title="Test Server Helpers"
              description="Quality-of-life helpers for fast mod validation."
              icon={Wrench}
              tone="violet"
            >
              <div className="flex flex-wrap gap-3">
                <ToggleField checked={initGeneratorState.helpers.fillStats} label="Fill Stats" onCheckedChange={(checked) => updateHelpers("fillStats", checked)} />
                <ToggleField checked={initGeneratorState.helpers.clearAgents} label="Clear Agents" onCheckedChange={(checked) => updateHelpers("clearAgents", checked)} />
                <ToggleField checked={initGeneratorState.helpers.removeBleedingSources} label="No Bleeding" onCheckedChange={(checked) => updateHelpers("removeBleedingSources", checked)} />
                <ToggleField checked={initGeneratorState.helpers.cleanBloodyHands} label="Clean Hands" onCheckedChange={(checked) => updateHelpers("cleanBloodyHands", checked)} />
                <ToggleField checked={initGeneratorState.helpers.grantInfluenzaResistance} label="Flu Resistance" onCheckedChange={(checked) => updateHelpers("grantInfluenzaResistance", checked)} />
                <ToggleField checked={initGeneratorState.helpers.autoEquipLoadout} label="Auto Equip" onCheckedChange={(checked) => updateHelpers("autoEquipLoadout", checked)} />
                <ToggleField checked={initGeneratorState.helpers.giveTestTools} label="Test Tools" onCheckedChange={(checked) => updateHelpers("giveTestTools", checked)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleField checked={initGeneratorState.helpers.fixedDateEnabled} label={initGeneratorState.helpers.fixedDateEnabled ? "Fixed Time Enabled" : "Use Mission Time"} onCheckedChange={(checked) => updateHelpers("fixedDateEnabled", checked)} />
                {hasFixedDate ? (
                  <Input value={initGeneratorState.helpers.fixedDate} onChange={(event) => updateHelpers("fixedDate", event.target.value)} placeholder="2026-03-26 12:00" />
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground">
                    Mission/default date will be used.
                  </div>
                )}
              </div>
              {hasTestTools ? (
                <TextareaField value={initGeneratorState.helpers.testTools} onChange={(event) => updateHelpers("testTools", event.target.value)} placeholder="One classname per line for helper tools" />
              ) : null}
            </FieldGroup>

            <FieldGroup
              title="Mod Hooks"
              description="Optional blocks for active mods and manual modded classnames."
              icon={PlugZap}
              tone="rose"
            >
              <div className="flex flex-wrap gap-3">
                <ToggleField checked={initGeneratorState.modHooks.includeActiveModsComment} label="Comment Active Mods" onCheckedChange={(checked) => updateModHooks("includeActiveModsComment", checked)} />
              </div>
              <TextareaField value={initGeneratorState.modHooks.manualItems} onChange={(event) => updateModHooks("manualItems", event.target.value)} placeholder="Manual mod item classnames to inject into starter loadout" />
            </FieldGroup>
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col 2xl:sticky 2xl:top-3 2xl:self-stretch">
        <FieldGroup
          title="Preview"
          description="Generated init.c output. Existing files are backed up before the first write."
          icon={FileCode2}
          tone="default"
          className="flex h-full flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {previewResult ? (
                <>
                  <span className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">
                    {previewResult.mode}
                  </span>
                  <span className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">
                    {previewResult.hasExistingInit ? "Existing init.c" : "New init.c"}
                  </span>
                  <span
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs",
                      previewResult.isMissionWritable
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-300",
                    )}
                  >
                    {previewResult.isMissionWritable ? "Mission Writable" : "Mission Read-Only"}
                  </span>
                </>
              ) : (
                <span className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">
                  Waiting for preview
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void onBackup()} disabled={isBackupPending}>
                {isBackupPending ? "Backing Up..." : "Backup init.c"}
              </Button>
              <Button onClick={() => void onApply()} disabled={isApplyPending}>
                {isApplyPending ? "Applying..." : "Apply init.c"}
              </Button>
            </div>
          </div>
          {previewResult ? (
            <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
              <div>Mission Path: {previewResult.missionPath}</div>
              <div>Init Path: {previewResult.initPath}</div>
              {!previewResult.isMissionWritable && previewResult.missionWriteError ? (
                <div className="text-rose-300">Write Error: {previewResult.missionWriteError}</div>
              ) : null}
            </div>
          ) : null}
          <pre className="code-surface h-[calc(100vh-18rem)] min-h-[620px] flex-1 overflow-auto rounded-xl border border-border/60 p-4 font-mono text-xs leading-6 2xl:h-[calc(100vh-14rem)]">
            {previewResult?.preview || "// Generate preview to inspect the final init.c output."}
          </pre>
        </FieldGroup>
      </div>
    </div>
  );
}
