"use client";

import { InitGeneratorPanel } from "@/components/dayz-server/init-generator-panel";
import { Section } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MissionsPageProps = Pick<
  DayzServerWorkspaceProps,
  | "missions"
  | "serverConfigValues"
  | "setServerConfigValues"
  | "onRefreshMissions"
  | "onOpenMissionsFolder"
  | "initSelectedMissionName"
  | "setInitSelectedMissionName"
  | "initGeneratorState"
  | "setInitGeneratorState"
  | "initPresetNameInput"
  | "setInitPresetNameInput"
  | "initSelectedPresetId"
  | "setInitSelectedPresetId"
  | "onSaveInitLoadoutPreset"
  | "onLoadInitLoadoutPreset"
  | "onDeleteInitLoadoutPreset"
  | "onBackupGeneratedInit"
  | "onApplyGeneratedInit"
  | "initPreviewResult"
  | "isInitPreviewPending"
  | "isInitBackupPending"
  | "isInitApplyPending"
>;

export function MissionsPage(props: MissionsPageProps) {
  const selectMission = (missionName: string) => {
    props.setServerConfigValues((current) => ({
      ...current,
      template: missionName,
    }));
    props.setInitSelectedMissionName(missionName);
  };

  return (
    <Section title="Missions" description="Detected mission folders from mpmissions with quick selection for Server.cfg and init.c generation.">
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Mission Folders</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Pick the active mission and inspect its current files.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void props.onOpenMissionsFolder()}>
                Open Missions Folder
              </Button>
              <Button size="sm" variant="default" onClick={() => void props.onRefreshMissions()}>
                Refresh Missions
              </Button>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
            {props.missions.map((mission) => {
              const isActive = props.serverConfigValues.template === mission.name;

              return (
                <div
                  key={mission.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectMission(mission.name)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectMission(mission.name);
                    }
                  }}
                  className={`w-[520px] shrink-0 rounded-2xl border p-5 transition-colors ${
                    isActive
                      ? "border-border bg-accent text-accent-foreground"
                      : "border-border/60 bg-background hover:bg-muted/30"
                  }`}
                >
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="px-2.5 py-0.5 text-[10px]" variant="secondary">
                          {mission.mapName}
                        </Badge>
                        {isActive ? <Badge className="px-2.5 py-0.5 text-[10px]">Active Mission</Badge> : null}
                      </div>

                      <div className="space-y-2">
                        <p className="text-lg font-semibold leading-none text-foreground">{mission.name}</p>
                        <p className="max-w-[42ch] text-sm leading-6 text-muted-foreground">
                          {isActive
                            ? "Currently used by Server.cfg and ready for mission generation."
                            : "Available mission preset for quick switching and init.c generation."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        {isActive ? "In Use" : "Available"}
                      </div>
                      <Button
                        size="sm"
                        variant={isActive ? "secondary" : "outline"}
                        onClick={() => selectMission(mission.name)}
                      >
                        {isActive ? "Selected" : "Use Mission"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {props.missions.length === 0 ? (
              <div className="w-full rounded-xl border border-dashed border-border/60 px-3 py-8 text-center text-sm text-muted-foreground">
                No missions were found in the current mpmissions folder.
              </div>
            ) : null}
            </div>
          </div>
        </div>
        <InitGeneratorPanel
          initGeneratorState={props.initGeneratorState}
          setInitGeneratorState={props.setInitGeneratorState}
          presetNameInput={props.initPresetNameInput}
          setPresetNameInput={props.setInitPresetNameInput}
          selectedPresetId={props.initSelectedPresetId}
          setSelectedPresetId={props.setInitSelectedPresetId}
          onSavePreset={props.onSaveInitLoadoutPreset}
          onLoadPreset={props.onLoadInitLoadoutPreset}
          onDeletePreset={props.onDeleteInitLoadoutPreset}
          onBackup={props.onBackupGeneratedInit}
          onApply={props.onApplyGeneratedInit}
          previewResult={props.initPreviewResult}
          isBackupPending={props.isInitBackupPending}
          isApplyPending={props.isInitApplyPending}
        />
      </div>
    </Section>
  );
}
