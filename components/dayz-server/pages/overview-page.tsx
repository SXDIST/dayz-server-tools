"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2, GripHorizontal, Pause, Play, RotateCcw, TerminalSquare } from "lucide-react";

import { Section } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VirtualList } from "@/components/ui/virtual-list";
import { WorkspaceMetricTile } from "@/components/workspace/workspace-kit";
import { cn } from "@/lib/utils";

type OverviewPageProps = Pick<
  DayzServerWorkspaceProps,
  | "runtime"
  | "clientRuntime"
  | "isServerPending"
  | "isClientPending"
  | "onStart"
  | "onStop"
  | "onRestart"
  | "onLaunchClient"
  | "onStopClient"
>;

function formatLogTime(timestamp: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "--:--:--";
  }
}

export function OverviewPage({
  runtime,
  clientRuntime,
  isServerPending,
  isClientPending,
  onStart,
  onStop,
  onRestart,
  onLaunchClient,
  onStopClient,
}: OverviewPageProps) {
  const [terminalHeight, setTerminalHeight] = useState(360);
  const [isDragging, setIsDragging] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function handleMove(event: MouseEvent) {
      if (!dragRef.current) {
        return;
      }

      const delta = dragRef.current.startY - event.clientY;
      const nextHeight = Math.min(520, Math.max(180, dragRef.current.startHeight + delta));
      setTerminalHeight(nextHeight);
    }

    function handleUp() {
      setIsDragging(false);
      dragRef.current = null;
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const element = terminalRef.current;

    if (!element) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [runtime.logs, terminalHeight]);

  const statusTone =
    runtime.status === "running"
      ? "bg-primary text-primary-foreground border-primary"
      : runtime.status === "starting"
        ? "bg-secondary text-secondary-foreground border-border"
        : "bg-muted text-muted-foreground border-border";
  const isServerRunning = runtime.status === "running" || runtime.status === "starting";
  const isClientRunning = clientRuntime.status === "running" || clientRuntime.status === "launching";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <Section title="Server Control" description="Start, stop and monitor the current DayZ Server workspace.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={isServerRunning ? "destructive" : "default"}
              className="gap-2"
              onClick={() => void (isServerRunning ? onStop() : onStart())}
              disabled={isServerPending}
            >
              {isServerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
              {isServerRunning ? "Stop Server" : "Start Server"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => void onRestart()} disabled={isServerPending}>
              <RotateCcw className="size-4" />
              Restart
            </Button>
            <Button
              variant={isClientRunning ? "destructive" : "secondary"}
              className="gap-2"
              onClick={() => void (isClientRunning ? onStopClient() : onLaunchClient())}
              disabled={isClientPending}
            >
              <Gamepad2 className="size-4" />
              {isClientRunning ? "Stop Client" : "Launch Client"}
            </Button>
            <Badge className={cn("rounded-full border px-3 py-1 text-xs", statusTone)}>
              {runtime.status === "running" ? "Running" : runtime.status === "starting" ? "Starting" : "Stopped"}
            </Badge>
            <Badge
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                isClientRunning
                  ? "border-border bg-secondary text-secondary-foreground"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {clientRuntime.status === "running"
                ? "Client Running"
                : clientRuntime.status === "launching"
                  ? "Client Launching"
                  : "Client Stopped"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <WorkspaceMetricTile label="Executable" value={<span className="break-all text-sm">{runtime.executablePath || "Not started yet"}</span>} />
            <WorkspaceMetricTile label="PID" value={runtime.pid ?? "N/A"} />
            <WorkspaceMetricTile label="Started" value={runtime.startedAt ? formatLogTime(runtime.startedAt) : "Not running"} />
            <WorkspaceMetricTile label="Launch Args" value={runtime.launchArgs.length} />
            <WorkspaceMetricTile label="Client PID" value={clientRuntime.pid ?? "N/A"} />
            <WorkspaceMetricTile label="Client Started" value={clientRuntime.startedAt ? formatLogTime(clientRuntime.startedAt) : "Not running"} />
          </div>
        </div>
        </Section>
      </div>

      <div className="pointer-events-none min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col justify-end">
        <div className="pointer-events-none mt-2">
        <div
          className="pointer-events-auto flex overflow-hidden rounded-xl border bg-card text-card-foreground shadow-none"
          style={{ height: `${terminalHeight}px` }}
        >
          <div className="flex min-h-0 flex-1 flex-col">
          <button
            type="button"
            aria-label="Resize terminal"
            onMouseDown={(event) => {
              setIsDragging(true);
              dragRef.current = { startY: event.clientY, startHeight: terminalHeight };
            }}
            className="group flex w-full items-center justify-center border-b border-border/70 py-3 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <GripHorizontal className="size-4 transition-transform group-hover:scale-110" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                <TerminalSquare className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Runtime Console</p>
                <p className="text-xs text-muted-foreground">Live launcher, cfg, mission and stdout events.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                {runtime.logs.length} entries
              </Badge>
              <Badge className="rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                {runtime.status}
              </Badge>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <VirtualList
              ref={terminalRef}
              items={runtime.logs}
              itemHeight={30}
              paddingTop={14}
              paddingBottom={14}
              className="h-full bg-background font-mono text-[13px] leading-7 text-foreground"
              emptyState={<div className="px-5 py-4 text-sm text-muted-foreground">No runtime logs yet.</div>}
              renderItem={(entry, index) => {
                const levelTone =
                  entry.level === "stderr"
                    ? "text-destructive"
                    : entry.level === "stdout"
                      ? "text-foreground"
                      : "text-muted-foreground";

                return (
                  <div className="grid grid-cols-[90px_72px_56px_minmax(0,1fr)] items-start gap-3 border-b border-border/60 px-5 py-1.5 whitespace-pre">
                    <span className="text-muted-foreground">{formatLogTime(entry.timestamp)}</span>
                    <span className={levelTone}>{entry.level.toUpperCase()}</span>
                    <span className="text-muted-foreground/80">{`#${index + 1}`}</span>
                    <span className="truncate text-foreground">{entry.line}</span>
                  </div>
                );
              }}
            />
          </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
