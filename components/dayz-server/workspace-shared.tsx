import type { ReactNode } from "react";

import {
  WorkspaceField,
  WorkspaceInfoRow,
  WorkspacePanel,
  WorkspaceTabButton,
} from "@/components/workspace/workspace-kit";

export function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return <WorkspaceTabButton active={active} label={label} onClick={onClick} />;
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <WorkspacePanel title={title} description={description} contentClassName="p-5">
      {children}
    </WorkspacePanel>
  );
}

export function Row({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <WorkspaceInfoRow label={title} value={<p className="text-sm text-muted-foreground">{description}</p>} />;
}

export function ConfigField({
  label,
  description,
  control,
}: {
  label: string;
  description: string;
  control: ReactNode;
}) {
  return <WorkspaceField label={label} description={description} control={control} />;
}
