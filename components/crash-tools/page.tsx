"use client";

import { AlertTriangle, FileTerminal, FolderSearch, RefreshCw, Siren, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PROFILES_LABEL } from "@/components/dayz-server/constants";
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
import { cn } from "@/lib/utils";

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
  const tone = kind === "crash" ? "border-border bg-muted text-foreground" : "border-border bg-background text-muted-foreground";

  return <span className={cn("rounded-md border px-2 py-1 text-[11px]", tone)}>{kind}</span>;
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
            paddingTop={16}
            paddingBottom={16}
            className="code-surface max-h-[28rem] min-h-[20rem] rounded-lg border font-mono text-xs leading-6 select-text"
            renderItem={(line) => <div className="px-4 whitespace-pre">{line}</div>}
          />
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
            No lines captured for this artifact yet.
          </div>
        )}
    </WorkspacePanel>
  );
}

export function CrashToolsPage() {
  const desktopBridge = typeof window !== "undefined" ? window.desktopBridge : undefined;
  const dayzApi = desktopBridge?.dayz;
  const isDesktop = desktopBridge?.isElectron === true;
  const [profilesPath, setProfilesPath] = useState("");
  const [snapshot, setSnapshot] = useState<DayzCrashSnapshot | null>(null);
  const [isPending, setIsPending] = useState(false);

  const refreshCrashData = useCallback(
    async (targetProfilesPath: string) => {
      if (!dayzApi || !targetProfilesPath) {
        return;
      }

      setIsPending(true);

      try {
        const nextSnapshot = await dayzApi.scanCrashTools(targetProfilesPath);
        setSnapshot(nextSnapshot);
      } catch (error) {
        setSnapshot({
          profilesPath: targetProfilesPath,
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
            probableCause:
              error instanceof Error ? error.message : "Failed to scan crash artifacts.",
            exceptionCode: "",
            signals: [],
            recommendations: [
              "Fully restart the desktop dev session so the native backend picks up the latest Crash Tools handlers.",
            ],
          },
        });
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
      setProfilesPath(detectedProfilesPath);

      if (detectedProfilesPath) {
        void refreshCrashData(detectedProfilesPath);
      }
    });

    return () => {
      active = false;
    };
  }, [dayzApi, refreshCrashData]);

  const latestArtifacts = snapshot?.latest ?? {
    rpt: null,
    script: null,
    crash: null,
    mdmp: null,
  };

  const artifactCounts = useMemo(() => {
    const artifacts = snapshot?.artifacts ?? [];

    return {
      total: artifacts.length,
      rpt: artifacts.filter((artifact) => artifact.kind === "rpt").length,
      script: artifacts.filter((artifact) => artifact.kind === "script").length,
      crash: artifacts.filter((artifact) => artifact.kind === "crash").length,
      mdmp: artifacts.filter((artifact) => artifact.kind === "mdmp").length,
    };
  }, [snapshot]);

  const handleBrowseProfiles = useCallback(async () => {
    if (!dayzApi) {
      return;
    }

    const pickedPath = await dayzApi.pickFolder({ defaultPath: profilesPath });

    if (!pickedPath) {
      return;
    }

    setProfilesPath(pickedPath);
    await refreshCrashData(pickedPath);
  }, [dayzApi, profilesPath, refreshCrashData]);

  const handleOpenPath = useCallback(
    async (targetPath: string) => {
      if (!dayzApi || !targetPath) {
        return;
      }

      await dayzApi.openPath(targetPath);
    },
    [dayzApi],
  );

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow="Diagnostics"
        title="Crash Tools"
        description="Summary first, then signals, artifacts and excerpts. The page now reads like an investigation flow instead of a raw dump of panes."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleBrowseProfiles()} disabled={!isDesktop}>
              <FolderSearch className="size-4" />
              Browse Profiles
            </Button>
            <Button variant="outline" onClick={() => void handleOpenPath(profilesPath)} disabled={!profilesPath || !isDesktop}>
              <FileTerminal className="size-4" />
              Open Profiles
            </Button>
            <Button variant="default" onClick={() => void refreshCrashData(profilesPath)} disabled={!profilesPath || isPending || !isDesktop}>
              <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
              Refresh
            </Button>
          </>
        }
      />

      <WorkspacePanel
        title="Crash Summary"
        description="Scan the DayZ Server profiles folder, inspect recent RPT/script/crash artifacts and surface the most likely crash cause."
        icon={Siren}
      >
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Profiles Path</p>
              <Input value={profilesPath} onChange={(event) => setProfilesPath(event.target.value)} placeholder="C:\\DayZServer\\profiles" />
            </div>
            <div className={cn("rounded-lg border p-4", severityTone(snapshot?.analysis.severity ?? "info"))}>
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    {snapshot?.analysis.summary ?? "Scan the profiles folder to get a crash summary."}
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
            {[
              ["Artifacts", String(artifactCounts.total)],
              ["RPT", String(artifactCounts.rpt)],
              ["Script", String(artifactCounts.script)],
              ["Crash", String(artifactCounts.crash + artifactCounts.mdmp)],
            ].map(([label, value]) => (
              <WorkspaceMetricTile key={label} label={label} value={value} note="Current scan snapshot" />
            ))}
          </div>
        </div>
      </WorkspacePanel>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_560px]">
        <WorkspacePanel
          title="Recent Artifacts"
          description="Latest crash-related files discovered in the selected profiles folder."
        >
            <div className="space-y-3">
              {(snapshot?.artifacts ?? []).map((artifact) => (
                <div key={artifact.id} className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all text-sm font-medium text-foreground">{artifact.name}</p>
                        <ArtifactKindBadge kind={artifact.kind} />
                      </div>
                      <p className="mt-1 break-all text-sm text-muted-foreground">{artifact.path}</p>
                    </div>
                    <Button variant="outline" onClick={() => void handleOpenPath(artifact.path)} disabled={!isDesktop}>
                      Open
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Modified</p>
                      <p className="mt-1 text-foreground">{formatDate(artifact.modifiedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Size</p>
                      <p className="mt-1 text-foreground">{formatBytes(artifact.sizeBytes)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Latest Of Kind</p>
                      <p className="mt-1 text-foreground">
                        {latestArtifacts[artifact.kind]?.id === artifact.id ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {(snapshot?.artifacts?.length ?? 0) === 0 ? (
                <WorkspaceEmptyState
                  icon={FileTerminal}
                  title="No artifacts yet"
                  description="No crash-related files were found in this profiles folder yet. Point the tool to the active DayZ profiles folder and run another scan."
                />
              ) : null}
            </div>
        </WorkspacePanel>

        <div className="space-y-4">
          <WorkspacePanel
            title="Analysis Signals"
            description="Signals extracted from the latest text artifacts."
          >
              <div>
                <p className="text-xs font-medium text-muted-foreground">Detected signals</p>
                <div className="mt-3 space-y-2">
                  {(snapshot?.analysis.signals ?? []).map((signal) => (
                    <div
                      key={signal}
                      className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground select-text"
                    >
                      {signal}
                    </div>
                  ))}
                  {(snapshot?.analysis.signals?.length ?? 0) === 0 ? (
                    <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      No strong crash signals detected yet.
                    </div>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Recommendations</p>
                <div className="mt-3 space-y-2">
                  {(snapshot?.analysis.recommendations ?? []).map((recommendation) => (
                    <div
                      key={recommendation}
                      className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground select-text"
                    >
                      {recommendation}
                    </div>
                  ))}
                </div>
              </div>
          </WorkspacePanel>

          <ExcerptCard title="Latest RPT Excerpt" lines={snapshot?.excerpts.rpt ?? []} />
          <ExcerptCard title="Latest Script Log Excerpt" lines={snapshot?.excerpts.script ?? []} />
          <ExcerptCard title="Latest Crash Log Excerpt" lines={snapshot?.excerpts.crash ?? []} />
        </div>
      </div>

      {!isDesktop ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Crash Tools works in the desktop build, where the launcher can access local DayZ Server log files.
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
