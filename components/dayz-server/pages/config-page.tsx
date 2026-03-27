"use client";

import { SelectField, ToggleField } from "@/components/dayz-server/form-controls";
import { ConfigField, Section } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { Input } from "@/components/ui/input";

type ConfigPageProps = Pick<
  DayzServerWorkspaceProps,
  "serverConfigValues" | "setServerConfigValues" | "missions"
>;

export function ConfigPage({
  serverConfigValues,
  setServerConfigValues,
  missions,
}: ConfigPageProps) {
  const serverTimeMode = serverConfigValues.serverTime.trim();
  const usesStaticTimeConfig = serverTimeMode !== "SystemTime";

  return (
    <Section title="Server.cfg" description="Single editor panel for all core server.cfg values with context-aware controls.">
      <div className="space-y-1">
        <ConfigField label="hostname" description="Public server name shown in the browser." control={<Input value={serverConfigValues.hostname} onChange={(event) => setServerConfigValues((current) => ({ ...current, hostname: event.target.value }))} />} />
        <ConfigField label="password" description="Optional join password." control={<Input value={serverConfigValues.password} placeholder="Optional" onChange={(event) => setServerConfigValues((current) => ({ ...current, password: event.target.value }))} />} />
        <ConfigField label="passwordAdmin" description="Admin password used for server login." control={<Input value={serverConfigValues.passwordAdmin} placeholder="Optional" onChange={(event) => setServerConfigValues((current) => ({ ...current, passwordAdmin: event.target.value }))} />} />
        <ConfigField label="description" description="Shown in the DayZ server browser." control={<Input value={serverConfigValues.description} placeholder="Optional" onChange={(event) => setServerConfigValues((current) => ({ ...current, description: event.target.value }))} />} />
        <ConfigField label="template" description="Active mission from the mpmissions folder." control={<SelectField value={serverConfigValues.template || "Select mission"} options={[...new Set([serverConfigValues.template, ...missions.map((mission) => mission.name)].filter(Boolean))]} onValueChange={(value) => setServerConfigValues((current) => ({ ...current, template: value }))} />} />
        <ConfigField label="maxPlayers" description="Maximum connected players." control={<Input value={serverConfigValues.maxPlayers} type="number" onChange={(event) => setServerConfigValues((current) => ({ ...current, maxPlayers: event.target.value }))} />} />
        <ConfigField label="enableWhitelist" description="Allow only whitelisted players to connect." control={<ToggleField checked={serverConfigValues.enableWhitelist} label={serverConfigValues.enableWhitelist ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, enableWhitelist: checked }))} />} />
        <ConfigField label="verifySignatures" description="Validate addon signatures on client connect." control={<ToggleField checked={serverConfigValues.verifySignatures} label={serverConfigValues.verifySignatures ? "Strict" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, verifySignatures: checked }))} />} />
        <ConfigField label="forceSameBuild" description="Allow only clients with the same executable build." control={<ToggleField checked={serverConfigValues.forceSameBuild} label={serverConfigValues.forceSameBuild ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, forceSameBuild: checked }))} />} />
        <ConfigField label="disableVoN" description="Disable in-game voice chat." control={<ToggleField checked={serverConfigValues.disableVoN} label={serverConfigValues.disableVoN ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, disableVoN: checked }))} />} />
        <ConfigField label="vonCodecQuality" description="Voice codec quality from 0 to 30." control={<Input value={serverConfigValues.vonCodecQuality} type="number" onChange={(event) => setServerConfigValues((current) => ({ ...current, vonCodecQuality: event.target.value }))} />} />
        <ConfigField label="battlEye" description="Enable BattlEye for this server instance." control={<ToggleField checked={serverConfigValues.battlEye} label={serverConfigValues.battlEye ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, battlEye: checked }))} />} />
        <ConfigField label="shardId" description="Private shard identifier for the server." control={<Input value={serverConfigValues.shardId} placeholder="Optional private shard id" onChange={(event) => setServerConfigValues((current) => ({ ...current, shardId: event.target.value }))} />} />
        <ConfigField label="disable3rdPerson" description="Disable third-person camera for players." control={<ToggleField checked={serverConfigValues.disable3rdPerson} label={serverConfigValues.disable3rdPerson ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, disable3rdPerson: checked }))} />} />
        <ConfigField label="disableCrosshair" description="Disable crosshair for connected clients." control={<ToggleField checked={serverConfigValues.disableCrosshair} label={serverConfigValues.disableCrosshair ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, disableCrosshair: checked }))} />} />
        <ConfigField label="disablePersonalLight" description="Disable personal light for all players." control={<ToggleField checked={serverConfigValues.disablePersonalLight} label={serverConfigValues.disablePersonalLight ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, disablePersonalLight: checked }))} />} />
        <ConfigField label="lightingConfig" description="Night lighting mode used by the server." control={<SelectField value={serverConfigValues.lightingConfig} options={["0", "1"]} onValueChange={(value) => setServerConfigValues((current) => ({ ...current, lightingConfig: value }))} />} />
        <ConfigField label="serverTime" description="Choose how the server time is resolved." control={<Input value={serverConfigValues.serverTime} onChange={(event) => setServerConfigValues((current) => ({ ...current, serverTime: event.target.value }))} placeholder='SystemTime or YYYY/MM/DD/HH/MM' />} />
        {usesStaticTimeConfig ? (
          <ConfigField label="serverTimePersistent" description="Persist in-game time between restarts." control={<ToggleField checked={serverConfigValues.serverTimePersistent === "1"} label={serverConfigValues.serverTimePersistent === "1" ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, serverTimePersistent: checked ? "1" : "0" }))} />} />
        ) : null}
        <ConfigField label="serverTimeAcceleration" description="Controls daytime acceleration multiplier." control={<Input value={serverConfigValues.serverTimeAcceleration} type="number" onChange={(event) => setServerConfigValues((current) => ({ ...current, serverTimeAcceleration: event.target.value }))} />} />
        <ConfigField label="serverNightTimeAcceleration" description="Controls nighttime acceleration multiplier." control={<Input value={serverConfigValues.serverNightTimeAcceleration} type="number" onChange={(event) => setServerConfigValues((current) => ({ ...current, serverNightTimeAcceleration: event.target.value }))} />} />
        <ConfigField label="guaranteedUpdates" description="Network update mode used by the server." control={<SelectField value={serverConfigValues.guaranteedUpdates} options={["1", "2", "3"]} onValueChange={(value) => setServerConfigValues((current) => ({ ...current, guaranteedUpdates: value }))} />} />
        <ConfigField label="loginQueueConcurrentPlayers" description="How many players are processed in queue concurrently." control={<Input value={serverConfigValues.loginQueueConcurrentPlayers} type="number" onChange={(event) => setServerConfigValues((current) => ({ ...current, loginQueueConcurrentPlayers: event.target.value }))} />} />
        <ConfigField label="loginQueueMaxPlayers" description="Maximum number of players allowed to wait in queue." control={<Input value={serverConfigValues.loginQueueMaxPlayers} type="number" onChange={(event) => setServerConfigValues((current) => ({ ...current, loginQueueMaxPlayers: event.target.value }))} />} />
        <ConfigField label="instanceId" description="Unique instance identifier." control={<Input value={serverConfigValues.instanceId} type="number" onChange={(event) => setServerConfigValues((current) => ({ ...current, instanceId: event.target.value }))} />} />
        <ConfigField label="storageAutoFix" description="Attempt automatic cleanup of storage problems." control={<ToggleField checked={serverConfigValues.storageAutoFix} label={serverConfigValues.storageAutoFix ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, storageAutoFix: checked }))} />} />
        <ConfigField label="adminLogPlayerHitsOnly" description="Reduce admin logs to player hit events only." control={<ToggleField checked={serverConfigValues.adminLogPlayerHitsOnly} label={serverConfigValues.adminLogPlayerHitsOnly ? "Enabled" : "Disabled"} onCheckedChange={(checked) => setServerConfigValues((current) => ({ ...current, adminLogPlayerHitsOnly: checked }))} />} />
      </div>
    </Section>
  );
}
