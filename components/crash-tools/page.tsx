"use client";

import {
  AlertTriangle,
  FileTerminal,
  FolderOpen,
  Monitor,
  RefreshCw,
  Server,
  Siren,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PROFILES_LABEL } from "@/components/dayz-server/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VirtualList } from "@/components/ui/virtual-list";
import {
  WorkspaceEmptyState,
  WorkspaceMetricTile,
  WorkspacePage,
  WorkspacePageHeader,
  WorkspacePanel,
} from "@/components/workspace/workspace-kit";
import { useDesktopBridge } from "@/components/use-desktop-bridge";
import { cn } from "@/lib/utils";

type CrashSource = "server" | "client";
type DeleteTarget = "server" | "client" | "all";

function formatBytes(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = sizeBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value: string) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityTone(severity: DayzCrashAnalysis["severity"]) {
  switch (severity) {
    case "error":
      return "border-destructive/30 bg-destructive/5 text-foreground";
    case "warning":
      return "border-border bg-muted/40 text-foreground";
    default:
      return "border-border bg-muted/30 text-foreground";
  }
}

function ArtifactKindBadge({ kind }: { kind: DayzCrashArtifact["kind"] }) {
  return (
    <Badge variant="outline" className="capitalize">
      {kind}
    </Badge>
  );
}

function ArtifactSourceBadge({ source }: { source: DayzCrashArtifact["source"] }) {
  return <Badge variant={source === "server" ? "secondary" : "outline"}>{source === "server" ? "Server" : "Client"}</Badge>;
}

function ExcerptCard({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <WorkspacePanel title={title} contentClassName="p-4">
      {lines.length > 0 ? (
        <VirtualList
          items={lines}
          itemHeight={24}
          paddingTop={12}
          paddingBottom={12}
          className="max-h-[20rem] min-h-[14rem] rounded-lg border bg-muted/20 font-mono text-xs leading-6 select-text"
          renderItem={(line) => <div className="px-4 whitespace-pre">{line}</div>}
        />
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
          No lines captured for this source yet.
        </div>
      )}
    </WorkspacePanel>
  );
}

function SourceSummaryCard({
  snapshot,
  displayPath,
  active,
  onSelect,
  onOpenPath,
  onDelete,
  isBusy,
}: {
  snapshot: DayzCrashSourceSnapshot;
  displayPath: string;
  active: boolean;
  onSelect: () => void;
  onOpenPath: (targetPath: string) => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  const Icon = snapshot.source === "server" ? Server : Monitor;
  const crashCount = snapshot.artifacts.filter((artifact) => artifact.kind === "crash" || artifact.kind === "mdmp").length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border p-4 text-left transition-colors",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "border-foreground/20 bg-muted/35" : "border-border bg-background hover:bg-muted/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{snapshot.label} Logs</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{displayPath || "Path unavailable"}</p>
          </div>
        </div>
        <Badge variant={active ? "secondary" : "outline"}>{snapshot.artifacts.length} files</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">RPT / Script</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {snapshot.artifacts.filter((artifact) => artifact.kind === "rpt" || artifact.kind === "script").length}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Crash / Dumps</p>
          <p className="mt-1 text-sm font-medium text-foreground">{crashCount}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Latest</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatDate(snapshot.artifacts[0]?.modifiedAt ?? "")}
          </p>
        </div>
      </div>

      <div className={cn("rounded-lg border px-3 py-3", severityTone(snapshot.analysis.severity))}>
        <p className="text-sm font-medium">{snapshot.analysis.summary}</p>
        <p className="mt-1 text-sm opacity-85">{snapshot.analysis.probableCause}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            onOpenPath(displayPath);
          }}
          disabled={!displayPath || isBusy}
        >
          <FolderOpen className="size-4" />
          Open Folder
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          disabled={snapshot.artifacts.length === 0 || isBusy}
        >
          <Trash2 className="size-4" />
          Clear {snapshot.label}
        </Button>
      </div>
    </div>
  );
}

