"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  FileCog,
  Image,
  PackageSearch,
  Search,
  ServerCog,
  Settings2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ModuleId = "dayz-server" | "image-to-paa" | "rvmat-editor" | "model-tools";
type ServerTab = "overview" | "mods" | "config" | "admins" | "missions" | "paths";

const modules = [
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
    status: "Planned",
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
];

const serverTabs: { id: ServerTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mods", label: "Mods" },
  { id: "config", label: "Server.cfg" },
  { id: "admins", label: "Admin Tools" },
  { id: "missions", label: "Missions" },
  { id: "paths", label: "Paths" },
];

const quickActions = [
  "Open server folder",
  "Import Workshop collection",
  "Load existing server.cfg",
  "Open active mission",
];

const mods = [
  { name: "@CF", source: "Steam Workshop", state: "Installed" },
  { name: "@VPPAdminTools", source: "Steam Workshop", state: "Queued" },
  { name: "@BuilderItems", source: "Local Folder", state: "Installed" },
];

const configGroups = [
  { title: "Network", items: ["hostname", "maxPlayers", "verifySignatures"] },
  { title: "Gameplay", items: ["serverTime", "disableVoN", "respawnTime"] },
  { title: "Logging", items: ["adminLogPlayerHitsOnly", "storageAutoFix", "instanceId"] },
];

const adminTools = [
  ["VPPAdminTools", "Автонастройка профилей, прав и базовых файлов."],
  ["Community Online Tools", "Инициализация ролей и конфигов разрешений."],
];

const missions = [
  ["chernarusplus", "Основная production-миссия"],
  ["enoch", "Профиль Livonia"],
  ["custom.namalsk", "Кастомная миссия"],
];

const serverPaths = [
  ["DayZ Server Root", "D:\\Games\\DayZServer", "Обязательный путь"],
  ["Profiles", "D:\\Games\\DayZServer\\profiles", "Опционально"],
  ["Keys", "D:\\Games\\DayZServer\\keys", "Обычно определяется автоматически"],
  ["mpmissions", "D:\\Games\\DayZServer\\mpmissions", "Папка миссий"],
];

function SidebarItem({
  active,
  title,
  note,
  status,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  note: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        active ? "bg-[#173244] text-white" : "text-slate-300 hover:bg-white/6",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-cyan-400/14" : "bg-white/6",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {status}
          </span>
        </div>
        <p className="truncate text-xs text-slate-400">{note}</p>
      </div>
    </button>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
      )}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/4">
      <div className="border-b border-white/8 px-5 py-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({
  title,
  description,
  trailing,
}: {
  title: string;
  description: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="truncate text-sm text-slate-400">{description}</p>
      </div>
      {trailing}
    </div>
  );
}

function PlaceholderModule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      <Section title={title} description={description}>
        <div className="space-y-2">
          <Row title="Status" description="Модуль запланирован как отдельный workspace." />
          <Row title="Approach" description="Общий shell лаунчера останется тем же, изменится только содержимое main pane." />
        </div>
      </Section>
    </div>
  );
}

