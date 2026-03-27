"use client";

import { AlertTriangle, FileTerminal, FolderSearch, RefreshCw, Siren, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PROFILES_LABEL } from "@/components/dayz-server/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      return "border-red-500/30 bg-red-500/8 text-red-100";
    case "warning":
      return "border-amber-500/30 bg-amber-500/8 text-amber-100";
    default:
      return "border-border/60 bg-background/50 text-foreground";
  }
}

function ArtifactKindBadge({ kind }: { kind: DayzCrashArtifact["kind"] }) {
  const tone =
    kind === "crash"
      ? "border-red-500/30 bg-red-500/8 text-red-100"
      : kind === "script"
        ? "border-amber-500/30 bg-amber-500/8 text-amber-100"
        : kind === "mdmp"
          ? "border-violet-500/30 bg-violet-500/8 text-violet-100"
          : "border-sky-500/30 bg-sky-500/8 text-sky-100";

  return <span className={cn("rounded-lg border px-2 py-1 text-[11px] uppercase tracking-[0.16em]", tone)}>{kind}</span>;
}

function ExcerptCard({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 px-4 py-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {lines.length > 0 ? (
          <pre className="code-surface max-h-[28rem] min-h-[20rem] overflow-auto rounded-xl border border-border/60 p-4 font-mono text-xs leading-6 select-text">
            {lines.join("\n")}
          </pre>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-sm text-muted-foreground">
            No lines captured for this artifact yet.
          </div>
        )}
      </CardContent>
    </Card>
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
            summary: "Crash Tools backend is unavailable in the current Electron session.",
            probableCause:
              error instanceof Error ? error.message : "Failed to scan crash artifacts.",
            exceptionCode: "",
            signals: [],
            recommendations: [
              "Fully restart npm run dev so Electron main/preload pick up the new Crash Tools IPC handlers.",
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
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                <Siren className="size-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Crash Tools</CardTitle>
                <CardDescription className="mt-1">
                  Scan the DayZ Server profiles folder, inspect recent RPT/script/crash artifacts and surface the most likely crash cause.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Profiles Path</p>
              <Input value={profilesPath} onChange={(event) => setProfilesPath(event.target.value)} placeholder="C:\\DayZServer\\profiles" />
            </div>
            <div className={cn("rounded-2xl border p-4", severityTone(snapshot?.analysis.severity ?? "info"))}>
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
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] opacity-80">
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
              <div key={label} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_560px]">
        <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
          <CardHeader className="border-b border-border/60 px-5 py-4">
            <CardTitle className="text-base">Recent Artifacts</CardTitle>
            <CardDescription>Latest crash-related files discovered in the selected profiles folder.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {(snapshot?.artifacts ?? []).map((artifact) => (
                <div key={artifact.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
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
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Modified</p>
                      <p className="mt-1 text-foreground">{formatDate(artifact.modifiedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Size</p>
                      <p className="mt-1 text-foreground">{formatBytes(artifact.sizeBytes)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest Of Kind</p>
                      <p className="mt-1 text-foreground">
                        {latestArtifacts[artifact.kind]?.id === artifact.id ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {(snapshot?.artifacts?.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                  No crash-related files were found in this profiles folder yet.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-base">Analysis Signals</CardTitle>
              <CardDescription>Signals extracted from the latest text artifacts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detected signals</p>
                <div className="mt-3 space-y-2">
                  {(snapshot?.analysis.signals ?? []).map((signal) => (
                    <div
                      key={signal}
                      className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground select-text"
                    >
                      {signal}
                    </div>
                  ))}
                  {(snapshot?.analysis.signals?.length ?? 0) === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-sm text-muted-foreground">
                      No strong crash signals detected yet.
                    </div>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recommendations</p>
                <div className="mt-3 space-y-2">
                  {(snapshot?.analysis.recommendations ?? []).map((recommendation) => (
                    <div
                      key={recommendation}
                      className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground select-text"
                    >
                      {recommendation}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <ExcerptCard title="Latest RPT Excerpt" lines={snapshot?.excerpts.rpt ?? []} />
          <ExcerptCard title="Latest Script Log Excerpt" lines={snapshot?.excerpts.script ?? []} />
          <ExcerptCard title="Latest Crash Log Excerpt" lines={snapshot?.excerpts.crash ?? []} />
        </div>
      </div>

      {!isDesktop ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Crash Tools works in the Electron desktop build, where the launcher can access local DayZ Server log files.
          </div>
        </div>
      ) : null}
    </div>
  );
}
