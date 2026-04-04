"use client";

export type ModuleId = "dayz-server";

export const modules = [
  {
    id: "dayz-server" as ModuleId,
    name: "DayZ Server",
  },
] as const;
