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
import { Badge } from "@/components/ui/badge";
import {
  WorkspaceField,
  WorkspaceMetricTile,
  WorkspacePage,
  WorkspacePageHeader,
  WorkspacePanel,
} from "@/components/workspace/workspace-kit";

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
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow="Launcher"
        title="Settings"
        description="Launcher-wide preferences for appearance, motion and workspace behavior. Everything here applies across modules, so the shell stays predictable while you move between tasks."
        actions={
          <>
            <Badge variant="secondary">{preferences.themeMode}</Badge>
            <Badge variant="outline">{preferences.compactSidebar ? "Compact Nav" : "Comfort Nav"}</Badge>
          </>
        }
      />

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <WorkspacePanel
          title="Appearance"
          description="Theme, interface fonts and heading typography."
          icon={Palette}
        >
          <WorkspaceField label="Theme" description="Choose system sync, light or dark rendering." control={
            <SelectField
              value={preferences.themeMode}
              options={themeOptions.map((item) => ({ value: item.value, label: item.label }))}
              onValueChange={(value) => updatePreference("themeMode", value as LauncherPreferences["themeMode"])}
            />
          } />

          <WorkspaceField label="Interface Style" description="Switch the main app typography between sans and mono." control={
            <SelectField
              value={preferences.interfaceMode}
              options={fontModeOptions.map((item) => ({ value: item.value, label: item.label }))}
              onValueChange={(value) => updatePreference("interfaceMode", value as LauncherPreferences["interfaceMode"])}
            />
          } />

          {preferences.interfaceMode === "sans" ? (
            <WorkspaceField label="Interface Sans" description="Primary font for general UI text." control={
              <SelectField
                value={preferences.interfaceSansFont}
                options={sansFontOptions.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => updatePreference("interfaceSansFont", value as LauncherPreferences["interfaceSansFont"])}
              />
            } />
          ) : (
            <WorkspaceField label="Interface Mono" description="Primary font for the whole interface in mono mode." control={
              <SelectField
                value={preferences.interfaceMonoFont}
                options={monoFontOptions.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => updatePreference("interfaceMonoFont", value as LauncherPreferences["interfaceMonoFont"])}
              />
            } />
          )}

          <WorkspaceField label="Header Style" description="Choose whether headings should render in sans or mono." control={
            <SelectField
              value={preferences.headingMode}
              options={fontModeOptions.map((item) => ({ value: item.value, label: item.label }))}
              onValueChange={(value) => updatePreference("headingMode", value as LauncherPreferences["headingMode"])}
            />
          } />

          <WorkspaceField label="Header Sans" description="Sans family used when heading style is set to Sans." control={
            <SelectField
              value={preferences.headingSansFont}
              options={sansFontOptions.map((item) => ({ value: item.value, label: item.label }))}
              onValueChange={(value) => updatePreference("headingSansFont", value as LauncherPreferences["headingSansFont"])}
            />
          } />

          <WorkspaceField label="Header Mono" description="Mono family used when heading style is set to Mono." control={
            <SelectField
              value={preferences.headingMonoFont}
              options={monoFontOptions.map((item) => ({ value: item.value, label: item.label }))}
              onValueChange={(value) => updatePreference("headingMonoFont", value as LauncherPreferences["headingMonoFont"])}
            />
          } />
          </WorkspacePanel>

          <WorkspacePanel
          title="Interface"
          description="Visual comfort and shell layout behavior."
          icon={PanelsTopLeft}
        >
          <WorkspaceField label="Background Effects" description="Show or hide stars and meteor animations behind the workspace." control={
            <ToggleField
              checked={preferences.backgroundEffects}
              label={preferences.backgroundEffects ? "Enabled" : "Disabled"}
              onCheckedChange={(checked) => updatePreference("backgroundEffects", checked)}
            />
          } />
          <WorkspaceField label="Reduce Motion" description="Tone down animated transitions and decorative movement." control={
            <ToggleField
              checked={preferences.reduceMotion}
              label={preferences.reduceMotion ? "Enabled" : "Disabled"}
              onCheckedChange={(checked) => updatePreference("reduceMotion", checked)}
            />
          } />
          <WorkspaceField label="Compact Sidebar" description="Use a denser launcher sidebar with smaller spacing." control={
            <ToggleField
              checked={preferences.compactSidebar}
              label={preferences.compactSidebar ? "Compact" : "Comfort"}
              onCheckedChange={(checked) => updatePreference("compactSidebar", checked)}
            />
          } />
          </WorkspacePanel>

          <WorkspacePanel
          title="Behavior"
          description="Useful launcher workflow preferences."
          icon={MonitorCog}
        >
          <WorkspaceField label="Remember Last Page" description="Restore the last opened launcher page on next startup." control={
            <ToggleField
              checked={preferences.rememberLastView}
              label={preferences.rememberLastView ? "Enabled" : "Disabled"}
              onCheckedChange={(checked) => updatePreference("rememberLastView", checked)}
            />
          } />
          </WorkspacePanel>
        </div>

        <div className="space-y-4">
          <WorkspaceMetricTile
            label="Theme"
            value={themeOptions.find((item) => item.value === preferences.themeMode)?.label ?? "Dark"}
            note="Applies to the whole desktop workspace."
          />
          <WorkspaceMetricTile
            label="Typography"
            value={preferences.interfaceMode === "mono" ? "Mono UI" : "Sans UI"}
            note="Heading and interface fonts can be split for readability."
          />
          <WorkspaceMetricTile
            label="Motion"
            value={preferences.reduceMotion ? "Reduced" : "Full"}
            note="Affects decorative background effects and transitions."
          />
        </div>
      </div>
    </WorkspacePage>
  );
}
