"use client";

import { serverTabs } from "@/components/dayz-server/constants";
import { AdminToolsPage } from "@/components/dayz-server/pages/admin-tools-page";
import { ConfigPage } from "@/components/dayz-server/pages/config-page";
import { DeferredModsPage } from "@/components/dayz-server/pages/mods-page";
import { MissionsPage } from "@/components/dayz-server/pages/missions-page";
import { OverviewPage } from "@/components/dayz-server/pages/overview-page";
import { ServerSettingsPage } from "@/components/dayz-server/pages/settings-page";
import { TabButton } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";

export function DayzServerWorkspace(props: DayzServerWorkspaceProps) {
  const renderContent = () => {
    switch (props.serverTab) {
      case "overview":
        return (
          <OverviewPage
            runtime={props.runtime}
            clientRuntime={props.clientRuntime}
            isServerPending={props.isServerPending}
            isClientPending={props.isClientPending}
            onStart={props.onStart}
            onStop={props.onStop}
            onRestart={props.onRestart}
            onLaunchClient={props.onLaunchClient}
            onStopClient={props.onStopClient}
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
            modPresets={props.modPresets}
            modPresetNameInput={props.modPresetNameInput}
            setModPresetNameInput={props.setModPresetNameInput}
            selectedModPresetId={props.selectedModPresetId}
            setSelectedModPresetId={props.setSelectedModPresetId}
            onSaveModPreset={props.onSaveModPreset}
            onLoadModPreset={props.onLoadModPreset}
            onDeleteModPreset={props.onDeleteModPreset}
            onToggleModEnabled={props.onToggleModEnabled}
            onOpenModDirectory={props.onOpenModDirectory}
            onRefreshMods={props.onRefreshMods}
            onImportLocalMod={props.onImportLocalMod}
          />
        );
      case "config":
        return (
          <ConfigPage
            serverConfigValues={props.serverConfigValues}
            setServerConfigValues={props.setServerConfigValues}
            missions={props.missions}
          />
        );
      case "admins":
        return <AdminToolsPage />;
      case "missions":
        return (
          <MissionsPage
            missions={props.missions}
            serverConfigValues={props.serverConfigValues}
            setServerConfigValues={props.setServerConfigValues}
            onRefreshMissions={props.onRefreshMissions}
            onOpenMissionsFolder={props.onOpenMissionsFolder}
            initSelectedMissionName={props.initSelectedMissionName}
            setInitSelectedMissionName={props.setInitSelectedMissionName}
            initGeneratorState={props.initGeneratorState}
            setInitGeneratorState={props.setInitGeneratorState}
            initPresetNameInput={props.initPresetNameInput}
            setInitPresetNameInput={props.setInitPresetNameInput}
            initSelectedPresetId={props.initSelectedPresetId}
            setInitSelectedPresetId={props.setInitSelectedPresetId}
            onSaveInitLoadoutPreset={props.onSaveInitLoadoutPreset}
            onLoadInitLoadoutPreset={props.onLoadInitLoadoutPreset}
            onDeleteInitLoadoutPreset={props.onDeleteInitLoadoutPreset}
            onGenerateInitPreview={props.onGenerateInitPreview}
            onBackupGeneratedInit={props.onBackupGeneratedInit}
            onApplyGeneratedInit={props.onApplyGeneratedInit}
            initPreviewResult={props.initPreviewResult}
            isInitPreviewPending={props.isInitPreviewPending}
            isInitBackupPending={props.isInitBackupPending}
            isInitApplyPending={props.isInitApplyPending}
          />
        );
      case "settings":
        return (
          <ServerSettingsPage
            pathValues={props.pathValues}
            onPathChange={props.onPathChange}
            onBrowsePath={props.onBrowsePath}
            clientPath={props.clientPath}
            setClientPath={props.setClientPath}
            onBrowseClientPath={props.onBrowseClientPath}
            clientSettings={props.clientSettings}
            setClientSettings={props.setClientSettings}
            onAutoScanServer={props.onAutoScanServer}
            onSavePathOverrides={props.onSavePathOverrides}
            onResetPaths={props.onResetPaths}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/70 p-2">
        {serverTabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={props.serverTab === tab.id}
            label={tab.label}
            onClick={() => props.setServerTab(tab.id)}
          />
        ))}
      </div>
      {renderContent()}
    </div>
  );
}
