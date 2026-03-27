"use client";

import {
  clientResolutionOptions,
  DAYZ_CLIENT_PATH_LABEL,
  serverPaths,
} from "@/components/dayz-server/constants";
import { SelectField } from "@/components/dayz-server/form-controls";
import { Section } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsPageProps = Pick<
  DayzServerWorkspaceProps,
  | "pathValues"
  | "onPathChange"
  | "onBrowsePath"
  | "clientPath"
  | "setClientPath"
  | "onBrowseClientPath"
  | "clientSettings"
  | "setClientSettings"
  | "onAutoScanServer"
  | "onSavePathOverrides"
  | "onResetPaths"
>;

export function ServerSettingsPage(props: SettingsPageProps) {
  return (
    <Section title="Settings" description="Set auto-detected folders, server mod source and an explicit DayZ client executable.">
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
