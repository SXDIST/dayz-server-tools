"use client";

import { useCallback, useEffect, type MutableRefObject } from "react";

import { WORKSPACE_CACHE_KEY } from "@/components/dayz-server/workspace-helpers";

type UseWorkspacePersistenceOptions = {
  dayzApi: DesktopBridge["dayz"] | undefined;
  isDesktop: boolean;
  workspaceSnapshot: DayzWorkspaceState | null;
  workspaceLoaded: boolean;
  workspaceSnapshotRef: MutableRefObject<DayzWorkspaceState | null>;
  savePromiseRef: MutableRefObject<Promise<unknown> | null>;
};

export function useWorkspacePersistence({
  dayzApi,
  isDesktop,
  workspaceSnapshot,
  workspaceLoaded,
  workspaceSnapshotRef,
  savePromiseRef,
}: UseWorkspacePersistenceOptions) {
  const flushWorkspaceState = useCallback(() => {
    if (!isDesktop || !dayzApi || !workspaceLoaded || !workspaceSnapshotRef.current) {
      return Promise.resolve();
    }

    const savePromise = dayzApi.saveWorkspaceState(workspaceSnapshotRef.current).catch(() => undefined);
    savePromiseRef.current = savePromise;
    return savePromise.finally(() => {
      if (savePromiseRef.current === savePromise) {
        savePromiseRef.current = null;
      }
    });
  }, [dayzApi, isDesktop, workspaceLoaded, workspaceSnapshotRef, savePromiseRef]);

  useEffect(() => {
    if (!workspaceLoaded || !workspaceSnapshot) {
      return;
    }

    try {
      window.localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(workspaceSnapshot));
    } catch {}
  }, [workspaceLoaded, workspaceSnapshot]);

  useEffect(() => {
    if (!isDesktop || !dayzApi || !workspaceLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      void flushWorkspaceState();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dayzApi, flushWorkspaceState, isDesktop, workspaceLoaded, workspaceSnapshot]);

  useEffect(() => {
    if (!isDesktop || !dayzApi) {
      return;
    }

    const flushSynchronously = () => {
      void flushWorkspaceState();
    };

    const handleBeforeClose = async () => {
      await flushWorkspaceState();
      await window.desktopBridge?.app.confirmClose?.();
    };

    window.addEventListener("beforeunload", flushSynchronously);
    window.addEventListener("pagehide", flushSynchronously);
    document.addEventListener("visibilitychange", flushSynchronously);

    const unsubscribeBeforeClose = window.desktopBridge?.app.onBeforeClose?.(handleBeforeClose) ?? (() => {});

    return () => {
      window.removeEventListener("beforeunload", flushSynchronously);
      window.removeEventListener("pagehide", flushSynchronously);
      document.removeEventListener("visibilitychange", flushSynchronously);
      unsubscribeBeforeClose();
    };
  }, [dayzApi, flushWorkspaceState, isDesktop]);

  return {
    flushWorkspaceState,
  };
}
