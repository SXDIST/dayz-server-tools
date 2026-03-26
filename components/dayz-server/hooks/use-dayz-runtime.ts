"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createFallbackRuntime } from "@/components/dayz-server/utils";

export function useDayzRuntime(dayzApi: DesktopBridge["dayz"] | undefined, isDesktop: boolean) {
  const [serverRuntime, setServerRuntime] = useState<DayzServerRuntime>(createFallbackRuntime);
  const [isServerPending, setIsServerPending] = useState(false);
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

    return () => {
      mounted = false;
      unsubscribeLog();
      unsubscribeStatus();
    };
  }, [dayzApi, isDesktop]);

  return {
    serverRuntime,
    setServerRuntime,
    isServerPending,
    setIsServerPending,
    appendPreviewLog,
  };
}