function buildFallbackSnapshot(profilesPath: string, clientLogsPath: string, message: string): DayzCrashSnapshot {
  return {
    profilesPath,
    clientLogsPath,
    artifacts: [],
    latest: {
      rpt: null,
      script: null,
      crash: null,
      mdmp: null,
    },
    excerpts: {
      rpt: [],
      script: [],
      crash: [],
    },
    analysis: {
      severity: "warning",
      summary: "Crash Tools backend is unavailable in the current desktop session.",
      probableCause: message,
      exceptionCode: "",
      signals: [],
      recommendations: [
        "Fully restart the desktop session so the native backend picks up the latest Crash Tools handlers.",
      ],
    },
    sources: {
      server: {
        source: "server",
        label: "Server",
        path: profilesPath,
        artifacts: [],
        latest: { rpt: null, script: null, crash: null, mdmp: null },
        excerpts: { rpt: [], script: [], crash: [] },
        analysis: {
          severity: "warning",
          summary: "Server crash scan is unavailable.",
          probableCause: message,
          exceptionCode: "",
          signals: [],
          recommendations: [],
        },
      },
      client: {
        source: "client",
        label: "Client",
        path: clientLogsPath,
        artifacts: [],
        latest: { rpt: null, script: null, crash: null, mdmp: null },
        excerpts: { rpt: [], script: [], crash: [] },
        analysis: {
          severity: "warning",
          summary: "Client crash scan is unavailable.",
          probableCause: message,
          exceptionCode: "",
          signals: [],
          recommendations: [],
        },
      },
    },
  };
}

