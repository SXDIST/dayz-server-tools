"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createFallbackRuntime } from "@/components/dayz-server/utils";

export function useDayzRuntime(dayzApi: DesktopBridge["dayz"] | undefined, isDesktop: boolean) {
  const [serverRuntime, setServerRuntime] = useState<DayzServerRuntime>(createFallbackRuntime);
  const [clientRuntime, setClientRuntime] = useState<DayzClientRuntime>({
    status: "stopped",
    pid: null,
    startedAt: null,
    executablePath: null,
    launchArgs: [],
  });
  const [isServerPending, setIsServerPending] = useState(false);
  const [isClientPending, setIsClientPending] = useState(false);
  const previewLogCounterRef = useRef(0);

  const appendPreviewLog = useCallback((line: string, level: DayzServerLogEntry["level"] = "info") => {
    setServerRuntime((current) => ({
      ...current,
      logs: [
        ...current.logs,
        {
          id: `${Date.now()}-${++previewLogCounterRef.current}`,
          level,
          line,
          timestamp: new Date().toISOString(),
        },
      ].slice(-500),
    }));
  }, []);

  useEffect(() => {
    if (!isDesktop || !dayzApi) {
      return;
    }

    let mounted = true;

    dayzApi
      .getServerRuntime()
      .then((runtime) => {
        if (!mounted) {
          return;
        }

        setServerRuntime((current) => ({
          ...runtime,
          logs: runtime.logs.length > 0 ? runtime.logs : current.logs,
        }));
      })
      .catch(() => {
        if (mounted) {
          setServerRuntime(createFallbackRuntime());
        }
      });

    dayzApi
      .getClientRuntime()
      .then((runtime) => {
        if (!mounted) {
          return;
        }

        setClientRuntime(runtime);
      })
      .catch(() => {
        if (mounted) {
          setClientRuntime({
            status: "stopped",
            pid: null,
            startedAt: null,
            executablePath: null,
            launchArgs: [],
          });
        }
      });

    const unsubscribeLog = dayzApi.onServerLog((entry) => {
      if (!mounted) {
        return;
      }

      setServerRuntime((current) => ({
        ...current,
        logs: [...current.logs, entry].slice(-500),
      }));
    });

    const unsubscribeStatus = dayzApi.onServerStatus((runtime) => {
      if (!mounted) {
        return;
      }

      setServerRuntime((current) => ({
        ...runtime,
        logs: runtime.logs.length > 0 ? runtime.logs : current.logs,
      }));
    });

    const unsubscribeClientStatus = dayzApi.onClientStatus((runtime) => {
      if (!mounted) {
        return;
      }

      setClientRuntime(runtime);
    });

    return () => {
      mounted = false;
      unsubscribeLog();
      unsubscribeStatus();
      unsubscribeClientStatus();
    };
  }, [dayzApi, isDesktop]);

  return {
    serverRuntime,
    setServerRuntime,
    clientRuntime,
    setClientRuntime,
    isServerPending,
    setIsServerPending,
    isClientPending,
    setIsClientPending,
    appendPreviewLog,
  };
}
