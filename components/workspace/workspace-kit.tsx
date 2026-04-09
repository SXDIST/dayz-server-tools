"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SelectOption =
  | string
  | { label: string; value: string }
  | {
      groupLabel: string;
      options: Array<string | { label: string; value: string }>;
    };

export function WorkspacePage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("workspace-page flex min-h-0 flex-col gap-5", className)}>{children}</div>;
}

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "workspace-page-header rounded-xl border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow ? <p className="text-sm text-muted-foreground">{eyebrow}</p> : null}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
              {title}
            </h1>
            {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="workspace-page-header__actions flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function WorkspacePanel({
  title,
  description,
  icon: Icon,
  actions,
  className,
  contentClassName,
  children,
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "workspace-panel rounded-xl border bg-card shadow-none",
        className,
      )}
    >
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex items-start gap-3">
              {Icon ? (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              ) : null}
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
              </div>
            </div>
          </div>
          {actions ? <div className="workspace-panel__actions flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("workspace-panel__content", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function WorkspaceToolbar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("workspace-toolbar flex flex-wrap items-center gap-3", className)}>{children}</div>;
}

export function WorkspaceField({
  label,
  description,
  control,
  className,
}: {
  label: string;
  description?: string;
  control: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "workspace-field grid gap-3 border-b border-border/60 py-4 last:border-b-0 last:pb-0 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="min-w-0">{control}</div>
    </div>
  );
}

export function WorkspaceInfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("workspace-info-row rounded-lg border bg-muted/30 p-4", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm text-foreground">{value}</div>
    </div>
  );
}

export function WorkspaceMetricTile({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "workspace-metric-tile rounded-lg border bg-muted/30 p-4",
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {note ? <p className="mt-2 text-sm text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function WorkspaceEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("workspace-empty-state rounded-lg border border-dashed bg-muted/20", className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon className="size-5" />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

function normalizeSelectOption(option: string | { label: string; value: string }) {
  return typeof option === "string"
    ? {
        value: option,
        label: option,
      }
    : option;
}

export function WorkspaceSelectField({
  value,
  options,
  onValueChange,
  className,
}: {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroupKey, setActiveGroupKey] = useState<string>("all");

  const groups = useMemo(() => {
    return options.map((option, index) => {
      if (typeof option !== "string" && "groupLabel" in option) {
        return {
          key: `group-${option.groupLabel}-${index}`,
          label: option.groupLabel,
          options: option.options.map(normalizeSelectOption),
        };
      }

      return {
        key: `option-${index}`,
        label: "",
        options: [normalizeSelectOption(option)],
      };
    });
  }, [options]);

  const groupedOptions = useMemo(
    () => groups.filter((group) => group.label),
    [groups],
  );
  const hasCategoryTabs = groupedOptions.length > 1;

  const flatOptions = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const selectedOption = flatOptions.find((option) => option.value === value) ?? null;
  const selectedLabel = selectedOption?.label ?? value;
  const selectedGroupKey = useMemo(
    () =>
      groups.find((group) => group.options.some((option) => option.value === value))?.key ?? "all",
    [groups, value],
  );
  const visibleGroups = useMemo(() => {
    if (activeGroupKey === "all") {
      return groups;
    }

    return groups.filter((group) => group.key === activeGroupKey);
  }, [activeGroupKey, groups]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            className,
          )}
          onClick={() => {
            setActiveGroupKey(hasCategoryTabs ? selectedGroupKey : "all");
          }}
        >
          <span className="truncate text-left">{selectedLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--anchor-width)] min-w-[var(--anchor-width)] gap-0 rounded-lg p-0">
        <Command shouldFilter>
          {hasCategoryTabs ? (
            <div className="flex flex-wrap gap-2 border-b px-2 py-2">
              <button
                type="button"
                onClick={() => setActiveGroupKey("all")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  activeGroupKey === "all"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                All
              </button>
              {groupedOptions.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setActiveGroupKey(group.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    activeGroupKey === group.key
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="border-b p-2">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search..."
              className="w-full"
            />
          </div>
          <CommandList className="max-h-72">
            <CommandEmpty>No results found.</CommandEmpty>
            {visibleGroups.map((group) => (
              <CommandGroup key={group.key} heading={group.label || undefined}>
                {group.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>{option.label}</span>
                    <Check className={cn("size-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function WorkspaceToggleField({
  checked,
  label,
  description,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  label: string;
  description?: string;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "workspace-toggle group/field flex w-full items-center gap-3 rounded-lg border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(nextChecked) => onCheckedChange(Boolean(nextChecked))}
        className="pointer-events-none"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {checked ? <Check className="size-3.5 text-primary" /> : null}
        </div>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </button>
  );
}

export function WorkspaceTabButton({
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
      type="button"
      onClick={onClick}
      className={cn(
        "workspace-tab-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {active ? <ChevronRight className="size-4" /> : null}
    </button>
  );
}