export function CrashToolsPage() {
  const { dayzApi, isDesktop } = useDesktopBridge();
  const [profilesPath, setProfilesPath] = useState("");
  const [clientLogsPath, setClientLogsPath] = useState("");
  const [snapshot, setSnapshot] = useState<DayzCrashSnapshot | null>(null);
  const [activeSource, setActiveSource] = useState<CrashSource>("server");
  const [isPending, setIsPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const fallbackSnapshot = useMemo(
    () => buildFallbackSnapshot(profilesPath, clientLogsPath, ""),
    [clientLogsPath, profilesPath],
  );

  const refreshCrashData = useCallback(
    async (request: DayzCrashScanRequest) => {
      if (!dayzApi) {
        return;
      }

      setIsPending(true);

      try {
        const nextSnapshot = await dayzApi.scanCrashTools(request);
        setProfilesPath(nextSnapshot.profilesPath || "");
        setClientLogsPath(nextSnapshot.clientLogsPath || "");
        setSnapshot(nextSnapshot);
      } catch (error) {
        setSnapshot(
          buildFallbackSnapshot(
            request.profilesPath ?? "",
            request.clientLogsPath ?? "",
            error instanceof Error ? error.message : "Failed to scan crash artifacts.",
          ),
        );
      } finally {
        setIsPending(false);
      }
    },
    [dayzApi],
  );

  useEffect(() => {
    if (!dayzApi) {
      return;
    }

    let active = true;

    void dayzApi.getWorkspaceState().then((workspaceState) => {
      if (!active) {
        return;
      }

      const detectedProfilesPath = workspaceState.paths?.[PROFILES_LABEL] ?? "";
      setProfilesPath(detectedProfilesPath || "");
      void refreshCrashData({
        profilesPath: detectedProfilesPath || "",
      });
    });

    return () => {
      active = false;
    };
  }, [dayzApi, refreshCrashData]);

  useEffect(() => {
    const sourceSnapshots = snapshot?.sources ?? fallbackSnapshot.sources;

    if (!sourceSnapshots) {
      return;
    }

    const currentArtifacts = sourceSnapshots[activeSource].artifacts.length;
    const alternateSource = activeSource === "server" ? "client" : "server";
    const alternateArtifacts = sourceSnapshots[alternateSource].artifacts.length;

    if (currentArtifacts === 0 && alternateArtifacts > 0) {
      setActiveSource(alternateSource);
    }
  }, [activeSource, fallbackSnapshot.sources, snapshot]);

  const artifactCounts = useMemo(() => {
    const artifacts = snapshot?.artifacts ?? [];

    return {
      total: artifacts.length,
      server: artifacts.filter((artifact) => artifact.source === "server").length,
      client: artifacts.filter((artifact) => artifact.source === "client").length,
      dumps: artifacts.filter((artifact) => artifact.kind === "crash" || artifact.kind === "mdmp").length,
    };
  }, [snapshot]);

  const sourceSnapshots = snapshot?.sources ?? fallbackSnapshot.sources;
  const resolvedServerPath = sourceSnapshots.server.path || profilesPath;
  const resolvedClientPath = sourceSnapshots.client.path || clientLogsPath;
  const selectedSourceSnapshot = sourceSnapshots[activeSource];

  const handleBrowseProfiles = useCallback(async () => {
    if (!dayzApi) {
      return;
    }

    const pickedPath = await dayzApi.pickFolder({ defaultPath: profilesPath });

    if (!pickedPath) {
      return;
    }

    setProfilesPath(pickedPath);
    await refreshCrashData({
      profilesPath: pickedPath,
      clientLogsPath,
    });
  }, [clientLogsPath, dayzApi, profilesPath, refreshCrashData]);

  const handleBrowseClientLogs = useCallback(async () => {
    if (!dayzApi) {
      return;
    }

    const pickedPath = await dayzApi.pickFolder({ defaultPath: clientLogsPath });

    if (!pickedPath) {
      return;
    }

    setClientLogsPath(pickedPath);
    await refreshCrashData({
      profilesPath,
      clientLogsPath: pickedPath,
    });
  }, [clientLogsPath, dayzApi, profilesPath, refreshCrashData]);

  const handleOpenPath = useCallback(
    async (targetPath: string) => {
      if (!dayzApi || !targetPath) {
        return;
      }

      await dayzApi.openPath(targetPath);
    },
    [dayzApi],
  );

  const handleDeleteArtifacts = useCallback(async () => {
    if (!dayzApi || !deleteTarget) {
      return;
    }

    setIsPending(true);

    try {
      await dayzApi.deleteCrashArtifacts({
        profilesPath,
        clientLogsPath,
        target: deleteTarget,
      });
      await refreshCrashData({
        profilesPath,
        clientLogsPath,
      });
    } finally {
      setDeleteTarget(null);
      setIsPending(false);
    }
  }, [clientLogsPath, dayzApi, deleteTarget, profilesPath, refreshCrashData]);

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow="Diagnostics"
        title="Crash Tools"
        description="Inspect server and client crash artifacts in one place, clear stale logs and jump straight into the latest RPT, script and crash excerpts."
        actions={
          <div className="flex max-w-full flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => void handleBrowseProfiles()} disabled={!isDesktop || isPending}>
              Browse Server Profiles
            </Button>
            <Button variant="outline" onClick={() => void handleBrowseClientLogs()} disabled={!isDesktop || isPending}>
              Browse Client Logs
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleOpenPath(resolvedServerPath)}
              disabled={!resolvedServerPath || !isDesktop || isPending}
            >
              <FolderOpen className="size-4" />
              Open Server Logs
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleOpenPath(resolvedClientPath)}
              disabled={!resolvedClientPath || !isDesktop || isPending}
            >
              <FolderOpen className="size-4" />
              Open Client Logs
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget("all")}
              disabled={(snapshot?.artifacts.length ?? 0) === 0 || !isDesktop || isPending}
            >
              <Trash2 className="size-4" />
              Delete All Logs
            </Button>
            <Button
              variant="default"
              onClick={() =>
                void refreshCrashData({
                  profilesPath,
                  clientLogsPath,
                })
              }
              disabled={(!profilesPath && !clientLogsPath) || isPending || !isDesktop}
            >
              <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      <WorkspacePanel
        title="Crash Summary"
        description="Combined server and client diagnostics with a fast path to the most relevant folder."
        icon={Siren}
      >
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_420px]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Server Profiles Path</p>
              <Input value={profilesPath} onChange={(event) => setProfilesPath(event.target.value)} placeholder="C:\\DayZServer\\profiles" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Client Logs Path</p>
              <Input
                value={resolvedClientPath}
                onChange={(event) => setClientLogsPath(event.target.value)}
                placeholder="C:\\Users\\You\\Documents\\DayZ"
              />
            </div>
            <div className={cn("rounded-lg border p-4", severityTone(snapshot?.analysis.severity ?? "info"))}>
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    {snapshot?.analysis.summary ?? "Scan the server and client folders to get a crash summary."}
                  </p>
                  <p className="mt-1 text-sm opacity-85">
                    {snapshot?.analysis.probableCause ?? "No probable cause calculated yet."}
                  </p>
                  {snapshot?.analysis.exceptionCode ? (
                    <p className="mt-2 text-xs opacity-80">
                      Exception {snapshot.analysis.exceptionCode}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <WorkspaceMetricTile label="Artifacts" value={String(artifactCounts.total)} note="Server and client combined" />
            <WorkspaceMetricTile label="Server Logs" value={String(artifactCounts.server)} note="Profiles folder artifacts" />
            <WorkspaceMetricTile label="Client Logs" value={String(artifactCounts.client)} note="%LOCALAPPDATA%\\DayZ artifacts" />
            <WorkspaceMetricTile label="Crash / Dump" value={String(artifactCounts.dumps)} note="Crash logs and memory dumps" />
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Sources"
        description="Switch between server and client diagnostics, open the source folder or clear just that source."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SourceSummaryCard
            snapshot={sourceSnapshots.server}
            displayPath={resolvedServerPath}
            active={activeSource === "server"}
            onSelect={() => setActiveSource("server")}
            onOpenPath={(targetPath) => void handleOpenPath(targetPath)}
            onDelete={() => setDeleteTarget("server")}
            isBusy={isPending || !isDesktop}
          />
          <SourceSummaryCard
            snapshot={sourceSnapshots.client}
            displayPath={resolvedClientPath}
            active={activeSource === "client"}
            onSelect={() => setActiveSource("client")}
            onOpenPath={(targetPath) => void handleOpenPath(targetPath)}
            onDelete={() => setDeleteTarget("client")}
            isBusy={isPending || !isDesktop}
          />
        </div>
      </WorkspacePanel>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <WorkspacePanel
          title="Recent Artifacts"
          description="Combined list of the newest crash-related files from server and client sources."
        >
          <div className="space-y-3">
            {(snapshot?.artifacts ?? []).map((artifact) => (
              <div key={artifact.id} className="rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all text-sm font-medium text-foreground">{artifact.name}</p>
                      <ArtifactSourceBadge source={artifact.source} />
                      <ArtifactKindBadge kind={artifact.kind} />
                    </div>
                    <p className="mt-1 break-all text-sm text-muted-foreground">{artifact.path}</p>
                  </div>
                  <Button variant="outline" onClick={() => void handleOpenPath(artifact.path)} disabled={!isDesktop}>
                    Open
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Source</p>
                    <p className="mt-1 text-foreground">{artifact.source === "server" ? "Server" : "Client"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Modified</p>
                    <p className="mt-1 text-foreground">{formatDate(artifact.modifiedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Size</p>
                    <p className="mt-1 text-foreground">{formatBytes(artifact.sizeBytes)}</p>
                  </div>
                </div>
              </div>
            ))}
            {(snapshot?.artifacts.length ?? 0) === 0 ? (
              <WorkspaceEmptyState
                icon={FileTerminal}
                title="No artifacts yet"
                description="No crash-related files were found in the current server or client folders yet."
              />
            ) : null}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title={`${selectedSourceSnapshot?.label ?? "Selected"} Analysis`}
          description="Signals and recommendations for the currently selected source."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeSource === "server" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveSource("server")}
              >
                Server
              </Button>
              <Button
                variant={activeSource === "client" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveSource("client")}
              >
                Client
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className={cn("rounded-lg border p-4", severityTone(selectedSourceSnapshot?.analysis.severity ?? "info"))}>
              <p className="text-sm font-semibold">{selectedSourceSnapshot?.analysis.summary ?? "No analysis yet."}</p>
              <p className="mt-1 text-sm opacity-85">{selectedSourceSnapshot?.analysis.probableCause ?? "No probable cause calculated yet."}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Detected signals</p>
              <div className="mt-3 space-y-2">
                {(selectedSourceSnapshot?.analysis.signals ?? []).map((signal) => (
                  <div key={signal} className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground select-text">
                    {signal}
                  </div>
                ))}
                {(selectedSourceSnapshot?.analysis.signals.length ?? 0) === 0 ? (
                  <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    No strong crash signals detected for this source yet.
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Recommendations</p>
              <div className="mt-3 space-y-2">
                {(selectedSourceSnapshot?.analysis.recommendations ?? []).map((recommendation) => (
                  <div key={recommendation} className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground select-text">
                    {recommendation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ExcerptCard title={`${selectedSourceSnapshot?.label ?? "Selected"} RPT Excerpt`} lines={selectedSourceSnapshot?.excerpts.rpt ?? []} />
        <ExcerptCard title={`${selectedSourceSnapshot?.label ?? "Selected"} Script Excerpt`} lines={selectedSourceSnapshot?.excerpts.script ?? []} />
        <ExcerptCard title={`${selectedSourceSnapshot?.label ?? "Selected"} Crash Excerpt`} lines={selectedSourceSnapshot?.excerpts.crash ?? []} />
      </div>

      {!isDesktop ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Crash Tools works in the desktop build, where the launcher can access local DayZ log files.
          </div>
        </div>
      ) : null}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete crash logs?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === "all"
                ? "This will permanently remove all detected server and client crash logs, script logs, RPT files and dumps."
                : deleteTarget === "server"
                  ? "This will permanently remove every detected crash-related file from the selected server profiles folder."
                  : "This will permanently remove every detected crash-related file from Documents\\DayZ."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={() => void handleDeleteArtifacts()}>
              {isPending ? "Deleting..." : "Delete logs"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePage>
  );
}
