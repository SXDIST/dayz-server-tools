"use client";

import {
  WorkspaceSelectField,
  WorkspaceToggleField,
} from "@/components/workspace/workspace-kit";

export function SelectField({
  value,
  options,
  onValueChange,
}: {
  value: string;
  options: Array<
    | string
    | { label: string; value: string }
    | {
        groupLabel: string;
        options: Array<string | { label: string; value: string }>;
      }
  >;
  onValueChange: (value: string) => void;
}) {
  return <WorkspaceSelectField value={value} options={options} onValueChange={onValueChange} />;
}

export function ToggleField({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return <WorkspaceToggleField checked={checked} label={label} onCheckedChange={onCheckedChange} />;
}
