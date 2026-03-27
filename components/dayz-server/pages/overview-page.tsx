"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2, GripHorizontal, Pause, Play, RotateCcw } from "lucide-react";

import { Section } from "@/components/dayz-server/workspace-shared";
import type { DayzServerWorkspaceProps } from "@/components/dayz-server/workspace-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [terminalHeight, setTerminalHeight] = useState(280);
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
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [runtime.logs]);

  const statusTone =
    runtime.status === "running"
      ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/20"
      : runtime.status === "starting"
        ? "bg-amber-500/12 text-amber-300 border-amber-500/20"
        : "bg-muted text-muted-foreground border-border";
  const isServerRunning = runtime.status === "running" || runtime.status === "starting";
  const isClientRunning = clientRuntime.status === "running" || clientRuntime.status === "launching";

  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] flex-col gap-4">
      <Section title="Server Control" description="Start, stop and monitor the current DayZ Server workspace.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={isServerRunning ? "destructive" : "success"}
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
              variant={isClientRunning ? "destructive" : "info"}
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
                  ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
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

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Executable</p>
              <p className="mt-2 break-all text-sm text-foreground">{runtime.executablePath || "Not started yet"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PID</p>
              <p className="mt-2 text-sm text-foreground">{runtime.pid ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Started</p>
              <p className="mt-2 text-sm text-foreground">
                {runtime.startedAt ? formatLogTime(runtime.startedAt) : "Not running"}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Launch Args</p>
              <p className="mt-2 text-sm text-foreground">{runtime.launchArgs.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Client PID</p>
              <p className="mt-2 text-sm text-foreground">{clientRuntime.pid ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Client Started</p>
              <p className="mt-2 text-sm text-foreground">
                {clientRuntime.startedAt ? formatLogTime(clientRuntime.startedAt) : "Not running"}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <div className="pointer-events-none mt-auto -mx-5 -mb-5">
        <div className="pointer-events-auto overflow-hidden rounded-t-[26px] border-x border-t border-border/70 bg-card/95 shadow-[0_-24px_60px_rgba(0,0,0,0.12)] dark:bg-[#111315]/96 dark:shadow-[0_-24px_60px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            aria-label="Resize terminal"
            onMouseDown={(event) => {
              setIsDragging(true);
              dragRef.current = { startY: event.clientY, startHeight: terminalHeight };
            }}
            className="group flex w-full items-center justify-center border-b border-border/60 py-3 text-muted-foreground transition-colors hover:bg-accent/40 dark:border-white/8 dark:hover:bg-white/[0.03]"
          >
            <GripHorizontal className="size-4 transition-transform group-hover:scale-110" />
          </button>

          <div className="overflow-hidden" style={{ height: `${terminalHeight}px` }}>
            <div ref={terminalRef} className="h-full overflow-auto bg-card/80 px-5 py-4 font-mono text-[13px] leading-7 text-foreground dark:bg-transparent dark:text-zinc-200">
              {runtime.logs.map((entry, index) => {
                const levelTone =
                  entry.level === "stderr"
                    ? "text-rose-600 dark:text-rose-300"
                    : entry.level === "stdout"
                      ? "text-sky-700 dark:text-cyan-300"
                      : "text-emerald-700 dark:text-emerald-300";

                return (
                  <div key={`${entry.id}-${index}`} className="whitespace-pre-wrap">
                    <span className="text-muted-foreground dark:text-zinc-500">{`[${formatLogTime(entry.timestamp)}]`}</span>{" "}
                    <span className={levelTone}>{`[${entry.level.toUpperCase()}]`}</span>{" "}
                    <span className="text-emerald-600 dark:text-emerald-400">{`[${index + 1}]`}</span>{" "}
                    <span>{entry.line}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
