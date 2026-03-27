"use client";

import { MonitorCog, Palette, PanelsTopLeft } from "lucide-react";

import { SelectField, ToggleField } from "@/components/dayz-server/form-controls";
import {
  fontModeOptions,
  monoFontOptions,
  sansFontOptions,
  themeOptions,
  type LauncherPreferences,
} from "@/components/launcher/preferences";
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
      <div>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Launcher-wide preferences for appearance, motion and workspace behavior.
          </p>
        </div>
      </div>

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
    </div>
  );
}