export function LauncherShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dayz-server");
  const [serverTab, setServerTab] = useState<ServerTab>("overview");

  const activeModuleData = useMemo(
    () => modules.find((item) => item.id === activeModule) ?? modules[0],
    [activeModule],
  );

  const renderServerContent = () => {
    switch (serverTab) {
      case "overview":
        return (
          <div className="space-y-4">
            <Section
              title="Quick Actions"
              description="Короткие действия вместо больших hero-блоков и dashboard-витрин."
            >
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <Button key={action} variant={action === quickActions[0] ? "primary" : "outline"}>
                    {action}
                  </Button>
                ))}
              </div>
            </Section>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Section title="Setup Flow" description="Основной сценарий настройки сервера.">
                {[
                  "Указать папку DayZ Server",
                  "Импортировать моды",
                  "Настроить server.cfg",
                  "Подготовить админку и миссии",
                ].map((step, index) => (
                  <Row
                    key={step}
                    title={`Step 0${index + 1}`}
                    description={step}
                  />
                ))}
              </Section>

              <Section title="Current State" description="Текущая сводка по workspace.">
                <Row title="Server Root" description="D:\\Games\\DayZServer" />
                <Row title="Mods" description="3 items in active preset" />
                <Row title="Admin Tool" description="VPPAdminTools selected" />
              </Section>
            </div>
          </div>
        );

      case "mods":
        return (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Section title="Active Mod Preset" description="Активный набор модов.">
              {mods.map((mod) => (
                <Row
                  key={mod.name}
                  title={mod.name}
                  description={mod.source}
                  trailing={<Badge>{mod.state}</Badge>}
                />
              ))}
            </Section>

            <Section title="Import" description="Steam collection, publishedfileid или локальная папка.">
              <div className="space-y-3">
                <Input readOnly value="https://steamcommunity.com/sharedfiles/filedetails/?id=..." />
                <Input readOnly value="D:\\Mods\\@BuilderItems" />
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Sync Workshop Mods</Button>
                  <Button variant="outline">Add Local Mod</Button>
                </div>
              </div>
            </Section>
          </div>
        );

      case "config":
        return (
          <div className="grid gap-4 xl:grid-cols-3">
            {configGroups.map((group) => (
              <Section key={group.title} title={group.title} description="Сгруппированные поля.">
                {group.items.map((item) => (
                  <Row key={item} title={item} description="Editable field" />
                ))}
              </Section>
            ))}
          </div>
        );

      case "admins":
        return (
          <Section title="Admin Tools" description="Выбор и инициализация административного инструмента.">
            {adminTools.map(([title, description]) => (
              <Row key={title} title={title} description={description} />
            ))}
            <div className="pt-4">
              <Button variant="primary">Setup Selected Tool</Button>
            </div>
          </Section>
        );

      case "missions":
        return (
          <Section title="Missions" description="Управление mpmissions и пресетами миссий.">
            {missions.map(([title, description]) => (
              <Row key={title} title={title} description={description} />
            ))}
            <div className="pt-4">
              <Button variant="primary">Open Mission Manager</Button>
            </div>
          </Section>
        );

      case "paths":
        return (
          <Section title="Advanced Paths" description="Переопределение путей для нестандартных инсталляций.">
            <div className="space-y-3">
              {serverPaths.map(([label, value, note]) => (
                <div
                  key={label}
                  className="grid gap-2 rounded-xl border border-white/8 bg-black/10 p-4 xl:grid-cols-[180px_1fr]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="mt-1 text-xs text-slate-400">{note}</p>
                  </div>
                  <Input readOnly value={value} />
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="primary">Save Path Overrides</Button>
                <Button variant="outline">Reset to Auto</Button>
              </div>
            </div>
          </Section>
        );
    }
  };

  const renderContent = () => {
    switch (activeModule) {
      case "dayz-server":
        return renderServerContent();
      case "image-to-paa":
        return (
          <PlaceholderModule
            title="Image To PAA"
            description="Будущий модуль для конвертации изображений в PAA."
          />
        );
      case "rvmat-editor":
        return (
          <PlaceholderModule
            title="RVMAT Editor"
            description="Будущий редактор материалов и путей текстур."
          />
        );
      case "model-tools":
        return (
          <PlaceholderModule
            title="Model Tools"
            description="Будущий модуль проверки структуры аддонов и ассетов."
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#09111d_0%,#0d1524_100%)] text-white">
      <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-white/8 bg-[#121a28]">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/8">
                  <Boxes className="size-4" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">DayZ Tools</p>
                  <p className="text-xs text-slate-400">Launcher suite</p>
                </div>
              </div>
            </div>

            <div className="border-b border-white/8 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                <Search className="size-4 text-slate-500" />
                <span className="text-sm text-slate-500">Search tools</span>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-auto px-3 py-4">
              <div className="space-y-1">
                <p className="px-2 pb-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Modules
                </p>
                {modules.map((module) => (
                  <SidebarItem
                    key={module.id}
                    active={activeModule === module.id}
                    title={module.name}
                    note={module.note}
                    status={module.status}
                    icon={module.icon}
                    onClick={() => setActiveModule(module.id)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-white/8 px-3 py-3">
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-300 hover:bg-white/6">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/6">
                  <Settings2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Settings</p>
                  <p className="text-xs text-slate-400">Launcher preferences</p>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 p-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Module</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">{activeModuleData.name}</h1>
                <p className="mt-1 text-sm text-slate-400">{activeModuleData.note}</p>
              </div>
              <Badge variant="accent">{activeModuleData.status}</Badge>
            </div>

            {activeModule === "dayz-server" ? (
              <div className="flex flex-wrap gap-2 border-b border-white/8 pb-4">
                {serverTabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    active={serverTab === tab.id}
                    label={tab.label}
                    onClick={() => setServerTab(tab.id)}
                  />
                ))}
              </div>
            ) : null}

            {renderContent()}
          </div>
        </section>
      </div>
    </main>
  );
}
