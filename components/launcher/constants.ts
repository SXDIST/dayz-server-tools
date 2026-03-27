import { FileCog, Image, PackageSearch, ServerCog, Siren } from "lucide-react";

export type ModuleId = "dayz-server" | "image-to-paa" | "crash-tools" | "rvmat-editor" | "model-tools";

export const modules = [
  {
    id: "dayz-server" as ModuleId,
    name: "DayZ Server",
    note: "Server manager",
    icon: ServerCog,
    status: "Ready",
  },
  {
    id: "image-to-paa" as ModuleId,
    name: "Image To PAA",
    note: "Image conversion",
    icon: Image,
    status: "Preview",
  },
  {
    id: "crash-tools" as ModuleId,
    name: "Crash Tools",
    note: "Crash diagnostics",
    icon: Siren,
    status: "Ready",
  },
  {
    id: "rvmat-editor" as ModuleId,
    name: "RVMAT Editor",
    note: "Material editor",
    icon: FileCog,
    status: "Planned",
  },
  {
    id: "model-tools" as ModuleId,
    name: "Model Tools",
    note: "Addon validation",
    icon: PackageSearch,
    status: "Planned",
  },
] as const;
