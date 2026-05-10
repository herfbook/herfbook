import { useEffect, useMemo, useRef, useState } from "react";
import { Cigarette, ChevronsUpDown, Check, Loader2, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";
import { useCigar, useCigars } from "@/features/cigars/queries";
import { CigarFormDialog } from "@/features/cigars/components/cigar-form-dialog";
import type { CigarDetail, CigarListItem } from "@/features/cigars/types";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatCigarLabel(c: CigarListItem | CigarDetail): string {
  const parts = [c.brand_name, c.line, c.vitola_name].filter(Boolean);
  return parts.join(" · ");
}

export function CigarPickerCombobox({
  value,
  onChange,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCigars({ q: debouncedQuery, limit: 50 });
  const selected = useCigar(value ?? "");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  useEffect(() => {
    if (open) {
      const handle = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(handle);
    }
  }, [open]);

  const results = search.data?.items ?? [];

  const showCreateRow = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return false;
    const lc = q.toLowerCase();
    return !results.some(
      (c) =>
        formatCigarLabel(c).toLowerCase() === lc ||
        c.brand_name.toLowerCase() === lc
    );
  }, [debouncedQuery, results]);

  const triggerLabel = (() => {
    if (selected.data) return formatCigarLabel(selected.data);
    if (selected.isLoading && value) return "Loading…";
    return placeholder ?? "Select cigar…";
  })();

  function handleSelect(c: CigarListItem) {
    onChange(c.id);
    setOpen(false);
  }

  function handleCreated(c: CigarDetail) {
    onChange(c.id);
    setCreateOpen(false);
    setOpen(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !selected.data && "text-muted-foreground"
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          sideOffset={4}
        >
          <div className="border-b p-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cigars…"
              className="h-8"
            />
          </div>
          <div className="max-h-72 overflow-auto p-1">
            {search.isLoading ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 && !showCreateRow ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {debouncedQuery.trim()
                  ? `No matches for "${debouncedQuery.trim()}"`
                  : "No cigars yet"}
              </div>
            ) : (
              <>
                {results.map((c) => {
                  const isSelected = c.id === value;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/50"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                        {c.primary_image_url ? (
                          <img
                            src={c.primary_image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Cigarette className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </div>
                      <span className="flex-1 truncate">
                        {formatCigarLabel(c)}
                      </span>
                    </button>
                  );
                })}
                {showCreateRow && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="mt-1 flex w-full items-center gap-2 rounded-sm border-t px-2 py-1.5 pt-2.5 text-left text-sm text-primary transition-colors hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      Couldn't find &ldquo;{debouncedQuery.trim()}&rdquo;?{" "}
                      <span className="font-medium">Create new cigar</span>
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <CigarFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </>
  );
}
