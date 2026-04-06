"use client";

import { useEffect, useState } from "react";

function readBridgeState() {
  const bridge = typeof window !== "undefined" ? window.desktopBridge : undefined;
  const dayzApi = bridge?.dayz;
  const isDesktop = bridge?.isElectron === true && typeof dayzApi?.getWorkspaceState === "function";

  return {
    bridge,
    dayzApi,
    isDesktop,
  };
}

export function useDesktopBridge() {
  const [state, setState] = useState(readBridgeState);

  useEffect(() => {
    if (state.isDesktop) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextState = readBridgeState();

      setState((current) => {
        if (
          current.bridge === nextState.bridge &&
          current.dayzApi === nextState.dayzApi &&
          current.isDesktop === nextState.isDesktop
        ) {
          return current;
        }

        return nextState;
      });

      if (nextState.isDesktop) {
        window.clearInterval(intervalId);
      }
    }, 150);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state.isDesktop]);

  return state;
}
