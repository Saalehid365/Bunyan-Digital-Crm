"use client";

import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string; dot?: string };

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const hasSelection = selected.length > 0;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 border-dashed text-xs",
            hasSelection && "border-solid border-primary/40 bg-primary/5 text-foreground",
          )}
        >
          {label}
          {hasSelection ? (
            <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[10px] tabular-nums text-primary">
              {selected.length}
            </span>
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <div className="max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No options</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox checked={selected.includes(opt.value)} onCheckedChange={() => toggle(opt.value)} />
                {opt.dot ? <span className={cn("h-2 w-2 shrink-0 rounded-full", opt.dot)} /> : null}
                <span className="truncate text-foreground">{opt.label}</span>
              </label>
            ))
          )}
        </div>
        {hasSelection ? (
          <button
            onClick={() => onChange([])}
            className="mt-1 flex w-full items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
