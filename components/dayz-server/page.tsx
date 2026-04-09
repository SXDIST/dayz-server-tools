"use client";

import { useDayzPageController } from "@/components/dayz-server/hooks/use-dayz-page-controller";
import { DayzServerWorkspace } from "@/components/dayz-server/workspace";

export function DayzServerPage() {
  const workspaceProps = useDayzPageController();

  return <DayzServerWorkspace {...workspaceProps} />;
}
