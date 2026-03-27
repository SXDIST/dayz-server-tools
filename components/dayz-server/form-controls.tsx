"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flatOptions = options.flatMap((option) => {
    if (typeof option === "string" || ("value" in option && "label" in option)) {
      return [option];
    }

    return option.options;
  });

  const selectedOption = flatOptions.find((option) =>
    typeof option === "string" ? option === value : option.value === value,
  );
  const selectedLabel =
    typeof selectedOption === "string"
      ? selectedOption
      : selectedOption?.label ?? value;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-input/30 px-4 text-sm text-foreground outline-none transition-colors hover:bg-input/40"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="animate-[panel-fade_180ms_ease-out] absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-border bg-popover p-2 shadow-lg">
          <div className="max-h-80 space-y-1 overflow-auto pr-1">
            {options.map((option) => {
              if (typeof option !== "string" && "groupLabel" in option) {
                return (
                  <div key={option.groupLabel} className="space-y-1 py-1">
                    <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                      {option.groupLabel}
                    </div>
                    {option.options.map((groupOption) => {
                      const optionValue = typeof groupOption === "string" ? groupOption : groupOption.value;
                      const optionLabel = typeof groupOption === "string" ? groupOption : groupOption.label;

                      return (
                        <button
                          key={optionValue}
                          type="button"
                          onClick={() => {
                            onValueChange(optionValue);
                            setOpen(false);
                          }}
                          className={cn(
                            "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            value === optionValue
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                          )}
                        >
                          {optionLabel}
                        </button>
                      );
                    })}
                  </div>
                );
              }

              const optionValue = typeof option === "string" ? option : option.value;
              const optionLabel = typeof option === "string" ? option : option.label;

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => {
                    onValueChange(optionValue);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    value === optionValue
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
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
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className="inline-flex w-auto items-center gap-3 rounded-xl border border-input bg-input/30 px-3 py-2 text-left transition-colors duration-200 hover:bg-input/45"
    >
      <span
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-1 transition-all duration-200",
          checked ? "bg-primary/70" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-white transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  );
}
