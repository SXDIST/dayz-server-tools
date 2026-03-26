"use client";

import { MonitorCog, MoonStar, Palette, PanelsTopLeft, Sparkles, SunMedium, Type } from "lucide-react";

import { SelectField, ToggleField } from "@/components/dayz-server/form-controls";
import {
  fontModeOptions,
  monoFontOptions,
  sansFontOptions,
  themeOptions,
  type LauncherPreferences,
} from "@/components/launcher/preferences";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">{" "}{title}</CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">{children}</CardContent>
    </Card>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-border/60 py-4 last:border-b-0 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function SettingsPage({
  preferences,
  setPreferences,
}: {
  preferences: LauncherPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<LauncherPreferences>>;
}) {
  const updatePreference = <K extends keyof LauncherPreferences>(key: K, value: LauncherPreferences[K]) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Launcher-wide preferences for appearance, motion and workspace behavior.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Launcher</Badge>
          <Badge variant="secondary">Appearance</Badge>
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Section
            title="Appearance"
            description="Theme, interface fonts and heading typography."
            icon={Palette}
          >
            <SettingRow label="Theme" description="Choose system sync, light or dark rendering.">
              <SelectField
                value={themeOptions.find((item) => item.value === preferences.themeMode)?.label ?? "Dark"}
                options={themeOptions.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => updatePreference("themeMode", value as LauncherPreferences["themeMode"])}
              />
            </SettingRow>

            <SettingRow label="Interface Style" description="Switch the main app typography between sans and mono.">
              <SelectField
                value={fontModeOptions.find((item) => item.value === preferences.interfaceMode)?.label ?? "Mono"}
                options={fontModeOptions.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => updatePreference("interfaceMode", value as LauncherPreferences["interfaceMode"])}
              />
            </SettingRow>

            {preferences.interfaceMode === "sans" ? (
              <SettingRow label="Interface Sans" description="Primary font for general UI text.">
                <SelectField
                  value={sansFontOptions.find((item) => item.value === preferences.interfaceSansFont)?.label ?? "Inter"}
                  options={sansFontOptions.map((item) => ({ value: item.value, label: item.label }))}
                  onValueChange={(value) => updatePreference("interfaceSansFont", value as LauncherPreferences["interfaceSansFont"])}
                />
              </SettingRow>
            ) : (
              <SettingRow label="Interface Mono" description="Primary font for the whole interface in mono mode.">
                <SelectField
                  value={monoFontOptions.find((item) => item.value === preferences.interfaceMonoFont)?.label ?? "JetBrains Mono"}
                  options={monoFontOptions.map((item) => ({ value: item.value, label: item.label }))}
                  onValueChange={(value) => updatePreference("interfaceMonoFont", value as LauncherPreferences["interfaceMonoFont"])}
                />
              </SettingRow>
            )}

            <SettingRow label="Header Style" description="Choose whether headings should render in sans or mono.">
              <SelectField
                value={fontModeOptions.find((item) => item.value === preferences.headingMode)?.label ?? "Mono"}
                options={fontModeOptions.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => updatePreference("headingMode", value as LauncherPreferences["headingMode"])}
              />
            </SettingRow>

            <SettingRow label="Header Sans" description="Sans family used when heading style is set to Sans.">
              <SelectField
                value={sansFontOptions.find((item) => item.value === preferences.headingSansFont)?.label ?? "Geist"}
                options={sansFontOptions.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => updatePreference("headingSansFont", value as LauncherPreferences["headingSansFont"])}
              />
            </SettingRow>

            <SettingRow label="Header Mono" description="Mono family used when heading style is set to Mono.">
              <SelectField
                value={monoFontOptions.find((item) => item.value === preferences.headingMonoFont)?.label ?? "JetBrains Mono"}
                options={monoFontOptions.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => updatePreference("headingMonoFont", value as LauncherPreferences["headingMonoFont"])}
              />
            </SettingRow>
          </Section>

          <Section
            title="Interface"
            description="Visual comfort and shell layout behavior."
            icon={PanelsTopLeft}
          >
            <SettingRow label="Background Effects" description="Show or hide stars and meteor animations behind the workspace.">
              <ToggleField
                checked={preferences.backgroundEffects}
                label={preferences.backgroundEffects ? "Enabled" : "Disabled"}
                onCheckedChange={(checked) => updatePreference("backgroundEffects", checked)}
              />
            </SettingRow>
            <SettingRow label="Reduce Motion" description="Tone down animated transitions and decorative movement.">
              <ToggleField
                checked={preferences.reduceMotion}
                label={preferences.reduceMotion ? "Enabled" : "Disabled"}
                onCheckedChange={(checked) => updatePreference("reduceMotion", checked)}
              />
            </SettingRow>
            <SettingRow label="Compact Sidebar" description="Use a denser launcher sidebar with smaller spacing.">
              <ToggleField
                checked={preferences.compactSidebar}
                label={preferences.compactSidebar ? "Compact" : "Comfort"}
                onCheckedChange={(checked) => updatePreference("compactSidebar", checked)}
              />
            </SettingRow>
          </Section>

          <Section
            title="Behavior"
            description="Useful launcher workflow preferences."
            icon={MonitorCog}
          >
            <SettingRow label="Remember Last Page" description="Restore the last opened launcher page on next startup.">
              <ToggleField
                checked={preferences.rememberLastView}
                label={preferences.rememberLastView ? "Enabled" : "Disabled"}
                onCheckedChange={(checked) => updatePreference("rememberLastView", checked)}
              />
            </SettingRow>
          </Section>
        </div>

        <div className="2xl:sticky 2xl:top-5 2xl:self-start">
          <Section
            title="Preview"
            description="Live summary of the active launcher look."
            icon={Sparkles}
          >
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {preferences.themeMode === "system" ? <MonitorCog className="size-3.5" /> : preferences.themeMode === "dark" ? <MoonStar className="size-3.5" /> : <SunMedium className="size-3.5" />}
                  {preferences.themeMode}
                </Badge>
                <Badge variant="secondary">
                  <Type className="size-3.5" />
                  {preferences.interfaceMode === "mono" ? "Mono UI" : "Sans UI"}
                </Badge>
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-semibold text-foreground">DayZ Tools Launcher</h2>
                <p className="text-sm text-muted-foreground">
                  Appearance preferences apply instantly to the launcher shell, cards, panels and headings.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                <p className="text-sm text-muted-foreground">Sample Interface Text</p>
                <p className="mt-2 text-sm text-foreground">
                  Configure server tooling, mission generation and content utilities with the selected theme and font stack.
                </p>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Mono preview: DayZServer_x64.exe -config=serverDZ.cfg -profiles=profiles
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
